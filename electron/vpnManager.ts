import { ConnectionManager } from "./process_manager";
import { getConfig, trayIconImages } from "./utils";
import { BrowserWindow } from "electron";
import { ConnectionStatus } from "./routing_service";
import { Traffic } from "./traffic";
import { Tray } from "electron";

const UPDATE_TRAFFIC_INTERVAL_MS = 1000;

export class VpnManager {
  currentConnection: ConnectionManager | undefined;
  traffic: Traffic | undefined;
  updateTrafficTimer: NodeJS.Timeout | undefined;

  constructor(
    private mainWindow: BrowserWindow | null,
    private tray: Tray | undefined
  ) {
    this.traffic = new Traffic();
  }

  private setTayImage = (status: ConnectionStatus) => {
    const isConnected = status === ConnectionStatus.CONNECTED;
    const trayIconImage = isConnected
      ? trayIconImages.connected
      : trayIconImages.disconnected;
    this.tray?.setImage(trayIconImage);
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
      const { route, dns, isProxyUdp, remoteServer } = await getConfig();
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

      this.tray?.setToolTip(
        `Shadowsocks-global
${
  remoteServer.name
    ? `${remoteServer?.name}(${remoteServer.host}:${remoteServer.port})`
    : `${remoteServer.host}:${remoteServer.port}`
}`
      );
      this.traffic?.start();
      this.updateTrafficTimer = setInterval(async () => {
        if (!this.mainWindow?.isVisible()) return;
        let sentBytesPerSecond = 0;
        let receivedBytesPerSecond = 0;
        const portUsages: { port: number; bytesPerSecond: number }[] = [];
        this.traffic?.getPockets.forEach(pocket => {
          if (pocket.type === "sent") sentBytesPerSecond += pocket.length;
          else receivedBytesPerSecond += pocket.length;
          const index = portUsages.findIndex(
            portUsage => portUsage.port === pocket.port
          );
          if (index === -1)
            portUsages.push({
              port: pocket.port,
              bytesPerSecond: pocket.length
            });
          else
            portUsages[index] = {
              port: pocket.port,
              bytesPerSecond: portUsages[index].bytesPerSecond + pocket.length
            };
        });
        this.traffic?.resetPockets();
        await this.mainWindow?.webContents.send(
          "totalTrafficUsage",
          this.traffic?.getTotalUsage
        );
        await this.mainWindow?.webContents.send("netSpeed", {
          sentBytesPerSecond,
          receivedBytesPerSecond,
          time: Date.now()
        });

        //TODO: Port to process. Note: "find-process"(https://www.npmjs.com/package/find-process)
        // is not improper to be used to find multiple ports at the same time,
        // because of high usage of cpu.
        await this.mainWindow?.webContents.send("portNetSpeeds", portUsages);
      }, UPDATE_TRAFFIC_INTERVAL_MS);
    } catch (e) {
      await this.stop();
      throw new Error(e);
    }
  };
  stop = async () => {
    try {
      if (this.updateTrafficTimer) clearInterval(this.updateTrafficTimer);
      this.traffic?.stop();
      if (!this.currentConnection) return;
      this.currentConnection.stop();
      await this.currentConnection.onceStopped;

      this.currentConnection = undefined;
      this.sendConnectionStatus(ConnectionStatus.DISCONNECTED);
      await this.mainWindow?.webContents.send("message", "Disconnected");
      this.tray?.setToolTip("Shadowsocks-global");
    } catch (e) {
      console.log(e);
    }
  };
}
