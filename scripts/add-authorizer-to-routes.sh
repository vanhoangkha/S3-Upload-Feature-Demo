#!/bin/bash
set -e

API_ID="7o9lrh9and"
AUTHORIZER_ID="fk1t97"
REGION="us-east-1"

echo "Adding JWT authorizer to new routes..."

# Get all routes and find the ones that need authorization
ROUTES=$(aws apigatewayv2 get-routes --api-id $API_ID --region $REGION --query 'Items[?contains(RouteKey, `/user/`) || contains(RouteKey, `/vendor/`)] | [].{RouteId: RouteId, RouteKey: RouteKey}' --output json)

echo "Found routes to update:"
echo "$ROUTES" | jq -r '.[] | "\(.RouteKey) -> \(.RouteId)"'

# Update each route to include the authorizer
echo "$ROUTES" | jq -r '.[] | "\(.RouteId) \(.RouteKey)"' | while read route_id route_key; do
    echo "Updating route: $route_key (ID: $route_id)"
    
    aws apigatewayv2 update-route \
        --api-id $API_ID \
        --route-id $route_id \
        --authorization-type JWT \
        --authorizer-id $AUTHORIZER_ID \
        --region $REGION \
        --output text > /dev/null
    
    echo "✅ Updated: $route_key"
done

echo "All routes updated with JWT authorizer!"
