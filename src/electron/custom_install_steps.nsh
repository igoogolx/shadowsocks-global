; Copyright 2018 The Outline Authors
;
; Licensed under the Apache License, Version 2.0 (the "License");
; you may not use this file except in compliance with the License.
; You may obtain a copy of the License at
;
;      http://www.apache.org/licenses/LICENSE-2.0
;
; Unless required by applicable law or agreed to in writing, software
; distributed under the License is distributed on an "AS IS" BASIS,
; WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
; See the License for the specific language governing permissions and
; limitations under the License.

!include StrFunc.nsh
!include WinVer.nsh
!include x64.nsh


; StrFunc weirdness; this fix suggested here:
; https://github.com/electron-userland/electron-builder/issues/888
!ifndef BUILD_UNINSTALLER
${StrLoc}
!endif

!macro customInstall
  ; Normally, because we mark the installer binary as requiring administrator permissions, the
  ; installer will be running with administrator permissions at this point. The exception is when
  ; the system is running with the *lowest* (least safe) UAC setting in which case the installer
  ; can progress to this point without administrator permissions.
  ;
  ; If that's the case, exit now so we don't waste time to trying to install the TAP device, etc.
  ; Additionally, the client can detect their absence and prompt the user to reinstall.
  ;
  ; The returned value does *not* seem to be based on the user's current diaplay language.
  UserInfo::GetAccountType
  Pop $0
  StrCmp $0 "Admin" isadmin
  MessageBox MB_OK "Sorry, Shdowsocks-global requires administrator permissions."
  Quit

  isadmin:

  ; TAP device files.
  SetOutPath "$INSTDIR\tap-windows6"
  ${If} ${RunningX64}
    File /r "${PROJECT_DIR}\third_party\tap-windows6\amd64\*"
  ${Else}
    File /r "${PROJECT_DIR}\third_party\tap-windows6\i386\*"
  ${EndIf}
  SetOutPath -
  File "${PROJECT_DIR}\scripts\add_tap_device.bat"

  ; ExecToStack captures both stdout and stderr from the script, in the order output.
  ; Set a (long) timeout in case the device never becomes visible to netsh.
  ReadEnvStr $0 COMSPEC
  nsExec::ExecToStack /timeout=180000 '$0 /c add_tap_device.bat'

  Pop $0
  Pop $1
  StrCmp $0 0 success

  ; The TAP device may have failed to install because the user did not want to
  ; install the device driver. If so:
  ;  - tell the user that they need to install the driver
  ;  - skip the Sentry report
  ;  - quit
  ;
  ; When this happens, tapinstall.exe prints an error message like this:
  ; UpdateDriverForPlugAndPlayDevices failed, GetLastError=-536870333
  ;
  ; We can use the presence of that magic number to detect this case.
  Var /GLOBAL DRIVER_FAILURE_MAGIC_NUMBER_INDEX
  ${StrLoc} $DRIVER_FAILURE_MAGIC_NUMBER_INDEX $1 "536870333" ">"

  StrCmp $DRIVER_FAILURE_MAGIC_NUMBER_INDEX "" submitsentryreport
  ; The term "device software" is the same as that used by the prompt, at least on Windows 7.
  MessageBox MB_OK "Sorry, you must install the device software in order to use Shadowsocks-global. Please try \
    running the installer again."
  Quit

  submitsentryreport:
  MessageBox MB_OK "Sorry, we could not configure your system to connect to Shadowsocks-global. Please try \
    running the installer again. If you still cannot install Shadowsocks-global, please get in \
    touch with us and let us know that the TAP device could not be installed."



  success:

!macroend

; TODO: Remove the TAP device on uninstall. This is impossible to implement safely
;       with the bundled tapinstall.exe because it can only remove *all* devices
;       having hwid tap0901 and these may include non-Outline devices.
