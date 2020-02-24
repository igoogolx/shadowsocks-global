@echo off
setlocal EnableDelayedExpansion

set PWD=%~dp0%

echo Installing tap device
call %PWD%\add_tap_device.bat

echo Installing windows service
call  %PWD%\install_windows_service.bat


exit /b 0
