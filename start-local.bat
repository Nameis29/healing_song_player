@echo off
setlocal

cd /d "%~dp0"
set PORT=8000

title Healing Song localhost server

echo ==========================================
echo  Healing Song localhost server
echo ==========================================
echo.
echo Folder: %CD%
echo URL: http://localhost:%PORT%
echo.
echo Keep this window open while viewing the page.
echo Press Ctrl + C in this window to stop the server.
echo.

if not exist "index.html" (
    echo [ERROR] index.html was not found.
    echo Please unzip the project first, then run this BAT file inside the folder.
    echo.
    pause
    exit /b 1
)

set PYTHON_CMD=
where py >nul 2>nul
if %errorlevel%==0 (
    set PYTHON_CMD=py
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        set PYTHON_CMD=python
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python was not found.
    echo.
    echo Option 1: Install Python from python.org and check "Add Python to PATH".
    echo Option 2: Open this folder in VS Code and use the Live Server extension.
    echo.
    pause
    exit /b 1
)

echo Python command: %PYTHON_CMD%
echo Starting server...
echo.

start "" "http://localhost:%PORT%"
%PYTHON_CMD% -m http.server %PORT%

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start.
    echo Possible reason: port 8000 is already in use.
    echo.
    echo Try this command in PowerShell:
    echo %PYTHON_CMD% -m http.server 5500
    echo Then open: http://localhost:5500
    echo.
    pause
)

endlocal
