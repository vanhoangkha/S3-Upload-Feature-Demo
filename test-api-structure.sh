#!/bin/bash

API_URL="https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1"

echo "🔍 Testing API Structure (without authentication)"
echo "API URL: $API_URL"
echo ""

# Test health endpoint (should work without auth)
echo "=== Health Check ==="
curl -s "$API_URL/health" | jq . 2>/dev/null || curl -s "$API_URL/health"
echo -e "\n"

# Test protected endpoints (should return 401)
endpoints=(
    "GET /me"
    "GET /files"
    "POST /files"
    "GET /admin/users"
    "GET /vendor/documents"
    "GET /user/profile"
)

echo "=== Protected Endpoints (Expected 401 Unauthorized) ==="
for endpoint in "${endpoints[@]}"; do
    method=$(echo $endpoint | cut -d' ' -f1)
    path=$(echo $endpoint | cut -d' ' -f2)
    
    echo "Testing: $method $path"
    response=$(curl -s -w "HTTP_CODE:%{http_code}" -X "$method" "$API_URL$path")
    http_code=$(echo "$response" | tail -n1 | sed 's/HTTP_CODE://')
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "401" ]; then
        echo "✅ Correctly protected ($http_code)"
    else
        echo "❌ Unexpected response ($http_code): $body"
    fi
    echo ""
done

echo "📋 Available Endpoints Summary:"
echo ""
echo "Authentication & User Info:"
echo "  GET /me - Get current user info"
echo ""
echo "Document Management:"
echo "  GET /files - List documents"
echo "  POST /files - Create document"
echo "  GET /files/{id} - Get document"
echo "  PATCH /files/{id} - Update document"
echo "  DELETE /files/{id} - Delete document"
echo "  POST /files/{id}/restore - Restore document"
echo "  GET /files/{id}/versions - List versions"
echo ""
echo "File Operations:"
echo "  POST /files/presign/upload - Get upload URL"
echo "  POST /files/presign/download - Get download URL"
echo ""
echo "Admin Operations:"
echo "  GET /admin/users - List users"
echo "  POST /admin/users - Create user"
echo "  POST /admin/users/{id}/roles - Update roles"
echo "  POST /admin/users/{id}/signout - Sign out user"
echo "  GET /admin/audits - Get audit logs"
echo ""
echo "Vendor Operations:"
echo "  GET /vendor/documents - Get vendor documents"
echo "  GET /vendor/users - Get vendor users"
echo "  GET /vendor/stats - Get vendor stats"
echo ""
echo "User Operations:"
echo "  GET /user/documents - Get user documents"
echo "  GET /user/profile - Get user profile"
echo "  PATCH /user/profile - Update user profile"
