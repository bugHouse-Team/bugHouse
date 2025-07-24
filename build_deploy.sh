#!/bin/bash

set -e

ENV_FILE="backend/.env"

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env file..."
  read -p "Enter your MONGO_URI (e.g. mongodb+srv://user:pass@users.gywhgfy.mongodb.net/): " DB_URL

  cat > "$ENV_FILE" <<EOF
MONGO_URI=$DB_URL
PORT=5000
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000
EOF

  echo ".env file created successfully."
fi

# Start Docker Desktop if needed (macOS or Windows only)
echo "Checking Docker status..."

if [[ "$OSTYPE" == "darwin"* ]]; then
	if ! pgrep -f "Docker Desktop" >/dev/null; then
		echo "Starting Docker Desktop (macOS)..."
		open -a "Docker"
	fi
elif grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
	if ! pgrep -f "Docker Desktop.exe" >/dev/null; then
		echo "Starting Docker Desktop (Windows/WSL)..."
		powershell.exe start "" '"C:\Program Files\Docker\Docker\Docker Desktop.exe"'
	fi
fi

# Ensure Docker daemon is running (Linux users may need to start it manually)



if [[ "$OSTYPE" != "linux-gnu"* ]]; then
	echo "Waiting for Docker daemon to be ready..."
	until docker info >/dev/null 2>&1; do
		echo "Waiting for Docker..."
		sleep 2
	done
	
	echo "Docker daemon is ready!"

	# Use docker compose (v2) or fallback to docker-compose (v1)
	echo "Starting Docker Compose..."
	if command -v docker compose >/dev/null 2>&1; then
		( docker compose up --build ) &
	else
		( docker-compose up --build ) &
	fi
else
	# Use docker compose (v2) or fallback to docker-compose (v1)
	echo "Starting Docker Compose..."
	sudo systemctl start docker
	if command -v docker compose >/dev/null 2>&1; then
		( sudo docker compose up --build ) &
	else
		( sudo docker-compose up --build ) &
	fi
fi



# Wait for the frontend service (assumed on http://localhost:3000)
echo "Waiting for http://localhost:3000 to be ready..."
timeout=60
elapsed=0

while ! curl --silent --head http://localhost:3000 | grep "200 OK" > /dev/null; do
	sleep 2
	elapsed=$((elapsed + 2))
	echo "Still waiting... (${elapsed}s)"
	if [ $elapsed -ge $timeout ]; then
		echo "Error: Server did not become ready within $timeout seconds."
		exit 1
	fi
done

echo "Server is up! Launching browser..."

# Open browser based on OS
if command -v xdg-open >/dev/null; then
	xdg-open http://localhost:3000
elif command -v open >/dev/null; then
	open http://localhost:3000
elif command -v start >/dev/null; then
	start http://localhost:3000
else
	echo "Open http://localhost:3000 in your browser."
fi
