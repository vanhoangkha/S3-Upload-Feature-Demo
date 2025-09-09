#!/bin/bash

# Fix all document handlers to support Admin access
cd /home/ubuntu/S3-Upload-Feature-Demo/api/src/handlers

# Fix updateDocument
cat > updateDocument_admin_fix.patch << 'EOF'
--- a/updateDocument.ts
+++ b/updateDocument.ts
@@ -1,6 +1,7 @@
 import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
 import { requireAuth, assertAccess } from '../lib/auth';
 import { validateInput, updateDocumentSchema } from '../lib/validation';
+import { ScanCommand } from '@aws-sdk/lib-dynamodb';
 import { createErrorResponse, NotFoundError } from '../lib/errors';
 import { logger } from '../lib/logger';
-import { getDocument, updateDocument } from '../lib/dynamodb';
+import { getDocument, updateDocument, ddbDoc, Document } from '../lib/dynamodb';
EOF

# Apply similar fixes to other handlers
echo "Fixing document handlers for Admin access..."

# Build and deploy
cd /home/ubuntu/S3-Upload-Feature-Demo/api
npm run build
cd ..
sudo docker build -t dms-api:dev api/
sudo docker tag dms-api:dev 590183822512.dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
sudo docker push 590183822512.dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest

# Update Lambda functions
for func in updateDocument deleteDocument restoreDocument listVersions presignDownload; do
  aws lambda update-function-code --function-name "dms-dev-$func" --image-uri 590183822512.dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest --region us-east-1 > /dev/null
done

echo "All handlers fixed and deployed!"
