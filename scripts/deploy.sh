#!/bin/bash
# Main deployment script for DMS
set -e

ENV=${1:-dev}
echo "Deploying to environment: $ENV"

# Deploy infrastructure
echo "Deploying infrastructure..."
cd infra/envs/$ENV
terraform init
terraform plan
terraform apply -auto-approve

# Deploy API
echo "Deploying API..."
cd ../../../api
npm run build
npm run deploy:$ENV

# Deploy Web
echo "Deploying Web..."
cd ../web
npm run build
npm run deploy:$ENV

echo "Deployment complete!"
