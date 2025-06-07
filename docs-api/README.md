# Documents API

A modern REST API built with HonoJS for managing document uploads and downloads using AWS S3 presigned URLs and DynamoDB for metadata storage.

## 🚀 Features

- **Document Management**: Create, read, and delete operations for documents
- **S3 Presigned URLs**: Secure file upload and download without exposing AWS credentials
- **DynamoDB Integration**: Efficient metadata storage with user-based partitioning
- **TypeScript**: Full type safety and excellent developer experience
- **Modern Stack**: Built with HonoJS for high performance and simplicity
- **AWS Integration**: Seamless integration with existing AWS infrastructure

## 🏗️ Architecture

The API integrates with the following AWS services deployed via `s3-upload-infra`:

- **DynamoDB Tables**:
  - `Documents`: Stores document metadata with `user_id` (hash key) and `file` (range key)
  - `General`: Additional data storage
- **S3 Buckets**:
  - `vibdmsstore2026`: Document storage bucket
  - `vibdmswebstore2026`: Web assets bucket
- **Cognito**: User authentication and authorization

## 📋 Prerequisites

- Node.js 18+ and npm
- **AWS Account with appropriate permissions**
- **AWS CLI configured** or appropriate AWS credentials for:
  - DynamoDB read/write access to `Documents` and `General` tables
  - S3 read/write access to `vibdmsstore2026` and `vibdmswebstore2026` buckets
- Access to the deployed AWS infrastructure from `s3-upload-infra`

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
   
   # DynamoDB Tables (from s3-upload-infra)
   DOCUMENTS_TABLE_NAME=Documents
   GENERAL_TABLE_NAME=General
   
   # S3 Buckets (from s3-upload-infra)
   DOCUMENT_STORE_BUCKET_NAME=vibdmsstore2026
   WEB_STORE_BUCKET_NAME=vibdmswebstore2026
   
   # Local Development
   PORT=3001
   NODE_ENV=development
   
   # CORS allowed origins
   ALLOWED_ORIGINS=http://localhost:3000,https://dev.d3gk57lhevbrz2.amplifyapp.com
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List documents (with optional `user_id` filter) |
| `POST` | `/presigned-url` | Generate S3 presigned URLs for upload |
| `POST` | `/` | Create document metadata record |
| `GET` | `/:user_id/:file` | Get specific document |
| `GET` | `/:user_id/:file/download` | Get download URL |
| `DELETE` | `/:user_id/:file` | Delete document and file |

### API Usage Examples

#### 1. Generate Presigned URLs for Upload

```bash
curl -X POST http://localhost:3001/api/documents/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "example.pdf",
    "mimeType": "application/pdf",
    "user_id": "user123"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://vibdmsstore2026.s3.amazonaws.com/...",
    "downloadUrl": "https://vibdmsstore2026.s3.amazonaws.com/...",
    "s3Key": "documents/user123/uuid-example.pdf"
  }
}
```

#### 2. Create Document Record

After uploading to S3 using the presigned URL:

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Document",
    "description": "This is a sample document",
    "fileName": "example.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "user_id": "user123",
    "s3Key": "documents/user123/uuid-example.pdf"
  }'
```

#### 3. List User Documents

```bash
curl "http://localhost:3001/api/documents?user_id=user123&limit=10"
```

#### 4. Get Document Details

```bash
curl http://localhost:3001/api/documents/user123/example.pdf
```

#### 5. Get Download URL

```bash
curl http://localhost:3001/api/documents/user123/example.pdf/download
```

#### 6. Delete Document

```bash
curl -X DELETE http://localhost:3001/api/documents/user123/example.pdf
```

## 🗂️ Project Structure

```
src/
├── index.ts              # Main Hono application
├── server.ts             # Local development server
├── lambda.ts             # AWS Lambda handler
├── routes/
│   └── documents.ts      # Document API routes
├── services/
│   ├── document-service.ts  # DynamoDB operations
│   └── s3-service.ts     # S3 operations
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    └── aws-config.ts     # AWS client configuration
```

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check TypeScript compilation |
| `npm run clean` | Remove build directory |

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

## 🔐 Security Considerations

- **Presigned URLs**: Limited-time access (1 hour by default)
- **CORS**: Configured for specific allowed origins
- **Authentication**: Ready for Cognito integration
- **Validation**: Input validation on all endpoints

## 🚀 Deployment

This API can be deployed as:

1. **AWS Lambda** (using the `lambda.ts` handler)
2. **Container** (Docker/ECS)
3. **Traditional Server** (EC2/VPS)

For Lambda deployment, the `lambda.ts` file provides the AWS Lambda handler that wraps the Hono application.

## 🔍 Monitoring & Debugging

### Health Check

```bash
curl http://localhost:3001/health
```

### Logs

The application uses Hono's built-in logger middleware. In development, logs are output to the console.

### Environment Variables

All configuration is handled through environment variables. See `.env.example` for the complete list.

## 🤝 Integration with Frontend

This API is designed to work with the React frontend in `s3-upload-ui`. The frontend should:

1. Call `/presigned-url` to get upload URLs
2. Upload files directly to S3 using the presigned URL
3. Call the document creation endpoint to save metadata
4. Use other endpoints for document management

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
   - **Solution**: Make sure you have set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in your `.env` file, or configure AWS CLI with `aws configure`

2. **DynamoDB Access Denied**:
   - **Problem**: `AccessDenied` when accessing DynamoDB tables
   - **Solution**: Verify your IAM user has `DynamoDBFullAccess` or the specific permissions for the `Documents` and `General` tables

3. **S3 Permissions Error**:
   - **Problem**: Cannot generate presigned URLs or access S3 buckets
   - **Solution**: Ensure your IAM user has `S3FullAccess` or specific permissions for the `vibdmsstore2026` bucket

4. **Table Not Found**:
   - **Problem**: `ResourceNotFoundException: Requested resource not found`
   - **Solution**: Make sure the DynamoDB tables are created and the table names in `.env` match your infrastructure

5. **CORS Issues**:
   - **Problem**: Frontend can't connect to API
   - **Solution**: Update `ALLOWED_ORIGINS` in `.env` to include your frontend URL

### Testing AWS Connection

You can test your AWS credentials are working by running:

```bash
# Test AWS CLI access
aws dynamodb list-tables --region us-east-1
aws s3 ls s3://vibdmsstore2026

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
