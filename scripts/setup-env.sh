#!/bin/bash
# Environment setup script
set -e

ENV=${1:-dev}
echo "Setting up environment: $ENV"

# Install dependencies
echo "Installing API dependencies..."
cd api && npm install

echo "Installing Web dependencies..."
cd ../web && npm install

echo "Environment setup complete!"
