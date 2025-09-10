#!/bin/bash

# Replace this with a valid JWT token from your web app
# 1. Go to http://localhost:3000
# 2. Login with admin/AdminPass123!
# 3. Open browser dev tools -> Application -> Local Storage
# 4. Copy the token value and paste it here
TOKEN="YOUR_JWT_TOKEN_HERE"

API_URL="https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1"

echo "=== Testing /files endpoint ==="
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$API_URL/files"
