# PO Token Setup Guide for YouTube Bot Detection Bypass

This guide explains how to set up and use PO (Proof of Origin) tokens to bypass YouTube's "Sign in to confirm you're not a bot" message when downloading videos with yt-dlp.

## Overview

PO tokens are cryptographic tokens that prove your requests originate from a genuine client rather than a bot. YouTube increasingly requires these tokens for video downloads, especially when downloading from IP addresses flagged as potentially automated.

## Prerequisites

* yt-dlp version 2025.05.22 or above

* Python 3.7+ with pip

* Docker (for HTTP server method)

* Git (for cloning repositories)

## Installation

### Step 1: Install the PO Token Provider Plugin

```bash
docker compose exec backend pip install -U bgutil-ytdlp-pot-provider
```

### Step 2: Choose Your Provider Method (Use HTTP server using docker)

You have two options for setting up the PO token provider:

#### Option A: HTTP Server Method (Recommended)

**Using Docker (Easiest):**

```bash
docker run --name bgutil-provider -d -p 4416:4416 --init brainicism/bgutil-ytdlp-pot-provider
```

**Using Node.js:**

```bash
# Clone the repository
git clone --single-branch --branch 1.2.2 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git
cd bgutil-ytdlp-pot-provider/server/
npm install
npx tsc
node build/main.js
```

**Custom Port (Optional):**

```bash
node build/main.js --port 8080
```

#### Option B: Script Method (Not Recommended for High Concurrency)

```bash
# Clone to home directory (recommended location)
cd ~
git clone --single-branch --branch 1.2.2 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git
cd bgutil-ytdlp-pot-provider/server/
npm install
npx tsc
```

## Configuration

### Environment Variables

Add these to your `.env.template` file or environment:

```bash
# For HTTP server method (default)
# No additional configuration needed if using default port 4416

# For custom HTTP server port
YTBUTIL_PO_TOKEN_PORT=8080

# For script method
TOKEN_TTL=6  # Token cache TTL in hours (default: 6)
```

### Integration with Existing Cookie Handling

The PO token functionality works alongside your existing cookie configuration. No changes to your current cookie setup are required.

## Usage

### Basic Usage (HTTP Server Method)

If using the HTTP server with default settings (localhost:4416), yt-dlp will automatically use PO tokens:

```python
# Your existing download_audio function will automatically use PO tokens
# No code changes required if using HTTP server method
```

### Custom Configuration (use http method)

**For custom HTTP server URL:**

```python
ydl_opts = {
    "format": "bestaudio/best",
    "extractor_args": {
        "youtubepot-bgutilhttp": "base_url=http://127.0.0.1:8080"
    }
}
```

**For script method:**

```python
ydl_opts = {
    "format": "bestaudio/best",
    "extractor_args": {
        "youtubepot-bgutilscript": "script_path=/path/to/bgutil-ytdlp-pot-provider/server/build/generate_once.js"
    }
}
```

### Advanced Configuration

**Multiple extractor arguments:**

```python
ydl_opts = {
    "format": "bestaudio/best",
    "extractor_args": {
        "youtubepot-bgutilhttp": "base_url=http://127.0.0.1:8080;disable_innertube=1"
    }
}
```

**Combining with other yt-dlp options:**

```python
ydl_opts = {
    "format": "bestaudio/best",
    "cookiefile": "/path/to/cookies.txt",
    "extractor_args": {
        "youtube": "player-client=mweb",
        "youtubepot-bgutilhttp": "base_url=http://127.0.0.1:8080"
    }
}
```

## Troubleshooting

### Common Issues

**1. "Sign in to confirm you're not a bot" still appears**

* Ensure the PO token provider is running

* Check that yt-dlp version is 2025.05.22 or above

* Verify the extractor arguments are correctly formatted

**2. HTTP server connection failed**

* Check if the Docker container or Node.js server is running

* Verify the port is not blocked by firewall

* For Docker, ensure port mapping is correct (`-p 4416:4416`)

**3. Script method performance issues**

* Consider switching to HTTP server method for better performance

* Check TOKEN\_TTL setting to optimize cache usage

* Monitor system resources during high concurrency

**4. Network isolation issues (Docker)**

* If using local proxy servers, add `--net=host` to Docker run command

* Ensure the container can reach YouTube

### Debug Commands

**Check provider status:**

```bash
# For HTTP server
curl http://localhost:4416/health

# For Docker
docker logs bgutil-provider
```

**Test yt-dlp with verbose output:**

```bash
docker compose exec backend bash
yt-dlp --verbose --extractor-args "youtubepot-bgutilhttp:base_url=http://127.0.0.1:8080" "VIDEO_URL"
```

**Verify plugin installation:**

```bash
docker compose exec backend pip show bgutil-ytdlp-pot-provider
```

## Best Practices

1. **Use HTTP server method** for production environments due to better performance and caching
2. **Monitor token expiration** - tokens have limited lifetime and may need refresh
3. **Combine with cookies** - PO tokens work best alongside valid YouTube cookies
4. **Handle failures gracefully** - implement fallback mechanisms for when PO tokens fail
5. **Rate limiting** - respect YouTube's rate limits even with PO tokens

## Integration with Nomtok Application

The PO token functionality has been integrated into the `download_audio` function in `transcription_nlp.py`. The implementation:

* Automatically detects and uses PO tokens when available

* Maintains compatibility with existing cookie handling

* Provides fallback mechanisms for geo-restricted content

* Includes proper error handling and logging

### Configuration in config.py

Add these optional configurations to your `config.py`:

```python
# PO Token Configuration (optional)
PO_TOKEN_PROVIDER = "http"  # "http" or "script"
PO_TOKEN_BASE_URL = "http://127.0.0.1:4416"  # Custom URL for HTTP server
PO_TOKEN_SCRIPT_PATH = None  # Path to script if using script method
```

### Code Changes

The `download_audio` function has been updated to:

1. Detect available PO token provider
2. Configure yt-dlp with appropriate extractor arguments
3. Maintain existing cookie and proxy functionality
4. Handle PO token-specific errors

## Security Considerations

* PO tokens are tied to specific YouTube sessions and have limited validity

* Tokens should not be shared across different applications or users

* Monitor for unusual download patterns that might trigger additional restrictions

* Keep your PO token provider updated to the latest version

## Additional Resources

* [yt-dlp PO Token Guide](https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide)

* [bgutil-ytdlp-pot-provider Repository](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)

* [yt-dlp Official Documentation](https://github.com/yt-dlp/yt-dlp)

## Support

For issues specific to:

* **PO token provider**: Report to [bgutil-ytdlp-pot-provider issues](https://github.com/Brainicism/bgutil-ytdlp-pot-provider/issues)

* **yt-dlp integration**: Report to [yt-dlp issues](https://github.com/yt-dlp/yt-dlp/issues)

* **Nomtok application**: Check application logs and configuration

