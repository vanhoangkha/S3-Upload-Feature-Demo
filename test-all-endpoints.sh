#!/bin/bash

# API Configuration
API_URL="https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1"

# Test tokens - Replace with actual JWT tokens from login
ADMIN_TOKEN="YOUR_ADMIN_JWT_TOKEN_HERE"
VENDOR_TOKEN="YOUR_VENDOR_JWT_TOKEN_HERE"
USER_TOKEN="YOUR_USER_JWT_TOKEN_HERE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    local description=$5
    
    echo -e "${BLUE}=== Testing: $description ===${NC}"
    echo "Method: $method | Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1 | sed 's/HTTP_CODE://')
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✓ SUCCESS ($http_code)${NC}"
    elif [[ $http_code -eq 401 ]]; then
        echo -e "${YELLOW}⚠ UNAUTHORIZED ($http_code) - Check token${NC}"
    elif [[ $http_code -eq 403 ]]; then
        echo -e "${YELLOW}⚠ FORBIDDEN ($http_code) - Check permissions${NC}"
    else
        echo -e "${RED}✗ FAILED ($http_code)${NC}"
    fi
    
    echo "Response: $body"
    echo ""
}

echo -e "${BLUE}🚀 Testing All API Endpoints${NC}"
echo "API URL: $API_URL"
echo ""

# Check if tokens are set
if [ "$ADMIN_TOKEN" = "YOUR_ADMIN_JWT_TOKEN_HERE" ]; then
    echo -e "${RED}❌ Please update tokens in the script first!${NC}"
    echo "1. Login to web app at http://localhost:3000"
    echo "2. Get JWT tokens from browser localStorage"
    echo "3. Update ADMIN_TOKEN, VENDOR_TOKEN, USER_TOKEN in this script"
    exit 1
fi

# Health Check
echo -e "${BLUE}=== Health Check ===${NC}"
curl -s "$API_URL/health" | jq . 2>/dev/null || curl -s "$API_URL/health"
echo -e "\n"

# Authentication & User Info
test_endpoint "GET" "/me" "$ADMIN_TOKEN" "" "Who Am I (Admin)"
test_endpoint "GET" "/me" "$VENDOR_TOKEN" "" "Who Am I (Vendor)"

# Document Management (Admin)
echo -e "${YELLOW}--- Document Management (Admin) ---${NC}"
test_endpoint "GET" "/files" "$ADMIN_TOKEN" "" "List All Documents (Admin)"
test_endpoint "POST" "/files" "$ADMIN_TOKEN" '{"name":"test-doc.pdf","description":"Test document","tags":["test"]}' "Create Document (Admin)"
test_endpoint "GET" "/files/test-doc-id" "$ADMIN_TOKEN" "" "Get Document (Admin)"
test_endpoint "PATCH" "/files/test-doc-id" "$ADMIN_TOKEN" '{"description":"Updated description"}' "Update Document (Admin)"
test_endpoint "GET" "/files/test-doc-id/versions" "$ADMIN_TOKEN" "" "List Document Versions (Admin)"
test_endpoint "POST" "/files/test-doc-id/restore" "$ADMIN_TOKEN" '{"version":"1"}' "Restore Document (Admin)"
test_endpoint "DELETE" "/files/test-doc-id" "$ADMIN_TOKEN" "" "Delete Document (Admin)"

# File Operations
echo -e "${YELLOW}--- File Operations ---${NC}"
test_endpoint "POST" "/files/presign/upload" "$ADMIN_TOKEN" '{"fileName":"test.pdf","fileType":"application/pdf"}' "Presign Upload URL"
test_endpoint "POST" "/files/presign/download" "$ADMIN_TOKEN" '{"fileId":"test-doc-id"}' "Presign Download URL"

# Admin Operations
echo -e "${YELLOW}--- Admin Operations ---${NC}"
test_endpoint "GET" "/admin/users" "$ADMIN_TOKEN" "" "List Users (Admin)"
test_endpoint "POST" "/admin/users" "$ADMIN_TOKEN" '{"username":"testuser","email":"test@example.com","role":"User"}' "Create User (Admin)"
test_endpoint "POST" "/admin/users/testuser/roles" "$ADMIN_TOKEN" '{"roles":["User","Vendor"]}' "Update User Roles (Admin)"
test_endpoint "POST" "/admin/users/testuser/signout" "$ADMIN_TOKEN" "" "Sign Out User (Admin)"
test_endpoint "GET" "/admin/audits" "$ADMIN_TOKEN" "" "Get Audit Logs (Admin)"

# Vendor Operations
echo -e "${YELLOW}--- Vendor Operations ---${NC}"
test_endpoint "GET" "/vendor/documents" "$VENDOR_TOKEN" "" "Get Vendor Documents"
test_endpoint "GET" "/vendor/users" "$VENDOR_TOKEN" "" "Get Vendor Users"
test_endpoint "GET" "/vendor/stats" "$VENDOR_TOKEN" "" "Get Vendor Stats"

# User Operations
echo -e "${YELLOW}--- User Operations ---${NC}"
test_endpoint "GET" "/user/documents" "$VENDOR_TOKEN" "" "Get User Documents"
test_endpoint "GET" "/user/profile" "$VENDOR_TOKEN" "" "Get User Profile"
test_endpoint "PATCH" "/user/profile" "$VENDOR_TOKEN" '{"displayName":"Updated Name"}' "Update User Profile"

# Permission Tests (should fail)
echo -e "${YELLOW}--- Permission Tests (Expected Failures) ---${NC}"
test_endpoint "GET" "/admin/users" "$VENDOR_TOKEN" "" "Admin Endpoint with Vendor Token (Should Fail)"
test_endpoint "GET" "/vendor/documents" "$USER_TOKEN" "" "Vendor Endpoint with User Token (Should Fail)"

# Invalid Endpoints
echo -e "${YELLOW}--- Invalid Endpoints ---${NC}"
test_endpoint "GET" "/nonexistent" "$ADMIN_TOKEN" "" "Non-existent Endpoint"
test_endpoint "POST" "/files/invalid/action" "$ADMIN_TOKEN" "" "Invalid Action"

echo -e "${GREEN}🏁 Testing Complete!${NC}"
