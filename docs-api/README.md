# Documents API

A modern REST API built with HonoJS for managing document uploads, downloads, and folder organization using AWS S3 presigned URLs, DynamoDB for metadata storage, and Cognito for authentication.

## 🚀 Features

- **Document Management**: Create, read, and delete operations for documents with folder organization
- **Folder Management**: Create and manage hierarchical folder structures
- **S3 Presigned URLs**: Secure file upload and download without exposing AWS credentials
- **DynamoDB Integration**: Efficient metadata storage with user-based partitioning
- **Cognito Authentication**: User authentication and authorization with admin role support
- **TypeScript**: Full type safety and excellent developer experience
- **Modern Stack**: Built with HonoJS for high performance and simplicity
- **AWS Integration**: Seamless integration with existing AWS infrastructure

## 🏗️ Architecture

The API integrates with the following AWS services deployed via `docs-infra`:

- **DynamoDB Tables**:
  - `Documents`: Stores document metadata with `user_id` (hash key) and `file` (range key)
  - Supports both files and folders with `itemType` field
- **S3 Buckets**:
  - `vibdmsstore2026-by-ctn`: Document storage bucket with protected user folders
  - `vibdmswebstore2026-by-ctn`: Web assets bucket for static hosting
- **Cognito**: User authentication and authorization with admin role support
- **API Gateway**: RESTful API endpoint with Cognito authorizer integration
- **Lambda**: Serverless function deployment

## 📋 Prerequisites

- Node.js 18+ and npm
- **AWS Account with appropriate permissions**
- **AWS CLI configured** or appropriate AWS credentials for:
  - DynamoDB read/write access to `Documents` tables
  - S3 read/write access to `vibdmsstore2026-by-ctn` and `vibdmswebstore2026-by-ctn` buckets
  - Cognito user pool access
- Access to the deployed AWS infrastructure from `docs-infra`

### AWS Authentication

The API uses the AWS default credential chain, which automatically detects credentials from:

1. **Environment variables** (optional):
   - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

2. **AWS CLI profile** (recommended):
   - Run `aws configure` to set up your credentials
   - The app will automatically use your default AWS profile

3. **IAM roles** (when deployed):
   - EC2 instance profiles
   - ECS task roles  
   - Lambda execution roles

4. **AWS SSO** or other credential sources

**For local development**, we recommend using AWS CLI:

```bash
aws configure
# Enter your Access Key ID, Secret Access Key, region, and output format
```

## 🛠️ Installation

1. **Clone and navigate to the project**:

   ```bash
   cd docs-api
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your AWS resource information:

   ```env
   # AWS Configuration
   AWS_REGION=us-east-1
   # Note: AWS credentials are automatically detected from:
   # 1. AWS CLI profile (~/.aws/credentials) - recommended
   # 2. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) - optional
   # 3. EC2/ECS/Lambda roles when deployed
   
   # DynamoDB Tables (from docs-infra)
   DOCUMENTS_TABLE_NAME=Documents
   
   # S3 Buckets (from docs-infra)  
   DOCUMENT_STORE_BUCKET_NAME=vibdmsstore2026-by-ctn
   WEB_STORE_BUCKET_NAME=vibdmswebstore2026-by-ctn
   
   # Cognito Configuration (from docs-infra)
   COGNITO_USER_POOL_ID=your-user-pool-id
   
   # API Gateway Configuration
   API_GATEWAY_URL=https://your-api-gateway-url
   
   # Local Development
   PORT=3001
   NODE_ENV=development
   
   # CORS allowed origins
   ALLOWED_ORIGINS=http://localhost:3000,https://your-static-website-url
   ```

## 🚦 Getting Started

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Production Mode

Build and start the production server:

```bash
npm run build
npm start
```

### Health Check

Verify the API is running:

```bash
curl http://localhost:3001/health
```

## 📚 API Endpoints

### Base URL

```
http://localhost:3001/api/documents
```

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check endpoint | No |
| `GET` | `/api/documents` | List documents/folders (with optional `user_id` filter) | Yes |
| `POST` | `/api/documents/presigned-url` | Generate S3 presigned URLs for upload | Yes |
| `POST` | `/api/documents` | Create document metadata record | Yes |
| `POST` | `/api/documents/folder` | Create a new folder | Yes |
| `GET` | `/api/documents/:user_id` | List user's documents and folders | Yes |
| `GET` | `/api/documents/:user_id/:file` | Get specific document | Yes |
| `GET` | `/api/documents/:user_id/:file/download` | Get download URL | Yes |
| `DELETE` | `/api/documents/:user_id/:file` | Delete document and file | Yes |

### Authentication

All API endpoints (except `/health`) require authentication via Cognito JWT tokens. Include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/documents
```

### API Usage Examples

#### 1. Generate Presigned URLs for Upload

```bash
curl -X POST http://localhost:3001/api/documents/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileName": "example.pdf",
    "mimeType": "application/pdf",
    "user_id": "user123",
    "folderPath": "documents/work"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://vibdmsstore2026-by-ctn.s3.amazonaws.com/...",
    "downloadUrl": "https://vibdmsstore2026-by-ctn.s3.amazonaws.com/...",
    "s3Key": "protected/user123/documents/work/uuid-example.pdf"
  }
}
```

#### 2. Create Document Record

After uploading to S3 using the presigned URL:

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Important Document",
    "description": "This is a sample document",
    "fileName": "example.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "user_id": "user123",
    "s3Key": "protected/user123/documents/work/uuid-example.pdf",
    "folderPath": "documents/work"
  }'
