# S3 Upload Feature Demo

This project demonstrates a modern document management system with secure S3 uploads, featuring a backend API (docs-api) and a frontend UI (docs-ui) built with React and AWS Cloudscape Design System.

## System Architecture

The system consists of two main components:

1. **Documentation API (docs-api)**
   - Built with HonoJS, a lightweight, high-performance web framework
   - Provides secure S3 presigned URLs for document uploads
   - Manages document metadata in DynamoDB
   - Supports document operations (upload, download, list, delete)

2. **Documentation UI (docs-ui)**
   - Built with React 19 and AWS Cloudscape Design System
   - Provides a user-friendly interface for document management
   - Features responsive design for desktop and mobile devices
   - Includes document upload with progress tracking

## Key Features

### Vendor-Based Bucket Structure
- Each vendor has a dedicated folder within the S3 bucket
- Hierarchical organization for better document management
- Logical separation of vendor documents for improved security and organization

### Role-Based Access Control Matrix
- **Vendor Role**: Limited access to their own folder only
  - Can upload, download, and view their own documents
  - Cannot access other vendors' documents
  - Limited visibility within the UI
- **Admin Role**: Full access to all vendor folders
  - Complete management of all documents across vendors
  - Can perform administrative operations
  - Full visibility of the entire document hierarchy

### File Operations with Permission Controls
- **Upload**: Controlled by role permissions
- **Download**: Access restricted based on user role
- **Delete**: Limited to authorized users based on role
- All operations respect the permission boundaries

### Tree View User Interface
- Hierarchical display of folders and documents
- Intuitive navigation through the vendor folder structure
- Expandable/collapsible folders for better organization
- Visual indicators for document types and permissions

### Optional: Cross-Account Synchronization
- Ability to sync documents across different AWS accounts
- Maintain consistent document versions across environments
- Secure transfer mechanisms between accounts
- Configurable sync schedules and policies

## Prerequisites

Before starting, ensure you have:

- Node.js (v16 or later)
- AWS CLI configured with appropriate permissions
- npm or yarn package manager
- AWS resources deployed (S3 buckets, DynamoDB tables)

## Running the Documentation API (docs-api)

### Installation

1. Navigate to the docs-api directory:
   ```bash
   cd docs-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the docs-api directory with the following variables:
   ```
   # AWS Configuration
   AWS_REGION=us-east-1
   
   # DynamoDB Tables
   DOCUMENTS_TABLE_NAME=Documents
   GENERAL_TABLE_NAME=General
   
   # S3 Buckets
   DOCUMENT_STORE_BUCKET_NAME=your-document-bucket-name
   WEB_STORE_BUCKET_NAME=your-web-bucket-name
   
   # Local Development
   PORT=3001
   NODE_ENV=development
   
   # CORS allowed origins
   ALLOWED_ORIGINS=http://localhost:3000
   
   # Presigned URL expiry (in seconds)
   PRESIGNED_URL_EXPIRY=3600
   ```

### Running in Development Mode

```bash
npm run dev
```

This will start the docs-api server in development mode with hot reloading enabled on port 3001.

### Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/api/documents` | GET | List all documents for a user |
| `/api/documents/presigned-url` | POST | Generate a presigned URL for S3 upload |
| `/api/documents` | POST | Create document metadata after upload |
| `/api/documents/:user_id/:file` | GET | Get document metadata |
| `/api/documents/:user_id/:file/download` | GET | Get document download URL |
| `/api/documents/:user_id/:file` | DELETE | Delete a document |
| `/api/vendors` | GET | List all vendors |
| `/api/vendors/:vendor_id/documents` | GET | List documents for a specific vendor |
| `/api/roles` | GET | Get user role information |

### Building for Production

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

### Running in Production Mode

```bash
npm start
```

## Running the Documentation UI (docs-ui)

### Installation

1. Navigate to the docs-ui directory:
   ```bash
   cd docs-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the docs-ui directory with the following variables:
   ```
   # API Configuration
   REACT_APP_API_URL=http://localhost:3001/api
   
   # Environment
   REACT_APP_ENV=development
   
   # Default User (for demo purposes)
   REACT_APP_DEFAULT_USER_ID=demo-user
   
   # Default Role (admin or vendor)
   REACT_APP_DEFAULT_ROLE=admin
   ```

### Running in Development Mode

```bash
npm start
```

This will start the development server on port 3000. Open your browser and navigate to `http://localhost:3000` to view the documentation UI.

### Available Pages

| Route | Description |
|-------|-------------|
| `/documents` | Main document listing page with tree view |
| `/upload` | Document upload page |
| `/vendors` | Vendor management (admin only) |
| `/settings` | User settings and preferences |

### Building for Production

```bash
npm run build
```

This will create a production-ready build in the `build` directory.

## Running Both Components Together

For convenience, you can use the following commands from the project root:

1. Install dependencies for both components:
   ```bash
   npm run install:all
   ```

2. Start both services in development mode:
   ```bash
   npm run start:dev
   ```

## Troubleshooting

### Common Issues

1. **API Connection Error**:
   - Ensure the docs-api server is running
   - Check that the REACT_APP_API_URL in docs-ui .env file matches the docs-api server address
   - Verify network connectivity between the services

2. **S3 Upload Failures**:
   - Confirm that the S3 bucket specified in docs-api .env exists
   - Check AWS credentials have proper permissions to access the bucket
   - Verify the presigned URL hasn't expired (default is 1 hour)

3. **CORS Issues**:
   - Ensure the frontend origin is listed in the ALLOWED_ORIGINS environment variable in docs-api
   - Check browser console for CORS-related errors

4. **Permission Errors**:
   - Verify user role assignments in the database
   - Check IAM policies for proper S3 and DynamoDB access
   - Ensure bucket policies allow the necessary operations

5. **Tree View Display Issues**:
   - Clear browser cache if tree structure doesn't update
   - Check network requests for proper data loading
   - Verify folder structure permissions match user role

## Technology Stack

### Backend (docs-api)
- HonoJS web framework
- AWS SDK v3 for JavaScript
- TypeScript
- DynamoDB for document metadata and permissions
- S3 for document storage with folder structure
- IAM for role-based access control

### Frontend (docs-ui)
- React 19
- TypeScript
- AWS Cloudscape Design System
- React Router v7
- Axios for API requests
- Tree component for hierarchical document display

## Security Features

- Presigned URLs for secure, temporary S3 access
- Role-based access control for documents
- Vendor isolation through folder structure
- CORS protection
- Environment-based configuration
- No direct exposure of AWS credentials to the frontend
