// Copyright 2018 The Outline Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { execSync } from "child_process";
import { ConnectionStatus, RoutingDaemon } from "./routing_service";
import { powerMonitor } from "electron";
import { checkUdpForwardingEnabled, isServerReachable } from "./connectivity";
import { ChildProcess, spawn } from "child_process";
import {
  pathToEmbeddedBinary,
  RemoteServer,
  DNS_NATIVE_WEBSITES_FILE_PATH,
} from "./utils";
import { SMART_DNS_ADDRESS } from "../src/constants";
import { BrowserWindow, app } from "electron";
import { validateServerCredentials } from "../src/share";
import { logger } from "./log";
import * as path from "path";
import * as fs from "fs";

export type Route = {
  proxy: string[];
  reserved: string[];
};

const PROXY_ADDRESS = "127.0.0.1";
const PROXY_PORT = 1081;

const TUN2SOCKS_TAP_DEVICE_NAME = "shadowsocksGlobal-tap0";

//Must be different with Outline
const TUN2SOCKS_TAP_DEVICE_IP = "10.0.85.3";
const TUN2SOCKS_VIRTUAL_ROUTER_IP = "10.0.85.1";
const TUN2SOCKS_VIRTUAL_ROUTER_NETMASK = "255.255.255.0";

// Raises an error if:
//  - the TAP device does not exist
//  - the TAP device does not have the expected IP/subnet
//
// Note that this will *also* throw if netsh is not on the PATH. If that's the case then the
// installer should have failed, too.
//
// Only works on Windows!
//
// TODO: Probably should be moved to a new file, e.g. configuation.ts.
function testTapDevice() {
  // Sample output:
  // =============
  // $ netsh interface ipv4 dump
  // # ----------------------------------
  // # IPv4 Configuration
  // # ----------------------------------
  // pushd interface ipv4
  //
  // reset
  // set global icmpredirects=disabled
  // set interface interface="Ethernet" forwarding=enabled advertise=enabled nud=enabled
  // ignoredefaultroutes=disabled set interface interface="outline-tap0" forwarding=enabled
  // advertise=enabled nud=enabled ignoredefaultroutes=disabled add address name="outline-tap0"
  // address=10.0.85.2 mask=255.255.255.0
  //
  // popd
  // # End of IPv4 configuration
  const lines = execSync(`netsh interface ipv4 dump`).toString().split("\n");

  // Find lines containing the TAP device name.
  const tapLines = lines.filter(
    (s) => s.indexOf(TUN2SOCKS_TAP_DEVICE_NAME) !== -1
  );
  if (tapLines.length < 1) {
    throw new Error("TAP device not found");
  }

  // Within those lines, search for the expected IP.
  if (
    tapLines.filter((s) => s.indexOf(TUN2SOCKS_TAP_DEVICE_IP) !== -1).length < 1
  ) {
    throw new Error("TAP device has wrong IP");
  }
}

// Establishes a full-system VPN with the help of Outline's routing daemon and child processes
// ss-local and tun2socks. Follows the Mediator pattern in that none of the three "helpers" know
// anything about the others.
//
// In addition to the basic lifecycle of the three helper processes, this handles a few special
// situations:
//  - repeat the UDP test when the network changes and restart tun2socks if the result has changed
//  - silently restart tun2socks when the system is about to suspend (Windows only)
export class ConnectionManager {
  readonly proxyAddress: string;
  readonly proxyPort: number;

  private isUdpEnabled = false;

  private readonly routing: RoutingDaemon;
  private readonly ssLocal: SsLocal | null;
  private readonly tun2socks: Tun2socks;
  private readonly smartDns: SmartDns | null;

  // Extracted out to an instance variable because in certain situations, notably a change in UDP
  // support, we need to stop and restart tun2socks *without notifying the client* and this allows
  // us swap the listener in and out.
  private tun2socksExitListener?: () => void | undefined;

  // See #resumeListener.
  private terminated = false;

  private isDisconnecting = false;

  private readonly onAllHelpersStopped: Promise<void>;

  private reconnectingListener?: () => void;

  private reconnectedListener?: () => void;

