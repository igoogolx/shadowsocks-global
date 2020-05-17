import { Tray, nativeImage, app, NativeImage, Menu } from "electron";
import path from "path";
import { getFlow } from "./flow";
import { convertFlowData } from "../src/share";
import { getAppState } from "./utils";
import { mainWindow } from "./common";

export class AppTray {
  private tray: Tray | undefined;
  private readonly trayIconImages:
    | {
        connected: NativeImage;
        disconnected: NativeImage;
      }
    | undefined;
  private flowListener = async (title: string, proxyRule: string) => {
    const flow = await getFlow();
    if (!flow) return;
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
  private flowTimer: NodeJS.Timer | undefined = undefined;

  constructor(createWindow: () => Promise<void>, quitApp: () => Promise<void>) {
    this.trayIconImages = {
      connected: this.createTrayIconImage("connected.png"),
      disconnected: this.createTrayIconImage("disconnected.png"),
    };
    this.tray = new Tray(this.trayIconImages.disconnected);
    this.tray.on("click", () => {
      if (!mainWindow.get()) {
        createWindow()
          .then
          //Ignore promise returned from createWindow.
          ();
        return;
      }
      if (mainWindow.get()?.isMinimized() || !mainWindow.get()?.isVisible()) {
        mainWindow.get()?.restore();
        mainWindow.get()?.show();
        mainWindow.get()?.focus();
      } else {
        mainWindow.get()?.hide();
      }
    });
    const menuTemplate = [{ label: "Quit", click: quitApp }];
    this.tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
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
      const state = getAppState();
      const proxyRule = state.setting.rule.current;
      this.flowTimer = setInterval(
        () => this.flowListener(title, proxyRule),
        1000
      );
    } else {
      if (this.trayIconImages)
        this.tray?.setImage(this.trayIconImages.disconnected);
      this.tray?.setToolTip(title);
      if (this.flowTimer) clearInterval(this.flowTimer);
    }
  };
}
