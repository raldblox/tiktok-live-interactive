@echo off
title Latte overlay (keep this window open while you are LIVE)
cd /d "%~dp0"
rem Your TikTok username is read from tiktok-user.txt (kept off GitHub). First run asks for it.
set TIKTOK_USER=
if exist tiktok-user.txt set /p TIKTOK_USER=<tiktok-user.txt
if "%TIKTOK_USER%"=="" set /p TIKTOK_USER=Your TikTok username (without @): 
if not exist tiktok-user.txt (echo %TIKTOK_USER%)>tiktok-user.txt
start "" "http://localhost:7777/control.html?cfg=stream"
node server.mjs %TIKTOK_USER%
pause
