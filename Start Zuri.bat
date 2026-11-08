@echo off
title Zuri overlay server (keep this window open while you are LIVE)
cd /d "%~dp0"
rem Your TikTok username is read from tiktok-user.txt (kept off GitHub). First run asks for it.
set TIKTOK_USER=
if exist tiktok-user.txt set /p TIKTOK_USER=<tiktok-user.txt
if "%TIKTOK_USER%"=="" set /p TIKTOK_USER=Your TikTok username (without @): 
if not exist tiktok-user.txt (echo %TIKTOK_USER%)>tiktok-user.txt
rem Opens the Control Room a few seconds after the server starts.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:7777/studio.html"
node server.mjs %TIKTOK_USER%
pause
