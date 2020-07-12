import { ConnectionManager } from "./process_manager";
import { Config, RemoteServer } from "./utils";
import { AppTray } from "./tray";
import {
  ConnectionStatus,
  sendConnectionStatus,
  sendFlowToRender,
  sendMessageToRender,
} from "./ipc";
import { manager } from "./manager";

export class VpnManager {
  private currentConnection: ConnectionManager | undefined;
  private flowTimer: NodeJS.Timer | undefined;

  constructor(private tray: AppTray | undefined) {}

  private flowListener = async () => {
    const flowData = await manager.getFlow();
    if (!flowData) return;
    sendFlowToRender({
      ...flowData,
      time: Date.now(),
    });
  };

  start = async (isSendMessage = true) => {
    try {
      const config = new Config();
      const server = await config.getProxyServer();
      this.currentConnection = new ConnectionManager(
        server as RemoteServer,
        config.getIsDnsOverUdp(),
        config.getDns(),
        await config.getRule()
      );
      if (!this.currentConnection) return;
      //TODO: Fix bug: can't catch error
      this.currentConnection.onceStopped = () => {
        console.log("disconnected!");
        sendConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.stop();
      };

      this.currentConnection.onReconnecting = () => {
        console.log(`reconnecting`);
        sendConnectionStatus(ConnectionStatus.RECONNECTING);
      };
      this.currentConnection.onReconnected = () => {
        console.log(`reconnected`);
        sendConnectionStatus(ConnectionStatus.CONNECTED);
      };
      if (isSendMessage) sendMessageToRender("Connecting...");
      await this.currentConnection.start();
      if (isSendMessage) {
        sendMessageToRender("Connected!");
        sendConnectionStatus(ConnectionStatus.CONNECTED);
      }
      this.flowTimer = setInterval(this.flowListener, 1000);
      this.tray?.setToolTip("connected");
    } catch (e) {
      await this.stop();
      throw new Error(e);
    }
  };
  changeServer = async () => {
    try {
      sendMessageToRender("Connecting...");
      if (this.currentConnection) {
        this.currentConnection.onceStopped = () => {};
      }
      await this.stop(false);
      await this.start(false);
      sendMessageToRender("Connected!");
    } catch (e) {
      await this.stop();
    }
  };
  stop = async (isSendMessage = true) => {
    try {
      if (!this.currentConnection) return;
      this.currentConnection.stop();
      await this.currentConnection.onceStopped;
      if (isSendMessage) {
        sendConnectionStatus(ConnectionStatus.DISCONNECTED);
        sendMessageToRender("Disconnected");
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.tray?.setToolTip("disconnected");
      if (this.flowTimer) clearInterval(this.flowTimer);
      this.currentConnection = undefined;
    }
  };
}
