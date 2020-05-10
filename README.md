# Shadowsocks-global ![Build](https://github.com/igoogolx/shadowsocks-global/workflows/Build/badge.svg)

A VPN or proxy client for Windows, based [Outline-client](https://github.com/Jigsaw-Code/outline-client)(windows). **IPV6: not support**

## Features

- Supports Shadowsocks and SOCKS5 protocol
- Built-in Shadowsocks plugin: simple-obfs
- Supports Udp
- Supports Smart Dns, Dns over Tcp

## How to install

**Prerequisite**: No Tencent Computer Manger(腾讯电脑管家) or 360 Safeguard(360 安全卫士) is installed. If have, please uninstall it before performing the following steps.

**Installation**           

1. Download the release file and install it. 
2. Enjoy.
## How to use customized rules

1. Download rules from https://github.com/FQrabbit/SSTap-Rule or write your own rules. **Note**: the rule file size must be smaller than 100Kb to ensure performance.
2. Go to **setting->rule->Customized rules dir path**, add your rules dir.


## Roadmap
**Before** version **1.0.0** : fix bug, remove unsafe type assertions , clean code, improve performance and UI. **No more new features**.<br />**After** version **1.0.0**:  more new features......

## Development

### `yarn start`

Runs the app in the development mode.<br />The page will restart if you make edits.<br />

### `yarn build`

Builds the app for production to the `dist` folder.<br />

## License

[MIT]
