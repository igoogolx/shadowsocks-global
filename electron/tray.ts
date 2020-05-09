import { Tray, BrowserWindow, nativeImage, app, NativeImage } from "electron";
import path from "path";

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
  setImage = (type: "connected" | "disconnected") => {
    if (this.trayIconImages) {
      if (type === "connected")
        this.tray?.setImage(this.trayIconImages.connected);
      else this.tray?.setImage(this.trayIconImages.disconnected);
    }
  };
  setToolTip = (toolTip?: string) => {
    const title = "ShadowsocksGlobal";
    const content = toolTip ? title + "\n" + toolTip + "\n" : title + "\n";
    this.tray?.setToolTip(content);
  };
}
