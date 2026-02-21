@echo off
title Visual Project Dashboard Server
cd /d "%~dp0"
echo Starting Visual Project Dashboard...
start "" "http://localhost:3000"
call npm run dev
pause
