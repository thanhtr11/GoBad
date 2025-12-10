#!/bin/bash

# Fix Docker permissions for thanhtr user
# Run this as root or with sudo

echo "=== Setting up Docker permissions for thanhtr user ==="

# Add user to docker group
sudo usermod -aG docker thanhtr

# Apply the new group membership
newgrp docker

echo "Docker permissions configured. User thanhtr can now run docker commands."
echo "You may need to log out and log back in for the changes to take effect."
