@echo off
cd /d "%~dp0"
echo マンダラチャートを起動しています...
start "" "http://localhost:5173"
npm run dev
