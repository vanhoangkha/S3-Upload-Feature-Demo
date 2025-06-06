# S3 Upload UI with AWS Cloudscape Design System

This document provides an overview of the S3 Upload UI project that has been rewritten using AWS Cloudscape Design System.

## Project Overview

The S3 Upload Feature Demo UI is a React application that provides a user-friendly interface for managing files in Amazon S3. It includes features like authentication, file uploads, downloads, and document management with a clean, responsive design using AWS Cloudscape Design System components.

## Key Features

- User authentication with Amazon Cognito
- File upload with progress tracking
- Document listing and management
- Profile management
- Responsive design using AWS Cloudscape Design System

## Project Structure

```
s3-upload-ui/
├── src/
│   ├── components/           # Reusable components
│   │   ├── AuthProvider.js   # Authentication context provider
│   │   ├── ProtectedRoute.js # Route protection component
│   │   └── index.js          # Component exports
│   ├── layouts/              # Layout components
│   │   ├── AppLayout.js      # Main application layout with navigation
│   │   └── index.js          # Layout exports
│   ├── pages/                # Page components
│   │   ├── Home.js           # Home page
│   │   ├── Documents.js      # Document management page
│   │   ├── Profile.js        # User profile page
│   │   ├── Login.js          # Login page
│   │   ├── Register.js       # Registration page
│   │   ├── ForgotPassword.js # Password recovery page
│   │   └── index.js          # Page exports
│   ├── App.js                # Main application component
│   ├── index.js              # Application entry point
│   └── aws-exports.js        # AWS Amplify configuration
├── public/                   # Static assets
└── package.json              # Project dependencies and scripts
```

## AWS Cloudscape Design System

The application uses AWS Cloudscape Design System, which provides a set of React components that follow AWS design guidelines. Key components used include:

- `AppLayout`: Main layout component with navigation
- `Container`: Content container with header and footer
- `Header`: Section headers
- `Table`: For displaying document lists
- `Form`: For input forms
- `Button`: For actions
- `Modal`: For dialogs
- `Alert`: For notifications
- `SpaceBetween`: For spacing between components
- `ProgressBar`: For upload progress

## Authentication Flow

The application uses Amazon Cognito for authentication with the following flows:

1. **Sign In**: Users can sign in with their username and password
2. **Sign Up**: New users can register with email verification
3. **Password Recovery**: Users can reset their password via email verification
4. **Protected Routes**: Routes are protected using the `ProtectedRoute` component

## Document Management

The Documents page provides the following features:

- List documents stored in S3
- Upload new documents with progress tracking
- Download documents
- Delete selected documents
- Filter documents by name
- Pagination for large document lists

## User Profile

The Profile page allows users to:

- View their profile information
- Update their email address
- Change their password

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Configure AWS Amplify:
Update the `src/aws-exports.js` file with your AWS configuration.

3. Start the development server:
```bash
yarn start
```

## Building for Production

Build the app for production:
```bash
yarn build
```

This builds the app for production to the `build` folder, optimized for the best performance.

## Additional Resources

- [AWS Cloudscape Design System Documentation](https://cloudscape.design/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [React Router Documentation](https://reactrouter.com/)
