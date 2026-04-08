@echo off
echo ==================================================
echo Starting SiteForge AI Website Builder Servers
echo ==================================================

echo.
echo.
echo Installing backend dependencies...
cd /d d:\code\ai-website-builder\server
call npm install

echo.
echo Starting Backend Server on port 5000...
start "Backend API (DO NOT CLOSE)" cmd /k "npm run dev"

echo.
echo Starting Frontend UI on port 5173...
cd /d d:\code\ai-website-builder\client
call npm install
start "Frontend UI (DO NOT CLOSE)" cmd /k "npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Please wait 5 seconds and then open: http://127.0.0.1:5173 in your browser.
timeout /t 5 /nobreak
start http://127.0.0.1:5173
pause