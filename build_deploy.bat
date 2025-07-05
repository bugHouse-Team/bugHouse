@echo off
setlocal EnableDelayedExpansion

REM Create .env file if needed
set "ENV_FILE=backend\.env"
if not exist "!ENV_FILE!" (
    echo Creating .env file...
    set /p "DB_URL=Enter your MONGO_URI (e.g. mongodb+srv://user:pass@users.gywhgfy.mongodb.net/): "
    > "!ENV_FILE!" (
        echo MONGO_URI=!DB_URL!
        echo PORT=5000
        echo NODE_ENV=development
        echo REACT_APP_API_URL=http://localhost:5000
    )
    echo .env file created successfully.
)

REM Start Docker Desktop GUI
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo Waiting for Docker Desktop to start...

:wait_docker_desktop
REM Check if Docker Desktop process is running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" | find /I "Docker Desktop.exe" >nul
if errorlevel 1 (
    REM Not found, wait and retry
    timeout /t 2 /nobreak >nul
    goto wait_docker_desktop
)

echo Docker Desktop process started!

REM Now wait for Docker daemon to be ready by running 'docker info'
echo Waiting for Docker daemon to be ready...

:wait_docker_daemon
docker info >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_docker_daemon
)

echo Docker daemon is ready!

REM Start Docker in a new window
start "Docker Compose" cmd /k "docker compose up --build"

REM Wait for backend to be available
echo Waiting for http://localhost:3000 to be ready...

:waitloop
curl --silent --head http://localhost:3000 >nul
if errorlevel 1 (
    timeout /t 2 >nul
    goto waitloop
)

echo Server is up! Launching browser...
start http://localhost:3000

endlocal
