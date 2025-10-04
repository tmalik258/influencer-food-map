#!/bin/bash

# Check for root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script with root privileges (sudo)."
  exit 1
fi

echo "Removing existing Nginx configuration files..."

# Remove existing Nginx configuration files
rm -f /etc/nginx/sites-available/nomtok.conf
rm -f /etc/nginx/sites-enabled/nomtok.conf

echo "Nginx configuration files removed."

echo "Copying new Nginx configuration file..."
# Copy the new Nginx configuration file
cp ./nginx.conf /etc/nginx/sites-available/nomtok.conf

echo "New Nginx configuration file copied."

echo "Creating symbolic link to enable the configuration..."
# Create a symbolic link to enable the configuration
ln -s /etc/nginx/sites-available/nomtok.conf /etc/nginx/sites-enabled/nomtok.conf

echo "Symbolic link created."

echo "Testing Nginx configuration..."
# Test Nginx configuration
sudo nginx -t

echo "Nginx configuration tested."

# Ask for permission before reloading
read -p "Reload Nginx now? [y/N]: " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  sudo systemctl nginx reload
fi

echo "Nginx configuration updated and reloaded."