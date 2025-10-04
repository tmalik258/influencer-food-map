#!/bin/bash

# Check for root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script with root privileges (sudo)."
  exit 1
fi

# Remove existing Nginx configuration files
rm -f /etc/nginx/sites-available/nomtok.conf
rm -f /etc/nginx/sites-enabled/nomtok.conf

# Copy the new Nginx configuration file
cp ../nginx.conf /etc/nginx/sites-available/nomtok.conf

# Create a symbolic link to enable the configuration
ln -s /etc/nginx/sites-available/nomtok.conf /etc/nginx/sites-enabled/nomtok.conf

# Test Nginx configuration
nginx -t

# Reload Nginx to apply changes
nginx -s reload

echo "Nginx configuration updated and reloaded."