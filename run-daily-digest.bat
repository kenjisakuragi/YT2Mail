@echo off
cd /d %~dp0
echo Starting Daily Digest...
call npm run digest
echo Done.
timeout /t 10
