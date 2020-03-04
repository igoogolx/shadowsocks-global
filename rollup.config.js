import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "electron/main.ts",
    output: {
      file: "public/electron.js",
      format: "cjs"
    },
    watch: {
      include: "electron/*"
    },
    plugins: [
      typescript({
        typescript: require("typescript"),
        project: "electron",
        tsconfig: "electron/tsconfig.json"
      }),
      terser({ compress: { drop_console: !process.env.IS_DEV } }),
      replace({
        "process.env.NODE_ENV": process.env.IS_DEV
          ? JSON.stringify("development")
          : JSON.stringify("production")
      })
    ]
  }
];
