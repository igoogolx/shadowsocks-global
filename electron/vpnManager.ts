import { ConnectionManager } from "./process_manager";
import { getConfig } from "./utils";
import { BrowserWindow } from "electron";
import { ConnectionStatus } from "./routing_service";
import { AppTray } from "./tray";
import { flow, FlowData } from "./flow";
import { convertFlowData } from "../src/share";

export class VpnManager {
  currentConnection: ConnectionManager | undefined;

  constructor(
    private mainWindow: BrowserWindow | null,
    private tray: AppTray | undefined
  ) {}

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
      await this.mainWindow?.webContents.send("updateMessage", "Connecting...");
      await this.currentConnection.start();
      await this.mainWindow?.webContents.send("updateMessage", "Connected!");
      this.sendConnectionStatus(ConnectionStatus.CONNECTED);

      const defaultTooltip =
        (remoteServer.name
          ? `${remoteServer?.name}(${remoteServer.host}:${remoteServer.port})`
          : `${remoteServer.host}:${remoteServer.port}`) +
        "\n" +
        `Rule: ${rule}` +
        "\n";
      this.tray?.setToolTip(defaultTooltip);
      const flowListener = (flow: FlowData) => {
        if (this.mainWindow) {
          this.mainWindow.webContents.send("updateFlow", {
            ...flow,
            time: Date.now(),
          });
        }
        this.tray?.setToolTip(
          defaultTooltip +
            `download: ${convertFlowData(
              flow.downloadBytesPerSecond
            )}/S  upload: ${convertFlowData(flow.uploadBytesPerSecond)}/S`
        );
      };
      flow(flowListener);
    } catch (e) {
      await this.stop();
      throw new Error(e);
    }
  };
  stop = async () => {
    try {
      if (!this.currentConnection) return;
      this.currentConnection.stop();
      await this.currentConnection.onceStopped;

      this.currentConnection = undefined;
      this.sendConnectionStatus(ConnectionStatus.DISCONNECTED);
      await this.mainWindow?.webContents.send("updateMessage", "Disconnected");
      this.tray?.setToolTip();
    } catch (e) {
      console.log(e);
    }
  };
}
