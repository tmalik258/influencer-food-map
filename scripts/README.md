# yt-dlp Automated Update Scripts

This directory contains scripts to automatically update `yt-dlp` in your Docker environment to resolve 403 Forbidden errors and ensure compatibility with YouTube's latest changes.

## Scripts Overview

### 1. `update-ytdlp.sh` (Linux/macOS)
Bash script for Unix-based systems to update yt-dlp in the Docker container.

### 2. `update-ytdlp.ps1` (Windows)
PowerShell script for Windows systems to update yt-dlp in the Docker container.

## Usage

### Prerequisites
- Docker must be running
- Backend container (`food_backend`) must be running
- Run `docker compose up -d backend` if the container is not running

### Linux/macOS
```bash
# Make the script executable
chmod +x scripts/update-ytdlp.sh

# Run the update script
./scripts/update-ytdlp.sh
```

### Windows (PowerShell)
```powershell
# Run the PowerShell script
.\scripts\update-ytdlp.ps1
```

## What the Scripts Do

1. **Check Docker Status**: Verify Docker is running
2. **Check Container Status**: Ensure the backend container is running
3. **Update yt-dlp**: Execute the update command inside the container
4. **Verify Update**: Display the new version number
5. **Optional Restart**: Ask if you want to restart the backend service

## Automated Scheduling

### Linux/macOS (Cron)
Add to your crontab to run daily at 2 AM:
```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed)
0 2 * * * /path/to/your/project/scripts/update-ytdlp.sh >> /var/log/ytdlp-update.log 2>&1
```

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to Daily
4. Set action to start PowerShell with argument: `-File "C:\path\to\your\project\scripts\update-ytdlp.ps1"`

## Docker Integration

The backend Dockerfile has been updated to:
- Install yt-dlp nightly version during build
- Create an update script (`/usr/local/bin/update-ytdlp`) inside the container
- Use flexible versioning in requirements.txt (`yt-dlp>=2025.09.26`)

## Troubleshooting

### Container Not Running
If you get "Backend container is not running":
```bash
docker compose up -d backend
```

### Permission Denied (Linux/macOS)
Make the script executable:
```bash
chmod +x scripts/update-ytdlp.sh
```

### Docker Not Running
Start Docker Desktop or Docker service before running the scripts.

## Manual Update Inside Container

You can also manually update yt-dlp inside the running container:
```bash
docker exec food_backend /usr/local/bin/update-ytdlp
```

## Version Checking

To check the current yt-dlp version in the container:
```bash
docker exec food_backend python -c "import yt_dlp; print(yt_dlp.version.__version__)"
```