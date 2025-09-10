#!/bin/bash

# Test without token to confirm the error
echo "=== Testing without token (should get 401) ==="
curl -H "Content-Type: application/json" \
     "https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1/files"

echo -e "\n\n=== Testing with invalid token (should get 401) ==="
curl -H "Authorization: Bearer invalid-token" \
     -H "Content-Type: application/json" \
     "https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1/files"

echo -e "\n\nTo test with valid token:"
echo "1. Start web app: cd web && npm start"
echo "2. Login at http://localhost:3000 with admin/AdminPass123!"
echo "3. Get token from browser localStorage"
echo "4. Run: curl -H 'Authorization: Bearer YOUR_TOKEN' https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1/files"
