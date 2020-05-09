import { ConnectionManager } from "./process_manager";
import { getConfig } from "./utils";
import { BrowserWindow, powerMonitor } from "electron";
import { ConnectionStatus } from "./routing_service";
import { Traffic } from "./traffic";
import { logger } from "./log";
import { AppTray } from "./tray";
import { convertTrafficData } from "../src/share";

const UPDATE_TRAFFIC_INTERVAL_MS = 1000;

export class VpnManager {
  currentConnection: ConnectionManager | undefined;
  traffic: Traffic | undefined;
  updateTrafficTimer: NodeJS.Timeout | undefined;

  constructor(
    private mainWindow: BrowserWindow | null,
    private tray: AppTray | undefined
  ) {
    powerMonitor.on("suspend", this.suspendListener);
    powerMonitor.on("resume", this.resumeListener);
  }
  private suspendListener = () => {
    if (this.traffic) {
      this.traffic.stop();
      logger.info("suspend traffic");
    }
  };
  private resumeListener = () => {
    if (this.traffic) {
      this.traffic.start();
      logger.info("resume traffic");
    }
  };

  private startTrafficStatistics = (defaultTooltip: string) => {
    this.traffic = new Traffic();
    this.traffic?.start();
    this.updateTrafficTimer = setInterval(async () => {
      if (!this.traffic || !this.mainWindow) return;
      let sentBytesPerSecond = 0;
      let receivedBytesPerSecond = 0;
      const portUsages: { port: number; bytesPerSecond: number }[] = [];
      this.traffic.getPockets.forEach((pocket) => {
        if (pocket.type === "sent") sentBytesPerSecond += pocket.length;
        else receivedBytesPerSecond += pocket.length;
        const index = portUsages.findIndex(
          (portUsage) => portUsage.port === pocket.port
        );
        if (index === -1)
          portUsages.push({
            port: pocket.port,
            bytesPerSecond: pocket.length,
          });
        else
          portUsages[index] = {
            port: pocket.port,
            bytesPerSecond: portUsages[index].bytesPerSecond + pocket.length,
          };
      });
      this.tray?.setToolTip(
        defaultTooltip +
          `download: ${convertTrafficData(
            receivedBytesPerSecond
          )}/S  upload: ${convertTrafficData(sentBytesPerSecond)}/S`
      );
      this.traffic.resetPockets();
      if (!this.mainWindow?.isVisible()) return;
      await this.mainWindow.webContents.send("updateTrafficStatistics", {
        usage: this.traffic.getTotalUsage,
        sentBytesPerSecond,
        receivedBytesPerSecond,
        time: Date.now(),
      });

      //TODO: Port to process. Note: "find-process"(https://www.npmjs.com/package/find-process)
      // is not improper to be used to find multiple ports at the same time,
      // because of high usage of cpu.
      await this.mainWindow.webContents.send("portNetSpeeds", portUsages);
    }, UPDATE_TRAFFIC_INTERVAL_MS);
  };

  private stopTrafficStatistics = () => {
    powerMonitor.removeListener("suspend", this.suspendListener);
    powerMonitor.removeListener("resume", this.resumeListener);
    if (this.updateTrafficTimer) clearInterval(this.updateTrafficTimer);
    this.traffic?.stop();
    this.traffic = undefined;
  };

  private setTayImage = (status: ConnectionStatus) => {
    const isConnected = status === ConnectionStatus.CONNECTED;
    const trayIconImageType = isConnected ? "connected" : "disconnected";
    this.tray?.setImage(trayIconImageType);
  };
  private sendConnectionStatus = (status: ConnectionStatus) => {
    let statusString;
    switch (status) {
      case ConnectionStatus.CONNECTED:
        statusString = "connected";
        break;
      case ConnectionStatus.DISCONNECTED:
        statusString = "disconnected";
        break;
      case ConnectionStatus.RECONNECTING:
        statusString = "reconnecting";
        break;
      default:
        console.error(`Cannot send unknown proxy status: ${status}`);
        return;
    }
    const event = `proxy-${statusString}`;
    if (this.mainWindow) {
      this.mainWindow.webContents.send(event);
    } else {
      console.warn(`received ${event} event but no mainWindow to notify`);
    }
    this.setTayImage(status);
  };

  start = async () => {
    try {
      const { route, dns, isProxyUdp, remoteServer, rule } = await getConfig();
      this.currentConnection = new ConnectionManager(
        //@ts-ignore
        remoteServer,
        isProxyUdp,
        route,
        dns,
        this.mainWindow
      );
      if (!this.currentConnection) return;
      //TODO: Fix bug: can't catch error
      this.currentConnection.onceStopped.then(() => {
        console.log("disconnected!");
        this.sendConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.stop();
      });

      this.currentConnection.onReconnecting = () => {
        console.log(`reconnecting`);
        this.sendConnectionStatus(ConnectionStatus.RECONNECTING);
      };
      this.currentConnection.onReconnected = () => {
        console.log(`reconnected`);
        this.sendConnectionStatus(ConnectionStatus.CONNECTED);
      };
      await this.mainWindow?.webContents.send("message", "Connecting...");
      await this.currentConnection.start();
      await this.mainWindow?.webContents.send("message", "Connected!");
      this.sendConnectionStatus(ConnectionStatus.CONNECTED);

      const defaultTooltip =
        (remoteServer.name
          ? `${remoteServer?.name}(${remoteServer.host}:${remoteServer.port})`
          : `${remoteServer.host}:${remoteServer.port}`) +
        "\n" +
        `Rule:${rule}` +
        "\n";
      this.tray?.setToolTip(defaultTooltip);
      this.startTrafficStatistics(defaultTooltip);
    } catch (e) {
      await this.stop();
      throw new Error(e);
    }
  };
  stop = async () => {
    try {
      this.stopTrafficStatistics();
      if (!this.currentConnection) return;
      this.currentConnection.stop();
      await this.currentConnection.onceStopped;

      this.currentConnection = undefined;
      this.sendConnectionStatus(ConnectionStatus.DISCONNECTED);
      await this.mainWindow?.webContents.send("message", "Disconnected");
      this.tray?.setToolTip();
    } catch (e) {
      console.log(e);
    }
  };
}
