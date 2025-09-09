#!/bin/bash
set -e

REGION="us-east-1"

echo "Fixing DynamoDB permissions for Lambda functions..."

# List of Lambda functions that need DynamoDB access
FUNCTIONS=(
    "dms-dev-listDocuments"
    "dms-dev-createDocument"
    "dms-dev-getDocument"
    "dms-dev-updateDocument"
    "dms-dev-deleteDocument"
    "dms-dev-restoreDocument"
    "dms-dev-listVersions"
    "dms-dev-getUserDocuments"
    "dms-dev-getVendorDocuments"
    "dms-dev-adminListUsers"
    "dms-dev-adminCreateUser"
    "dms-dev-adminUpdateRoles"
    "dms-dev-adminAudits"
)

# Updated policy document with GSI permissions
POLICY_DOC='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:dynamodb:us-east-1:590183822512:table/dms-dev-documents",
        "arn:aws:dynamodb:us-east-1:590183822512:table/dms-dev-documents/index/*",
        "arn:aws:dynamodb:us-east-1:590183822512:table/dms-dev-audits",
        "arn:aws:dynamodb:us-east-1:590183822512:table/dms-dev-audits/index/*"
      ]
    }
  ]
}'

for func in "${FUNCTIONS[@]}"; do
    ROLE_NAME="${func}-role"
    POLICY_NAME="${func}-ddb"
    
    echo "Checking function: $func"
    
    # Check if role exists
    if aws iam get-role --role-name "$ROLE_NAME" --region $REGION >/dev/null 2>&1; then
        echo "  Updating DynamoDB policy for role: $ROLE_NAME"
        
        # Update the policy
        aws iam put-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-name "$POLICY_NAME" \
            --policy-document "$POLICY_DOC" \
            --region $REGION
        
        echo "  ✅ Updated: $ROLE_NAME"
    else
        echo "  ⚠️  Role not found: $ROLE_NAME"
    fi
done

echo "DynamoDB permissions updated successfully!"
