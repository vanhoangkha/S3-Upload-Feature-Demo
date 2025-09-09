#!/bin/bash
set -e

API_ID="7o9lrh9and"
REGION="us-east-1"

echo "Updating API Gateway integrations to use fixed functions..."

# Function to update integration
update_integration() {
    local route_key=$1
    local new_function_name=$2
    
    echo "Updating route: $route_key -> $new_function_name"
    
    # Get route ID
    ROUTE_ID=$(aws apigatewayv2 get-routes --api-id $API_ID --region $REGION --query "Items[?RouteKey=='$route_key'].RouteId" --output text)
    
    if [ -z "$ROUTE_ID" ]; then
        echo "Route not found: $route_key"
        return
    fi
    
    # Get current integration ID
    CURRENT_INTEGRATION_ID=$(aws apigatewayv2 get-route --api-id $API_ID --route-id $ROUTE_ID --region $REGION --query 'Target' --output text | sed 's/integrations\///')
    
    # Create new integration
    NEW_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-method POST \
        --integration-uri "arn:aws:lambda:us-east-1:590183822512:function:$new_function_name" \
        --payload-format-version "1.0" \
        --region $REGION \
        --query 'IntegrationId' \
        --output text)
    
    # Update route to use new integration
    aws apigatewayv2 update-route \
        --api-id $API_ID \
        --route-id $ROUTE_ID \
        --target "integrations/$NEW_INTEGRATION_ID" \
        --region $REGION \
        --output text > /dev/null
    
    # Delete old integration
    aws apigatewayv2 delete-integration \
        --api-id $API_ID \
        --integration-id $CURRENT_INTEGRATION_ID \
        --region $REGION || echo "Warning: Could not delete old integration"
    
    echo "✅ Updated: $route_key"
}

# Update all routes
update_integration "GET /user/documents" "dms-dev-getUserDocuments-fixed"
update_integration "GET /user/profile" "dms-dev-getUserProfile-fixed"
update_integration "PATCH /user/profile" "dms-dev-updateUserProfile-fixed"
update_integration "GET /vendor/documents" "dms-dev-getVendorDocuments-fixed"
update_integration "GET /vendor/users" "dms-dev-getVendorUsers-fixed"
update_integration "GET /vendor/stats" "dms-dev-getVendorStats-fixed"
update_integration "GET /admin/users" "dms-dev-adminListUsers-fixed"
update_integration "GET /admin/audits" "dms-dev-adminAudits-fixed"

echo "All integrations updated!"