  constructor(
    private remoteServer: RemoteServer,
    private isProxyUdp: boolean,
    private route: Route,
    private dns:
      | {
          type: "smart";
          server: { native: string; default: string };
          whiteListServers: string[];
        }
      | {
          type: "customized";
          server: { alternate: string; preferred: string };
          whiteListServers: string[];
        },
    private mainWindow: BrowserWindow | null
  ) {
    const isSocks5 = remoteServer.type === "socks5";
    const isSmartDns = dns.type === "smart";

    this.routing = new RoutingDaemon(route, {
      servers: isSmartDns ? [SMART_DNS_ADDRESS] : Object.values(dns.server),
      whiteListServers: dns.whiteListServers,
    });

    this.proxyAddress = isSocks5 ? remoteServer.host : PROXY_ADDRESS;
    this.proxyPort = isSocks5
      ? Number(remoteServer.port)
      : remoteServer.local_port || PROXY_PORT;

    this.tun2socks = new Tun2socks(this.proxyAddress, this.proxyPort);
    this.smartDns = isSmartDns
      ? new SmartDns(dns.server as { native: string; default: string })
      : null;
    this.ssLocal = isSocks5 ? null : new SsLocal(this.proxyPort);

    // This trio of Promises, each tied to a helper process' exit, is key to the instance's
    // lifecycle:
    //  - once any helper fails or exits, stop them all
    //  - once *all* helpers have stopped, we're done
    const exits = [
      this.routing.onceDisconnected,
      new Promise<void>((fulfill) => {
        this.tun2socksExitListener = fulfill;
        this.tun2socks.onExit = this.tun2socksExitListener;
      }),
    ];

    if (this.ssLocal) {
      exits.push(
        // This Promise cant't be fulfilled when in Socks5 proxy mode,
        // so it must not be added to exits in the case.
        new Promise<void>((fulfill) => {
          if (this.ssLocal) this.ssLocal.onExit = fulfill;
        })
      );
    }
    if (this.smartDns)
      exits.push(
        // This Promise cant't be fulfilled when the smartDns is enabled,
        // so it must not be added to exits in the case.
        new Promise<void>((fulfill) => {
          if (this.smartDns) this.smartDns.onExit = fulfill;
        })
      );

    Promise.race(exits).then(() => {
      logger.info("a helper has exited, disconnecting");
      this.isDisconnecting = true;
      this.stop();
    });
    this.onAllHelpersStopped = Promise.all(exits).then(() => {
      logger.info("all helpers have exited");
      this.terminated = true;
    });

    // Handle network changes and, on Windows, suspend events.
    this.routing.onNetworkChange = this.networkChanged.bind(this);
    powerMonitor.on("suspend", this.suspendListener.bind(this));
    powerMonitor.on("resume", this.resumeListener.bind(this));
  }
  private suspendListener() {
    // Swap out the current listener, restart once the system resumes.
    this.tun2socks.onExit = () => {
      logger.info("stopped tun2socks in preparation for suspend");
    };
  }

  private resumeListener() {
    if (this.terminated) {
      // NOTE: Cannot remove resume listeners - Electron bug?
      logger.error(
        "resume event invoked but this connection is terminated - doing nothing"
      );
      return;
    }

    logger.info("restarting tun2socks after resume");

    this.tun2socks.onExit = this.tun2socksExitListener;
    this.tun2socks.start(this.isProxyUdp && this.isUdpEnabled);

    // Check if UDP support has changed; if so, silently restart.
    //TODO:retestUdp
    // this.retestUdp();
  }

