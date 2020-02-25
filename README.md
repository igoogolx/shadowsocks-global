# Shadowsocks-global ![Build](https://github.com/igoogolx/shadowsocks-global/workflows/Build/badge.svg)

A VPN or proxy client for Windows, based [Outline-client](https://github.com/Jigsaw-Code/outline-client)(windows).

![Running screenshot](https://github.com/igoogolx/shadowsocks-global/blob/master/screenshot/Running.png)

## Features

- Supports Shadowsocks and SOCKS5 protocol
- Built-in Shadowsocks plugin: simple-obfs
- Supports Udp
- Supports Smart Dns, Dns over Tcp

## How to install

**Prerequisite**: No Tencent Computer Manger(腾讯电脑管家) or 360 Safeguard(360 安全卫士) is installed. If have, please uninstall it before performing the following steps.

**Note**:

​	**!!!Known bug**: If your Windows install language isn't **en_us**, you may receive the error message "sorry we could not configure your system to connect to Shadowsocks-global" during the installation.

​	**Fix:**

1. After the "failed" installation, go to "**Control Panel\Network and Internet\Network Connections**" and manually rename the TAP device to `shadowsocksGlobal-tap0`

    ![RenameTapDevice screenshot](https://github.com/igoogolx/shadowsocks-global/blob/master/screenshot/RenameTapDevice.png)

2. Run the installer again to force reinstall Shadowsocks-global.

**Installation**           

1. Install the [Npcap](https://nmap.org/npcap/)(recommended) or  [Winpcap](https://www.winpcap.org/). 
2. Download the release file and install it. 
3. Enjoy.
## How to use customized rules

1. Download rules from https://github.com/FQrabbit/SSTap-Rule or write your own rules. **Note**: the rule file size must be smaller than 100Kb to ensure performance.
2. Go to **setting->rule->Customized rules dir path**, add your rules dir.


## Roadmap
**Before** version **1.0.0** : fix bug, remove unsafe type assertions , clean code, improve performance and UI. **No more new features**.<br />**After** version **1.0.0**:  more new features......

## Development

### `yarn start`

Runs the app in the development mode.<br />The page will restart if you make edits.<br />

**Note**:

​	**!!!Known bug**: If you have connected Shadowsocks-global  when developing, you may receive the error message "[!] (plugin copy) Error: EPERM: operation not permitted, unlink '**\shadowsocks-global\electron-build\ShadowsocksGlobalService.exe" since the ShadowsocksGlobalService.exe has been started as a service.

​	**Fix:** Run `net stop ShadowsocksGlobalService`  from the command line（**Administrator**).


### `yarn build`

Builds the app for production to the `dist` folder.<br />

## License

[MIT]