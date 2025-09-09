#!/bin/bash
set -e

API_ID="7o9lrh9and"
REGION="us-east-1"

echo "Adding missing API Gateway routes..."

# Function to create integration and route
create_route() {
    local method=$1
    local path=$2
    local function_name=$3
    
    echo "Creating route: $method $path -> $function_name"
    
    # Create integration
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-method $method \
        --integration-uri "arn:aws:lambda:us-east-1:590183822512:function:$function_name" \
        --payload-format-version "1.0" \
        --region $REGION \
        --query 'IntegrationId' \
        --output text)
    
    echo "Created integration: $INTEGRATION_ID"
    
    # Create route
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "$method $path" \
        --target "integrations/$INTEGRATION_ID" \
        --region $REGION \
        --query 'RouteId' \
        --output text
    
    echo "Route created successfully"
}

# Add missing routes
create_route "GET" "/user/documents" "dms-dev-getUserDocuments"
create_route "GET" "/user/profile" "dms-dev-getUserProfile"
create_route "PATCH" "/user/profile" "dms-dev-updateUserProfile"
create_route "GET" "/vendor/documents" "dms-dev-getVendorDocuments"
create_route "GET" "/vendor/users" "dms-dev-getVendorUsers"
create_route "GET" "/vendor/stats" "dms-dev-getVendorStats"

echo "All routes added successfully!"
echo "Deploying API..."

# Deploy the API
aws apigatewayv2 create-deployment \
    --api-id $API_ID \
    --stage-name '$default' \
    --region $REGION

echo "API deployed successfully!"
