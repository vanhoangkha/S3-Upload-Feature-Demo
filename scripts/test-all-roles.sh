#!/bin/bash

# Configuration
API_BASE_URL="https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1"
USER_POOL_ID="us-east-1_GcPiggAiS"
CLIENT_ID="5kpfm8nfp48dkinpphvlhm6fqv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to authenticate user
authenticate_user() {
    local username=$1
    local password=$2
    local role_name=$3
    
    echo -e "${BLUE}🔐 Authenticating $role_name: $username${NC}"
    
    # Get JWT token using admin-initiate-auth
    local auth_response=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --auth-flow ADMIN_USER_PASSWORD_AUTH \
        --auth-parameters USERNAME="$username",PASSWORD="$password" \
        --region us-east-1 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local access_token=$(echo "$auth_response" | jq -r '.AuthenticationResult.AccessToken // empty')
        local id_token=$(echo "$auth_response" | jq -r '.AuthenticationResult.IdToken // empty')
        
        if [ -n "$access_token" ] && [ "$access_token" != "null" ]; then
            echo -e "${GREEN}✅ Login successful for $role_name${NC}"
            echo "$id_token"
        else
            echo -e "${RED}❌ Login failed for $role_name - No token received${NC}"
            echo ""
        fi
    else
        echo -e "${RED}❌ Login failed for $role_name${NC}"
        echo ""
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    local description=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    local curl_cmd="curl -s -w 'Status: %{http_code}' -X $method"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"
    
    local response=$(eval $curl_cmd)
    echo "$response"
    echo ""
}

# Function to test all endpoints for a role
test_role_endpoints() {
    local role_name=$1
    local token=$2
    
    echo -e "${BLUE}🧪 Testing all endpoints for $role_name${NC}"
    echo "=================================================="
    
    # Test /me endpoint
    test_endpoint "GET" "/me" "$token" "" "Get current user info"
    
    # Test document endpoints
    test_endpoint "GET" "/files" "$token" "" "List documents"
    test_endpoint "POST" "/files" "$token" '{"name":"test-doc.pdf","vendorId":"vendor1","tags":["test"]}' "Create document metadata"
    test_endpoint "POST" "/files/presign/upload" "$token" '{"vendorId":"vendor1","userId":"user1","filename":"test.pdf","contentType":"application/pdf"}' "Get presigned upload URL"
    test_endpoint "POST" "/files/presign/download" "$token" '{"fileId":"test-file-id"}' "Get presigned download URL"
    
    # Test admin endpoints (should work for admin, fail for others)
    test_endpoint "GET" "/admin/users" "$token" "" "List users (Admin only)"
    test_endpoint "POST" "/admin/users" "$token" '{"username":"newuser","email":"new@example.com","temporaryPassword":"TempPass123!"}' "Create user (Admin only)"
    test_endpoint "GET" "/admin/audits" "$token" "" "Get audit logs (Admin only)"
    
    echo ""
}

# Main execution
echo -e "${BLUE}🚀 Starting comprehensive role-based API testing${NC}"
echo "============================================================"

# Test Admin role
echo -e "${GREEN}Testing ADMIN role${NC}"
admin_token=$(authenticate_user "admin" "AdminPass123!" "Admin")
if [ -n "$admin_token" ]; then
    test_role_endpoints "Admin" "$admin_token"
fi

echo -e "${GREEN}Testing VENDOR role${NC}"
vendor_token=$(authenticate_user "vendor" "VendorPass123!" "Vendor")
if [ -n "$vendor_token" ]; then
    test_role_endpoints "Vendor" "$vendor_token"
fi

echo -e "${GREEN}Testing USER role${NC}"
user_token=$(authenticate_user "testuser" "TestPass123!" "User")
if [ -n "$user_token" ]; then
    test_role_endpoints "User" "$user_token"
fi

echo -e "${BLUE}🏁 Testing completed!${NC}"
