# Documents UI

A modern React TypeScript frontend application built with AWS Cloudscape Design System for managing documents with Cognito authentication. This application provides a beautiful and intuitive interface for uploading, viewing, organizing, and managing documents that integrates seamlessly with the `docs-api` backend.

## 🚀 Features

- **Modern AWS Cloudscape UI**: Built with AWS's official design system for a professional, accessible interface
- **Cognito Authentication**: Full user authentication with login, registration, and session management
- **Admin Dashboard**: Admin users can manage all documents across all users
- **Document Management**: Upload, view, edit, and delete documents with folder organization
- **Folder Organization**: Create and manage hierarchical folder structures
- **File Upload**: Drag-and-drop file upload with progress tracking and validation
- **Protected Routes**: Route-level authentication protection
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **TypeScript**: Full type safety and excellent developer experience
- **Real-time Feedback**: Progress indicators, loading states, and comprehensive error handling
- **React Query Integration**: Efficient data fetching and caching

## 🏗️ Architecture

The application is built with:

- **React 19** with TypeScript for the frontend framework
- **AWS Cloudscape Components** for UI components following AWS design patterns
- **AWS Amplify** for authentication and AWS service integration
- **Cognito** for user authentication and authorization
- **React Router** for client-side routing with protected routes
- **TanStack React Query** for efficient data fetching and caching
- **Axios** for API communication with the `docs-api` backend
- **Modern React Patterns** including hooks, context providers, and functional components

## 📋 Prerequisites

- Node.js 18+ and npm
- Running `docs-api` backend (see `../docs-api/README.md`)
- Access to the AWS infrastructure deployed via `docs-infra`
- Cognito User Pool and Identity Pool configured

## 🛠️ Installation

1. **Navigate to the project directory**:

   ```bash
   cd docs-ui
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Create a `.env` file based on the example:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration values from the Terraform deployment:

   ```env
   # API Configuration (from Terraform output api_gateway_url)
   REACT_APP_API_URL=https://xxxxxxxxxx.execute-api.ap-northeast-3.amazonaws.com/dev/api

   # Environment
   REACT_APP_ENV=dev

   # AWS Configuration
   REACT_APP_AWS_REGION=ap-northeast-3

   # Cognito Configuration (from Terraform outputs)
   REACT_APP_USER_POOL_ID=ap-northeast-3_xxxxxxxxx
   REACT_APP_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   REACT_APP_IDENTITY_POOL_ID=ap-northeast-3:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

   # S3 Bucket for web store (from Terraform output web_store_bucket_name)
   REACT_APP_S3_BUCKET=docs-management-dev-web-store-2026-by-ctn

   # Default User (for demo purposes)
   REACT_APP_DEFAULT_USER_ID=demo-user
   ```

   > **Note**: Get actual values from your Terraform deployment by running:
   >
   > ```bash
   > cd docs-infra
   > terraform output ui_env_config
   > ```

## 🚦 Getting Started

### Development Mode

Start the development server:

```bash
npm start
```

The application will start on `http://localhost:3000` and automatically open in your browser.

### Production Build

Build the application for production:

```bash
npm run build
```

This creates an optimized build in the `build/` directory ready for deployment.

## 📱 Application Features

### 🔐 Authentication Pages

- **Login Page (`/login`)**: Secure user authentication with Cognito
- **Registration Page (`/register`)**: New user registration with email verification
- **Protected Routes**: Automatic redirection to login for unauthenticated users
- **Session Management**: Persistent login state with automatic token refresh

### 🏠 Main Dashboard

- Clean, modern interface following AWS design patterns
- Navigation sidebar with easy access to all features
- Responsive layout that works on all devices
- User profile management and logout functionality

### 📄 Documents Page (`/documents`)

- **Document List**: View all your uploaded documents in a table format
- **Folder Navigation**: Browse and organize documents in hierarchical folders
- **Search & Filter**: Find documents quickly with real-time search
- **Bulk Operations**: Select multiple documents for batch actions
- **Quick Actions**: Download, edit, or delete documents directly from the list
- **Pagination**: Efficient browsing of large document collections
- **File Icons**: Visual file type indicators for quick identification

### ⬆️ Upload Page (`/upload`)

- **Drag & Drop**: Intuitive file upload with drag-and-drop support
- **Multiple Files**: Upload multiple documents at once
- **Folder Selection**: Choose destination folder for uploaded files
- **File Validation**: Automatic validation of file types and sizes
- **Progress Tracking**: Real-time upload progress with detailed feedback
- **Auto-naming**: Smart title suggestions based on file names
- **Rich Metadata**: Add titles and descriptions to organize your documents

### �‍💼 Admin Page (`/admin`)

- **Admin Dashboard**: Available only to users with admin privileges
- **User Management**: View and manage all users in the system
- **Global Document Access**: Access and manage documents from all users
- **System Overview**: Monitor system usage and statistics

### 📋 Document Management Features

- **Folder Creation**: Create nested folder structures for organization
- **File Operations**: Copy, move, rename files and folders
- **Batch Operations**: Perform actions on multiple items at once
- **Advanced Search**: Search across file names, descriptions, and metadata
- **File Preview**: Quick preview of document information
- **Download Options**: Single file or bulk downloads

## 🎨 Design System

