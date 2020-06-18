import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/electron/main.ts",
    output: {
      file: "public/electron.js",
      format: "cjs",
    },
    watch: {
      include: "src/electron/*",
    },
    plugins: [
      typescript({
        typescript: require("typescript"),
        tsconfig: "src/electron/tsconfig.json",
      }),
      terser({ compress: { drop_console: !process.env.IS_DEV } }),
      replace({
        "process.env.NODE_ENV": process.env.IS_DEV
          ? JSON.stringify("development")
          : JSON.stringify("production"),
      }),
    ],
  },
];
