import log4js from "log4js";
import * as path from "path";
import { app } from "electron";
import { isDev } from "./utils";

const MAX_LOG_FILE_SIZE_MB = 1;
const LOG_BACKUPS = 3;

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    app: {
      type: "file",
      filename: path.join(app.getPath("userData"), "app.log"),
      maxLogSize: MAX_LOG_FILE_SIZE_MB * 1024 * 1024,
      backups: LOG_BACKUPS,
      compress: true,
    },
  },
  categories: {
    default: { appenders: isDev ? ["app", "out"] : ["app"], level: "debug" },
  },
});

export const logger = log4js.getLogger();
