import { ConnectionManager } from "./process_manager";
import { getConfig } from "./utils";
import { ConnectionStatus } from "./routing_service";
import { AppTray } from "./tray";
import { flow, FlowData } from "./flow";
import { mainWindow } from "./common";
import { sendFlowToRender, sendMessageToRender } from "./ipc";

export class VpnManager {
  currentConnection: ConnectionManager | undefined;

  constructor(private tray: AppTray | undefined) {}

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
    if (mainWindow.get()) {
      mainWindow.get()?.webContents.send(event);
    } else {
      console.warn(`received ${event} event but no mainWindow to notify`);
    }
  };

  start = async () => {
    try {
      const { route, dns, isProxyUdp, remoteServer } = await getConfig();
      this.currentConnection = new ConnectionManager(
        //@ts-ignore
        remoteServer,
        isProxyUdp,
        route,
        dns
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
      await sendMessageToRender("Connecting...");
      await this.currentConnection.start();
      await sendMessageToRender("Connected!");
      this.sendConnectionStatus(ConnectionStatus.CONNECTED);
      const flowListener = (flow: FlowData) => {
        sendFlowToRender({
          ...flow,
          time: Date.now(),
        });
      };
      flow(flowListener);
      this.tray?.setToolTip("connected");
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
      await sendMessageToRender("Disconnected");
      this.tray?.setToolTip("disconnected");
    } catch (e) {
      console.log(e);
    }
  };
}
