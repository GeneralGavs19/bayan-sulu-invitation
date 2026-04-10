@echo off
REM Windows script for quick setup

echo.
echo ==========================================
echo   Bayan Sulu Invitation Website Setup
echo ==========================================
echo.

echo Installing dependencies...
echo.

echo [1/2] Installing backend dependencies...
cd server
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo [2/2] Installing frontend dependencies...
cd client
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Create server\.env file with your MongoDB and Resend credentials
echo    See SETUP_SERVICES.md for detailed instructions
echo.
echo 2. Start backend (Terminal 1):
echo    cd server
echo    npm run dev
echo.
echo 3. Start frontend (Terminal 2):
echo    cd client
echo    npm run dev
echo.
echo 4. Open http://localhost:5173 in your browser
echo.
goto end

:error
echo.
echo ERROR: Installation failed!
echo Please check npm is installed and try again.
echo.

:end
pause
