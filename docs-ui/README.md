# Documents UI

A modern React TypeScript frontend application built with AWS Cloudscape Design System for managing documents. This application provides a beautiful and intuitive interface for uploading, viewing, editing, and managing documents that integrates seamlessly with the `docs-api` backend.

## 🚀 Features

- **Modern AWS Cloudscape UI**: Built with AWS's official design system for a professional, accessible interface
- **Document Management**: Upload, view, edit, and delete documents with ease
- **File Upload**: Drag-and-drop file upload with progress tracking and validation
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **TypeScript**: Full type safety and excellent developer experience
- **Real-time Feedback**: Progress indicators, loading states, and comprehensive error handling

## 🏗️ Architecture

The application is built with:

- **React 19** with TypeScript for the frontend framework
- **AWS Cloudscape Components** for UI components following AWS design patterns
- **React Router** for client-side routing
- **Axios** for API communication with the `docs-api` backend
- **Modern React Patterns** including hooks and functional components

## 📋 Prerequisites

- Node.js 18+ and npm
- Running `docs-api` backend (see `../docs-api/README.md`)
- Access to the AWS infrastructure deployed via `s3-upload-infra`

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

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   # API Configuration
   REACT_APP_API_URL=http://localhost:3001/api

   # Environment
   REACT_APP_ENV=development

   # Default User (for demo purposes)
   REACT_APP_DEFAULT_USER_ID=demo-user
   ```

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

### 🏠 Main Dashboard

- Clean, modern interface following AWS design patterns
- Navigation sidebar with easy access to all features
- Responsive layout that works on all devices

### 📄 Documents Page (`/documents`)

- **Document List**: View all your uploaded documents in a table format
- **Search & Filter**: Find documents quickly with real-time search
- **Bulk Operations**: Select multiple documents for batch actions
- **Quick Actions**: Download, edit, or delete documents directly from the list
- **Pagination**: Efficient browsing of large document collections
- **File Icons**: Visual file type indicators for quick identification

### ⬆️ Upload Page (`/upload`)

- **Drag & Drop**: Intuitive file upload with drag-and-drop support
- **Multiple Files**: Upload multiple documents at once
- **File Validation**: Automatic validation of file types and sizes
- **Progress Tracking**: Real-time upload progress with detailed feedback
- **Auto-naming**: Smart title suggestions based on file names
- **Rich Metadata**: Add titles and descriptions to organize your documents

### 📋 Document Detail Page (`/documents/:userId/:fileName`)

- **Document Information**: View comprehensive document metadata
- **Inline Editing**: Edit document titles and descriptions without page refresh
- **Quick Download**: One-click document download
- **File Preview**: Visual file information with type-specific icons
- **Status Indicators**: Clear status display for document availability
- **Action Buttons**: Easy access to edit, download, and delete operations

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
│   └── AppLayout.tsx    # Main application layout
├── pages/               # Page components
│   ├── DocumentsPage.tsx      # Document listing page
│   ├── DocumentDetailPage.tsx # Document detail view
│   ├── UploadPage.tsx         # File upload page
│   └── index.ts              # Page exports
├── services/            # API communication
│   └── documentService.ts    # Document API calls
├── types/               # TypeScript interfaces
│   └── index.ts        # Application types
├── utils/               # Utility functions
│   └── helpers.ts      # File formatting and validation
├── App.tsx             # Main application component
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

### Document Upload Process

1. **User selects files** via the upload interface
2. **Frontend requests presigned URLs** from the API
3. **Files upload directly to S3** using presigned URLs
4. **Frontend creates document records** via the API
5. **Success confirmation** and redirect to documents list

### Document Management

- **List Documents**: Fetch paginated document lists with filtering
- **View Details**: Get comprehensive document information
- **Edit Metadata**: Update document titles and descriptions
- **Download Files**: Get secure download URLs for file access
- **Delete Documents**: Remove documents and associated S3 files

## 🚀 Deployment Options

### 1. AWS Amplify (Recommended)

```bash
# Build the application
npm run build

# Deploy to Amplify Console
# Connect your GitHub repository and Amplify will automatically deploy
```

### 2. Static Hosting (S3 + CloudFront)

```bash
# Build the application
npm run build

# Upload to S3 bucket
aws s3 sync build/ s3://your-bucket-name --delete
```

## 🔐 Security Considerations

- **Environment Variables**: Sensitive configuration stored in environment variables
- **CORS**: Configured to work with the API's CORS settings
- **File Validation**: Client-side file type and size validation
- **Secure API Communication**: All API calls use HTTPS in production

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 🤝 Integration with Existing UI

This `docs-ui` application works alongside the existing `s3-upload-ui`:

- **Shared AWS Infrastructure**: Both use the same S3 buckets and DynamoDB tables
- **API Compatibility**: Both can use the same `docs-api` backend
- **Independent Deployment**: Can be deployed and maintained separately

## 📄 License

MIT License - see LICENSE file for details.

---

For more information about the overall project architecture, see the main README in the project root.
