import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import copy from "rollup-plugin-copy";
import { terser } from "rollup-plugin-terser";

const isX64 = process.arch === "x64";

export default [
  {
    input: "electron/main.ts",
    output: {
      file: "electron-build/main.js",
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
      }),
      copy({
        copyOnce: true,
        targets: [
          {
            src: [
              "defaultRules",
              "scripts/*",
              `tools/find_tap_name/${
                isX64 ? "amd64" : "i386"
              }/find_tap_name.exe`,
              "tools/ShadowsocksGlobalService/ShadowsocksGlobalService/bin/x86/Release/ShadowsocksGlobalService.exe",
              "tools/ShadowsocksGlobalService/ShadowsocksGlobalService/bin/x86/Release/Newtonsoft.Json.dll",
              "tools/smartdnsblock/bin/smartdnsblock.exe"
            ],
            dest: "electron-build"
          },
          {
            src: `third_party/tap-windows6/${isX64 ? "amd64" : "i386"}/*`,
            dest: "electron-build/tap-windows6"
          },

          {
            src: [
              "third_party/badvpn",
              "third_party/shadowsocks-libev",
              "third_party/unbound",
              "third_party/ip2region"
            ],
            dest: "electron-build/third_party"
          }
        ]
      })
    ]
  }
];