  // Fulfills once all three helpers have started successfully.
  async start() {
    await this.mainWindow?.webContents.send(
      "message",
      "Checking tap device..."
    );

    testTapDevice();

    // ss-local must be up in order to test UDP support and validate credentials.
    if (this.ssLocal) {
      this.ssLocal.start(this.remoteServer);
      await this.mainWindow?.webContents.send(
        "updateMessage",
        "Checking ss-local..."
      );
    }

    await isServerReachable(this.proxyAddress, this.proxyPort);

    await this.mainWindow?.webContents.send("updateMessage", "Checking Udp...");
    if (this.isProxyUdp)
      this.isUdpEnabled = await checkUdpForwardingEnabled(
        this.proxyAddress,
        this.proxyPort
      );
    await this.mainWindow?.webContents.send(
      "udpStatus",
      this.isUdpEnabled ? "enabled" : "disabled"
    );

    await this.mainWindow?.webContents.send(
      "updateMessage",
      "Checking server..."
    );
    await validateServerCredentials(this.proxyAddress, this.proxyPort);

    // Don't validate credentials on boot: if the key was revoked, we want the system to stay
    // "connected" so that traffic doesn't leak.
    /*if (!this.isAutoConnect) {
    await validateServerCredentials(PROXY_ADDRESS, PROXY_PORT);
  }*/
    await this.mainWindow?.webContents.send(
      "updateMessage",
      "Staring tun2socks..."
    );

    this.tun2socks.start(this.isProxyUdp && this.isUdpEnabled);

    //TODO: Implement a listener that terminates the start process once this.disconnecting become true.
    if (this.isDisconnecting)
      throw new Error(
        "Fail to start one or some of smartDns,ss-local,tun2socks"
      );

    if (this.smartDns) {
      await this.mainWindow?.webContents.send(
        "updateMessage",
        "Starting SmartDns..."
      );
      await this.smartDns.start();
    }

    if (this.isDisconnecting)
      throw new Error(
        "Fail to start one or some of smartDns,ss-local,tun2socks"
      );
    await this.mainWindow?.webContents.send(
      "updateMessage",
      "Configuring routes..."
    );

    await this.routing.start();
  }

  private networkChanged(status: ConnectionStatus) {
    if (status === ConnectionStatus.CONNECTED) {
      if (this.reconnectedListener) {
        this.reconnectedListener();
      }

      // Test whether UDP availability has changed; since it won't change 99% of the time, do this
      // *after* we've informed the client we've reconnected.
      //this.retestUdp();
    } else if (status === ConnectionStatus.RECONNECTING) {
      if (this.reconnectingListener) {
        this.reconnectingListener();
      }
    } else {
      console.error(
        `unknown network change status ${status} from routing daemon`
      );
    }
  }

  // Use #onceStopped to be notified when the connection terminates.
  stop() {
    powerMonitor.removeAllListeners("suspend");
    powerMonitor.removeAllListeners("resume");

    try {
      this.routing.stop();
    } catch (e) {
      // This can happen for several reasons, e.g. the daemon may have stopped while we were
      // connected.
      logger.error(`could not stop routing: ${e.message}`);
    }

    if (this.ssLocal) this.ssLocal.stop();
    if (this.smartDns) this.smartDns.stop();
    this.tun2socks.stop();
  }

  // Fulfills once all three helper processes have stopped.
  //
  // When this happens, *as many changes made to the system in order to establish the full-system
  // VPN as possible* will have been reverted.
  public get onceStopped() {
    return this.onAllHelpersStopped;
  }

  // Sets an optional callback for when the routing daemon is attempting to re-connect.
  public set onReconnecting(newListener: () => void | undefined) {
    this.reconnectingListener = newListener;
  }

  // Sets an optional callback for when the routing daemon successfully reconnects.
  public set onReconnected(newListener: () => void | undefined) {
    this.reconnectedListener = newListener;
  }
}
// Simple "one shot" child process launcher.
//
// NOTE: Because there is no way in Node.js to tell whether a process launched successfully,
//       #startInternal always succeeds; use #onExit to be notified when the process has exited
//       (which may be immediately after calling #startInternal if, e.g. the binary cannot be
//       found).
const MAX_RESTART_INTERVAL_MS = 2000;
class ChildProcessHelper {
  //Whether the process is killed by "this.stop"
  private isExiting = false;

  private lastExitTime: number | undefined;

  private process?: ChildProcess;

  private exitListener?: () => void;

  constructor(private path: string) {}

