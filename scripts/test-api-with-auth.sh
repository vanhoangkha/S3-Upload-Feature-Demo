#!/bin/bash

# Cognito configuration from Terraform outputs
USER_POOL_ID="us-east-1_GcPiggAiS"
CLIENT_ID="5kpfm8nfp48dkinpphvlhm6fqv"
API_BASE_URL="https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1"

# Test user credentials (you'll need to set the password)
USERNAME="admin-test"
PASSWORD="TempPassword123!"  # You may need to update this

echo "=== Testing DMS API with Authentication ==="
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "API Base URL: $API_BASE_URL"
echo "Username: $USERNAME"
echo

# Function to authenticate and get JWT token
authenticate() {
    echo "🔐 Authenticating user: $USERNAME"
    
    # Try to authenticate
    AUTH_RESPONSE=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --auth-flow ADMIN_NO_SRP_AUTH \
        --auth-parameters USERNAME="$USERNAME",PASSWORD="$PASSWORD" \
        --region us-east-1 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        ID_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken // empty')
        ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.AccessToken // empty')
        
        if [ -n "$ID_TOKEN" ] && [ "$ID_TOKEN" != "null" ]; then
            echo "✅ Authentication successful!"
            echo "ID Token: ${ID_TOKEN:0:50}..."
            return 0
        else
            echo "❌ Authentication failed - no tokens received"
            return 1
        fi
    else
        echo "❌ Authentication failed"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local description=$3
    
    echo "Testing: $method $path - $description"
    
    if [ -z "$ID_TOKEN" ]; then
        echo "❌ No authentication token available"
        return 1
    fi
    
    if [[ $method == "GET" ]]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -H "Authorization: Bearer $ID_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE_URL$path")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $ID_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE_URL$path")
    fi
    
    http_code=$(echo "$response" | tail -n1 | sed 's/HTTP_CODE://')
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo "✅ Status: $http_code"
        echo "Response: $(echo "$body" | jq -c . 2>/dev/null || echo "$body")"
    elif [[ $http_code == 401 ]]; then
        echo "🔒 Status: $http_code (Unauthorized - token may be invalid)"
    elif [[ $http_code == 403 ]]; then
        echo "🚫 Status: $http_code (Forbidden - insufficient permissions)"
    else
        echo "❌ Status: $http_code"
        echo "Response: $body"
    fi
    echo
}

# Main execution
if authenticate; then
    echo
    echo "=== Testing API Endpoints ==="
    echo
    
    # User info
    test_endpoint "GET" "/me" "Get current user info"
    
    # Document management
    test_endpoint "GET" "/files" "List documents"
    test_endpoint "POST" "/files/presign/upload" "Get presigned upload URL"
    test_endpoint "POST" "/files/presign/download" "Get presigned download URL"
    
    # Admin endpoints (if user has admin role)
    test_endpoint "GET" "/admin/users" "List users (Admin only)"
    test_endpoint "GET" "/admin/audits" "View audit logs (Admin only)"
    
    echo "=== API Testing Complete ==="
else
    echo
    echo "❌ Cannot test API endpoints without authentication"
    echo "Please check user credentials and try again"
fi
