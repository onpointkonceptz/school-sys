@echo off
echo Stopping any servers already running on ports 8000 and 5173...

REM --- Kill anything already on port 8000 (Django) ---
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM --- Kill anything already on port 5173 (Vite) ---
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting School System Servers...

REM --- Launch Django backend in a new CMD window ---
start "Django Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && python manage.py runserver"

REM --- Launch React frontend (Vite) in a new CMD window ---
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers launched successfully.
