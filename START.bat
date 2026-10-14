@echo off
cd /d "%~dp0"
echo Open http://localhost:8000/index.html in your browser.
echo Keep this window open. Press Ctrl+C to stop.
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -m http.server 8000
) else (
  python -m http.server 8000
)
pause