  protected launch(args: string[]) {
    this.process = spawn(this.path, args);
    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => {
        logger.info(`stdout: ${data}`);
      });
    }
    if (this.process.stderr)
      this.process.stderr.on("data", (data) => {
        logger.error(`stderr: ${data}`);
      });

    const onError = () => {
      if (this.process) {
        this.process.removeAllListeners();
      }

      if (this.exitListener) {
        this.exitListener();
      }
    };
    const onExit = () => {
      if (this.process) {
        this.process.removeAllListeners();
      }
      const restart = () => {
        logger.info(`Restart ${path.basename(this.path)}`);
        this.launch(args);
      };
      //Restarted the process if it's not killed by "this.stop"
      if (!this.isExiting) {
        if (!this.lastExitTime) {
          this.lastExitTime = Date.now();
          return restart();
        }
        const currentExitTime = Date.now();
        const internal = currentExitTime - this.lastExitTime;
        if (internal > MAX_RESTART_INTERVAL_MS) {
          this.lastExitTime = currentExitTime;
          return restart();
        }
      }
      if (this.exitListener) {
        this.exitListener();
      }
    };

    // We have to listen for both events: error means the process could not be launched and in that
    // case exit will not be invoked.
    this.process.on("error", onError.bind(this));
    this.process.on("exit", onExit.bind(this));
  }

  // Use #onExit to be notified when the process exits.
  stop() {
    if (!this.process) {
      // Never started.
      if (this.exitListener) {
        this.exitListener();
      }
      return;
    }

    this.isExiting = true;
    this.process.kill();
  }

  set onExit(newListener: (() => void) | undefined) {
    this.exitListener = newListener;
  }
}

class SmartDns extends ChildProcessHelper {
  private confPath = path.join(
    app.getPath("userData"),
    "accelerated-domains.china.conf"
  );
  constructor(private server: { default: string; native: string }) {
    super(pathToEmbeddedBinary("unbound", "unbound"));
  }
  async makeConf() {
    const txt = await fs.promises.readFile(DNS_NATIVE_WEBSITES_FILE_PATH);
    const domains = txt.toString().trim().split("\n");
    let conf = "";
    domains.forEach((domain) => {
      conf += `
forward-zone:
  name:"${domain}."
  forward-addr: ${this.server.native}`;
    });
    conf =
      `
server:
	  # verbosity level 0-4 of logging
	  verbosity: 0
forward-zone:
  name:"."
  forward-addr: ${this.server.default}
  ` + conf;
    await fs.promises.writeFile(this.confPath, conf.trim());
  }
  async start() {
    await this.makeConf();
    const args = ["-c", this.confPath];
    this.launch(args);
  }
}

class Tun2socks extends ChildProcessHelper {
  constructor(private proxyAddress: string, private proxyPort: number) {
    super(pathToEmbeddedBinary("go-tun2socks", "tun2socks"));
  }

  start(isUdpEnabled: boolean) {
    const args: string[] = [];
    args.push("-tunName", TUN2SOCKS_TAP_DEVICE_NAME);
    args.push("-tunAddr", TUN2SOCKS_TAP_DEVICE_IP);
    args.push("-tunMask", TUN2SOCKS_VIRTUAL_ROUTER_NETMASK);
    args.push("-tunGw", TUN2SOCKS_VIRTUAL_ROUTER_IP);
    args.push("-proxyServer", `${this.proxyAddress}:${this.proxyPort}`);
    args.push("-loglevel", "error");
    if (!isUdpEnabled) {
      args.push("-dnsFallback");
    }

    this.launch(args);
  }
}

export class SsLocal extends ChildProcessHelper {
  constructor(private readonly proxyPort: number) {
    super(pathToEmbeddedBinary("shadowsocks-libev", "ss-local"));
  }

  start(config: Omit<RemoteServer, "type">) {
    // ss-local -s x.x.x.x -p 65336 -k mypassword -m aes-128-cfb -l 1081 -u
    const args = ["-l", this.proxyPort.toString()];
    args.push("-s", config.host || "");
    args.push("-p", "" + config.port);
    args.push("-k", config.password || "");
    args.push("-m", config.method || "");
    args.push("-u");

    //Enable SIP003 plugin.
    args.push("--plugin", config.plugin || "");
    args.push("--plugin-opts", config.plugin_opts || "");

    this.launch(args);
  }
}
