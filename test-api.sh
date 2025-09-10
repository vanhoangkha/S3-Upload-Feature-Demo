#!/bin/bash

# API Gateway URL - update this with your actual URL
API_URL="https://your-api-gateway-url.execute-api.region.amazonaws.com/dev"

# JWT tokens from previous testing (replace with current tokens)
ADMIN_TOKEN="your-admin-jwt-token-here"
VENDOR_TOKEN="your-vendor-jwt-token-here"

echo "=== Testing /files endpoint with Admin token ==="
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     "$API_URL/files"

echo -e "\n\n=== Testing /files endpoint with Vendor token ==="
curl -H "Authorization: Bearer $VENDOR_TOKEN" \
     -H "Content-Type: application/json" \
     "$API_URL/files"
