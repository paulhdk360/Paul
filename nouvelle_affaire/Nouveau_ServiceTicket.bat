@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Nouveau_ServiceTicket.ps1"
echo.
pause
