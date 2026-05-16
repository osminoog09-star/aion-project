@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "node_modules\react-native-web\package.json" (
  echo Installing web dependencies ^(react-native-web, metro-runtime^)...
  call npm install react-native-web@0.19.13 @expo/metro-runtime@4.0.1 --no-fund --no-audit
  if errorlevel 1 (
    echo npm install failed. Fix network or run: npm install
    pause
    exit /b 1
  )
)
echo AION — web ^(Expo^). Stop: Ctrl+C in this window.
echo.
call npm run web
if errorlevel 1 pause
