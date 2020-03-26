import log4js from "log4js";
import * as path from "path";
import { app } from "electron";
import { isDev } from "./utils";

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    app: {
      type: "file",
      filename: path.join(app.getPath("userData"), "app.log"),
    },
  },
  categories: {
    default: { appenders: isDev ? ["app", "out"] : ["app"], level: "debug" },
  },
});

export const logger = log4js.getLogger();
