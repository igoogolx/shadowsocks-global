import { ConnectionManager } from "./process_manager";
import { getConfig } from "./utils";
import { ConnectionStatus } from "./routing_service";
import { AppTray } from "./tray";
import { flow, FlowData } from "./flow";
import {
  sendConnectionStatus,
  sendFlowToRender,
  sendMessageToRender,
} from "./ipc";

export class VpnManager {
  currentConnection: ConnectionManager | undefined;

  constructor(private tray: AppTray | undefined) {}

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
      sendConnectionStatus(ConnectionStatus.DISCONNECTED);
      sendMessageToRender("Disconnected");
      this.tray?.setToolTip("disconnected");
    } catch (e) {
      console.log(e);
    }
  };
}
