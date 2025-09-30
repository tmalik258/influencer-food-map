FROM python:3.13-slim-bookworm

WORKDIR /code

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install yt-dlp nightly for latest fixes (overrides requirements.txt version)
RUN pip install --no-cache-dir --pre "yt-dlp[default]"

# Copy application code
COPY . .

# Create update script for yt-dlp
RUN echo '#!/bin/bash\npip install --no-cache-dir --upgrade --pre "yt-dlp[default]"' > /usr/local/bin/update-ytdlp && \
    chmod +x /usr/local/bin/update-ytdlp

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
