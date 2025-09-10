#!/bin/bash
# Cleanup script for DMS
set -e

ENV=${1:-dev}
echo "Cleaning up environment: $ENV"

# Destroy infrastructure
echo "Destroying infrastructure..."
cd infra/envs/$ENV
terraform destroy -auto-approve

# Clean build artifacts
echo "Cleaning build artifacts..."
cd ../../../
rm -rf api/dist web/build

echo "Cleanup complete!"
