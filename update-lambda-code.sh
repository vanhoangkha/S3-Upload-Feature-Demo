#!/bin/bash
set -e

# Simple Lambda code update for container-based functions
# This creates a new zip and updates the function code

cd /home/ubuntu/S3-Upload-Feature-Demo/api

echo "Building updated code..."
npm run build

echo "Creating deployment package..."
cd dist
zip -r ../lambda-update.zip . -x "*.git*" "node_modules/.cache/*"
cd ..

echo "Updating Lambda functions..."

# List of functions to update
FUNCTIONS=(
    "dms-dev-createDocument"
    "dms-dev-getDocument" 
    "dms-dev-listDocuments"
    "dms-dev-updateDocument"
    "dms-dev-deleteDocument"
    "dms-dev-restoreDocument"
    "dms-dev-listVersions"
    "dms-dev-presignUpload"
    "dms-dev-presignDownload"
    "dms-dev-whoAmI"
    "dms-dev-adminListUsers"
    "dms-dev-adminCreateUser"
    "dms-dev-adminUpdateRoles"
    "dms-dev-adminSignOut"
    "dms-dev-adminAudits"
)

# Try to update each function - some may not exist yet
for func in "${FUNCTIONS[@]}"; do
    echo "Checking function: $func"
    if aws lambda get-function --function-name "$func" --region us-east-1 >/dev/null 2>&1; then
        echo "Function $func exists, checking package type..."
        PACKAGE_TYPE=$(aws lambda get-function --function-name "$func" --region us-east-1 | jq -r '.Configuration.PackageType')
        
        if [ "$PACKAGE_TYPE" = "Zip" ]; then
            echo "Updating ZIP-based function: $func"
            aws lambda update-function-code \
                --function-name "$func" \
                --zip-file fileb://lambda-update.zip \
                --region us-east-1 || echo "Warning: Failed to update $func"
        else
            echo "Skipping IMAGE-based function: $func (requires Docker rebuild)"
        fi
    else
        echo "Function $func does not exist, skipping..."
    fi
done

echo "Code update completed!"
echo "Note: IMAGE-based functions require Docker rebuild and ECR push"
