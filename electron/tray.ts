import { Tray, BrowserWindow, nativeImage, app, NativeImage } from "electron";
import path from "path";
import { flow, FlowData } from "./flow";
import { convertFlowData } from "../src/share";
import { getAppConfig } from "./utils";

export class AppTray {
  tray: Tray | undefined;
  trayIconImages:
    | {
        connected: NativeImage;
        disconnected: NativeImage;
      }
    | undefined;

  constructor(mainWindow: BrowserWindow, createWindow: () => Promise<void>) {
    this.trayIconImages = {
      connected: this.createTrayIconImage("connected.png"),
      disconnected: this.createTrayIconImage("disconnected.png"),
    };
    this.tray = new Tray(this.trayIconImages.disconnected);
    this.tray.on("click", () => {
      if (!mainWindow) {
        createWindow()
          .then
          //Ignore promise returned from createWindow.
          ();
        return;
      }
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
        mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      } else {
        mainWindow.hide();
      }
    });
  }

  private createTrayIconImage = (imageName: string) => {
    const image = nativeImage.createFromPath(
      path.join(app.getAppPath(), "resources", "tray", imageName)
    );
    if (image.isEmpty()) {
      throw new Error(`cannot find ${imageName} tray icon image`);
    }
    return image;
  };

  setToolTip = (type: "connected" | "disconnected") => {
    const title = `ShadowsocksGlobal ${app.getVersion()}`;
    if (type === "connected") {
      if (this.trayIconImages)
        this.tray?.setImage(this.trayIconImages.connected);
      const state = getAppConfig();
      const proxyRule = state.setting.rule.current;
      const flowListener = (flow: FlowData) => {
        this.tray?.setToolTip(
          title +
            "\n" +
            `Rule: ${proxyRule}` +
            "\n" +
            `download: ${convertFlowData(
              flow.downloadBytesPerSecond
            )}/S  upload: ${convertFlowData(flow.uploadBytesPerSecond)}/S`
        );
      };
      flow(flowListener);
    } else {
      if (this.trayIconImages)
        this.tray?.setImage(this.trayIconImages.disconnected);
      this.tray?.setToolTip(title);
    }
  };
}
