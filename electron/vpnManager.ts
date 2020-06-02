import { ConnectionManager, Dns } from "./process_manager";
import { Config, getAppState, RemoteServer } from "./utils";
import { ConnectionStatus } from "./routing_service";
import { AppTray } from "./tray";
import { getFlow } from "./flow";
import {
  sendConnectionStatus,
  sendFlowToRender,
  sendMessageToRender,
} from "./ipc";
import { getActivatedServer } from "../src/components/Proxies/util";
import { lookupIp } from "../src/share";

export class VpnManager {
  private currentConnection: ConnectionManager | undefined;
  private flowTimer: NodeJS.Timer | undefined;

  constructor(private tray: AppTray | undefined) {}

  private flowListener = async () => {
    const flow = await getFlow();
    if (!flow) return;
    sendFlowToRender({
      ...flow,
      time: Date.now(),
    });
  };

  start = async () => {
    try {
      const config = new Config();
      const proxyServer = await config.getProxyServer();
      const route = await config.getRoutes();
      this.currentConnection = new ConnectionManager(
        proxyServer as RemoteServer,
        config.getIsDnsOverUdp(),
        route,
        config.getDns() as Dns
      );
      if (!this.currentConnection) return;
      //TODO: Fix bug: can't catch error
      this.currentConnection.onceStopped.then(() => {
        console.log("disconnected!");
        sendConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.stop();
      });

      this.currentConnection.onReconnecting = () => {
        console.log(`reconnecting`);
        sendConnectionStatus(ConnectionStatus.RECONNECTING);
      };
      this.currentConnection.onReconnected = () => {
        console.log(`reconnected`);
        sendConnectionStatus(ConnectionStatus.CONNECTED);
      };
      sendMessageToRender("Connecting...");
      await this.currentConnection.start();
      sendMessageToRender("Connected!");
      sendConnectionStatus(ConnectionStatus.CONNECTED);
      this.flowTimer = setInterval(this.flowListener, 1000);
      this.tray?.setToolTip("connected");
    } catch (e) {
      await this.stop();
      throw new Error(e);
    }
  };
  changeServer = async () => {
    sendMessageToRender("Connecting...");
    let activatedServer = getActivatedServer(getAppState().proxy);
    const host = await lookupIp(activatedServer.host);
    const proxyServer = { ...activatedServer, host };
    await this.currentConnection?.changeServer(proxyServer as RemoteServer);
    sendMessageToRender("Connected!");
  };
  stop = async () => {
    try {
      if (!this.currentConnection) return;
      this.currentConnection.stop();
      await this.currentConnection.onceStopped;
      sendConnectionStatus(ConnectionStatus.DISCONNECTED);
      sendMessageToRender("Disconnected");
    } catch (e) {
      console.log(e);
    } finally {
      this.tray?.setToolTip("disconnected");
      if (this.flowTimer) clearInterval(this.flowTimer);
      this.currentConnection = undefined;
    }
  };
}