This application uses the **AWS Cloudscape Design System**, which provides:

- **Consistent UI**: Professional, accessible components following AWS design standards
- **Responsive Design**: Components that work seamlessly across all screen sizes
- **Accessibility**: Built-in accessibility features and ARIA support
- **Performance**: Optimized components for fast rendering and smooth interactions
- **Theming**: Consistent styling that matches AWS console experiences

## 🗂️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── AppLayout.tsx    # Main application layout with navigation
│   ├── AuthProvider.tsx # Cognito authentication context provider
│   └── ProtectedRoute.tsx # Route protection for authenticated users
├── hooks/               # Custom React hooks
│   └── useDocuments.ts  # Document management hooks
├── pages/               # Page components
│   ├── DocumentsPage.tsx    # Document listing and management
│   ├── UploadPage.tsx       # File upload interface
│   ├── LoginPage.tsx        # User login
│   ├── RegisterPage.tsx     # User registration
│   ├── AdminPage.tsx        # Admin dashboard
│   └── index.ts            # Page exports
├── providers/           # Context providers
│   └── QueryProvider.tsx   # React Query configuration
├── services/            # API communication
│   └── documentService.ts  # Document API calls
├── types/               # TypeScript interfaces
│   ├── auth.ts         # Authentication types
│   └── index.ts        # Application types
├── utils/               # Utility functions
│   └── helpers.ts      # File formatting and validation
├── App.tsx             # Main application component with routing
├── aws-exports.js      # AWS Amplify configuration
└── index.tsx           # Application entry point
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build production-ready application |
| `npm test` | Run Jest tests |
| `npm run eject` | Eject from Create React App (⚠️ irreversible) |

## 🔗 API Integration

The frontend integrates with the `docs-api` backend through the following workflow:

### Authentication Flow

1. **User registration/login** via Cognito authentication
2. **JWT token management** with automatic refresh
3. **Protected API calls** with authorization headers
4. **Role-based access** for admin functionality

### Document Upload Process

1. **User authenticates** and selects files via the upload interface
2. **Frontend requests presigned URLs** from the authenticated API
3. **Files upload directly to S3** using presigned URLs with user-specific paths
4. **Frontend creates document records** via the API with folder organization
5. **Success confirmation** and redirect to documents list

### Document Management

- **List Documents**: Fetch paginated document lists with folder navigation
- **Folder Operations**: Create, navigate, and manage folder structures
- **View Details**: Get comprehensive document information
- **Download Files**: Get secure download URLs for file access
- **Delete Documents**: Remove documents and associated S3 files
- **Admin Operations**: Admin users can access all user documents

## 🚀 Deployment Options

### 1. S3 Static Website (Recommended)

The application is designed to be deployed as a static website on S3, which is automatically configured by the `docs-infra` Terraform deployment:

```bash
# Build the application
npm run build

# The docs-infra deployment automatically creates:
# - S3 bucket for static hosting (vibdmswebstore2026-by-ctn)
# - Public read permissions for static files
# - Website configuration with index.html routing
```

### 2. AWS Amplify

```bash
# Build the application
npm run build

# Deploy to Amplify Console
# Connect your GitHub repository and Amplify will automatically deploy
```

### 3. Manual S3 Deployment

```bash
# Build the application
npm run build

# Upload to the web store S3 bucket
aws s3 sync build/ s3://vibdmswebstore2026-by-ctn --delete
```

## 🔐 Security Considerations

- **Cognito Authentication**: Full user authentication with JWT tokens
- **Protected Routes**: Client-side route protection with automatic redirects
- **Secure API Communication**: All API calls use HTTPS and include authentication
- **Environment Variables**: Sensitive configuration stored in environment variables
- **CORS**: Configured to work with the API's CORS settings
- **File Validation**: Client-side file type and size validation
- **User Isolation**: Users can only access their own documents unless they are admins
- **Admin Role Verification**: Server-side admin role validation for sensitive operations

## 🧪 Testing

Run the test suite:

```bash
npm test
```

The test suite includes:

- Component unit tests
- Authentication flow tests  
- API integration tests
- User interaction tests

## 🤝 Integration with Backend

This `docs-ui` application is designed specifically for the `docs-api` backend:

- **Shared Authentication**: Both use the same Cognito User Pool
- **API Compatibility**: Direct integration with all API endpoints
- **Shared Infrastructure**: Uses the same AWS resources deployed via `docs-infra`
- **User Management**: Supports the same user roles and permissions
- **Folder Structure**: Matches the backend's folder organization system

## 🔧 Development Tips

### Environment Setup

1. Ensure the `docs-infra` is deployed first to get required AWS resources
2. Get Terraform outputs for environment configuration:

   ```bash
   cd docs-infra
   terraform output ui_env_config
   ```

3. Update your `.env` file with the actual values
4. Start the backend API before frontend development

### Local Development with Backend

```bash
# Terminal 1: Start the backend API
cd docs-api
npm run dev

# Terminal 2: Start the frontend
cd docs-ui
npm start
```

### Authentication Testing

- Create test users via the registration page
- Test admin functionality by adding users to the admin group in Cognito
- Use the AWS CLI or Console to manage Cognito users for testing

## 📄 License

MIT License - see LICENSE file for details.

---

For more information about the overall project architecture, see the main README in the project root.
