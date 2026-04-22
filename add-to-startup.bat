@echo off
setlocal
cd /d "%~dp0"

set "VBS_PATH=%~dp0run-hidden.vbs"
set "BAT_PATH=%~dp0start-app.bat"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=GestLyceeAutoStart.lnk"

echo ==========================================
echo    GestLycee 7 - Startup Setup
echo ==========================================

if not exist "%VBS_PATH%" (
    echo ERROR: run-hidden.vbs not found!
    pause
    exit /b
)

echo INFO: Unblocking files to prevent security warnings...
powershell -Command "Unblock-File -Path '%VBS_PATH%'"
powershell -Command "Unblock-File -Path '%BAT_PATH%'"

echo INFO: Adding silent program to Windows Startup...

:: Create a shortcut that calls wscript.exe explicitly
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%STARTUP_FOLDER%\%SHORTCUT_NAME%');$s.TargetPath='wscript.exe';$s.Arguments='\"%VBS_PATH%\"';$s.WorkingDirectory='%~dp0';$s.Save()"

if %errorlevel% equ 0 (
    echo SUCCESS: The program will now start silently with Windows!
) else (
    echo ERROR: Failed to create startup shortcut.
)

echo.
pause