```

#### 3. Create a Folder

```bash
curl -X POST http://localhost:3001/api/documents/folder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "folderName": "Projects",
    "user_id": "user123",
    "parentPath": "documents"
  }'
```

#### 4. List User Documents and Folders

```bash
curl "http://localhost:3001/api/documents/user123?folderPath=documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "name": "Projects",
        "path": "documents/Projects",
        "type": "folder"
      }
    ],
    "files": [
      {
        "name": "Important Document",
        "document": {
          "user_id": "user123",
          "file": "protected/user123/documents/work/uuid-example.pdf",
          "title": "Important Document",
          "description": "This is a sample document",
          "fileSize": 1024000,
          "mimeType": "application/pdf",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "folderPath": "documents"
        }
      }
    ],
    "currentPath": "documents"
  }
}
```

```

#### 5. Get Document Details

```bash
curl http://localhost:3001/api/documents/user123/protected%2Fuser123%2Fdocuments%2Fwork%2Fuuid-example.pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Get Download URL

```bash
curl http://localhost:3001/api/documents/user123/protected%2Fuser123%2Fdocuments%2Fwork%2Fuuid-example.pdf/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 7. Delete Document

```bash
curl -X DELETE http://localhost:3001/api/documents/user123/protected%2Fuser123%2Fdocuments%2Fwork%2Fuuid-example.pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗂️ Project Structure

```
src/
├── index.ts              # Main Hono application
├── server.ts             # Local development server
├── lambda.ts             # AWS Lambda handler
├── middleware/
│   └── auth.ts           # Cognito authentication middleware
├── routes/
│   └── documents.ts      # Document and folder API routes
├── services/
│   ├── document-service.ts  # DynamoDB operations
│   └── s3-service.ts     # S3 operations
├── types/
│   ├── auth.ts           # Authentication type definitions
│   └── index.ts          # API type definitions
└── utils/
    ├── aws-config.ts     # AWS client configuration
    └── logger.ts         # Logging utilities
```

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run server` | Start server using tsx (development) |
| `npm run lint` | Check TypeScript compilation |
| `npm run clean` | Remove build directory |
| `npm run build:lambda` | Build for Lambda deployment |
| `npm run package:lambda` | Package Lambda deployment zip |

## 🔐 Security Considerations

- **Cognito Authentication**: All endpoints require valid JWT tokens (except health check)
- **User Isolation**: Users can only access their own documents unless they are admins
- **Admin Role**: Admin users can access all documents across all users
- **Presigned URLs**: Limited-time access (1 hour by default)
- **CORS**: Configured for specific allowed origins
- **Protected S3 Paths**: User files stored in `protected/{user_id}/` structure
- **Input Validation**: Comprehensive validation on all endpoints

## 🚀 Deployment

This API can be deployed as:

1. **AWS Lambda** (using the `lambda.ts` handler)
2. **Container** (Docker/ECS)
3. **Traditional Server** (EC2/VPS)

For Lambda deployment, the `lambda.ts` file provides the AWS Lambda handler that wraps the Hono application.

## 🔍 Monitoring & Debugging

### API Health Check

```bash
curl http://localhost:3001/health
```

### Authentication Testing

Test with a valid Cognito JWT token:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/documents
```

### Logs

The application uses structured logging with different levels:

- `DEBUG`: Detailed debugging information
- `INFO`: General application information  
- `WARN`: Warning messages
- `ERROR`: Error conditions

In development, logs are output to the console with full detail.

### Environment Variables

All configuration is handled through environment variables. See the configuration section above for the complete list.

## 🤝 Integration with Frontend

This API is designed to work with the React frontend in `docs-ui`. The frontend should:

1. Authenticate users via Cognito and obtain JWT tokens
2. Call `/api/documents/presigned-url` to get upload URLs
3. Upload files directly to S3 using the presigned URL
4. Call the document creation endpoint to save metadata
5. Use folder endpoints to organize documents
6. Use other endpoints for document management

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": any,           // Present on success
  "error": string,       // Present on error
  "message": string      // Optional message
}
```

## 🔧 Troubleshooting

### Common Issues

1. **AWS Credentials Error**:
   - **Problem**: `CredentialsError: Missing credentials in config`
   - **Solution**: Configure AWS CLI with `aws configure` or set AWS environment variables

2. **Authentication Error**:
   - **Problem**: `401 Unauthorized` or `403 Forbidden`
   - **Solution**: Ensure you have a valid Cognito JWT token in the Authorization header

3. **DynamoDB Access Denied**:
   - **Problem**: `AccessDenied` when accessing DynamoDB tables
   - **Solution**: Verify your IAM user/role has DynamoDB permissions for the `Documents` table

4. **S3 Permissions Error**:
   - **Problem**: Cannot generate presigned URLs or access S3 buckets
   - **Solution**: Ensure your IAM user/role has S3 permissions for the document store bucket

5. **Table Not Found**:
   - **Problem**: `ResourceNotFoundException: Requested resource not found`
   - **Solution**: Make sure the DynamoDB tables are created via the `docs-infra` deployment

6. **CORS Issues**:
   - **Problem**: Frontend can't connect to API
   - **Solution**: Update `ALLOWED_ORIGINS` in environment variables to include your frontend URL

### Testing AWS Connection

Test your AWS credentials are working:

```bash
# Test AWS CLI access
aws dynamodb list-tables --region ap-northeast-3
aws s3 ls s3://vibdmsstore2026-by-ctn

# Or start the API and check the health endpoint
npm run dev
curl http://localhost:3001/health
```

### Debug Mode

Set `NODE_ENV=development` for detailed logging and error messages.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

For more information about the overall project architecture, see the main README in the project root.
