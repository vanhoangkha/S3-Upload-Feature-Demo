# S3 Upload Feature Demo - User Interface

A modern React-based S3 file management interface with vendor-specific folder structure and role-based access control. This application provides a user-friendly interface for managing files in S3 buckets with a tree view structure.

## Features

- Tree view for vendor-based folder structure
- Role-based access control (Vendor/Admin)
- Secure file operations:
  - Upload files to vendor folders
  - Download files with proper permissions
  - Delete files with proper permissions
- Cross-account synchronization interface
- Real-time folder structure updates
- Drag-and-drop file upload
- File type validation
- Progress tracking for uploads

## Tech Stack

- React 18
- AWS Amplify
- Material-UI
- TypeScript
- React DnD (Drag and Drop)
- Jest for testing
- ESLint + Prettier for code quality

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- AWS account with appropriate permissions
- AWS Amplify CLI

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd s3-upload-ui
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Configure AWS Amplify:
```bash
amplify configure
amplify init
```

4. Start the development server:
```bash
yarn start
# or
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `yarn start` - Runs the app in development mode
- `yarn test` - Launches the test runner
- `yarn build` - Builds the app for production
- `yarn lint` - Runs ESLint to check code quality
- `yarn format` - Formats code using Prettier

## Project Structure

```
s3-upload-ui/
├── src/
│   ├── components/
│   │   ├── TreeView/        # Folder tree view component
│   │   ├── FileUpload/      # File upload component
│   │   ├── FileList/        # File listing component
│   │   └── common/          # Shared UI components
│   ├── pages/
│   │   ├── Dashboard/       # Main dashboard
│   │   ├── VendorView/      # Vendor-specific view
│   │   └── AdminView/       # Admin view
│   ├── services/
│   │   ├── s3/             # S3 operations
│   │   ├── auth/           # Authentication
│   │   └── sync/           # Cross-account sync
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   └── App.tsx             # Main application component
├── public/                 # Static assets
├── amplify/               # AWS Amplify configuration
└── tests/                 # Test files
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_ENDPOINT=<your-api-endpoint>
REACT_APP_REGION=<aws-region>
REACT_APP_USER_POOL_ID=<cognito-user-pool-id>
REACT_APP_USER_POOL_WEB_CLIENT_ID=<cognito-client-id>
```

## User Roles

### Vendor Role
- Access to their specific vendor folder
- Upload/download/delete files in their folder
- View folder structure

### Admin Role
- Access to all vendor folders
- Manage vendor permissions
- Configure cross-account sync
- View system-wide analytics

## Testing

Run the test suite:
```bash
yarn test
```

For coverage report:
```bash
yarn test --coverage
```

## Building for Production

1. Build the application:
```bash
yarn build
```

2. Deploy to AWS:
```bash
amplify publish
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and ensure they pass
4. Submit a pull request

## Security

- AWS Cognito authentication
- Pre-signed URLs for file operations
- Role-based access control
- Secure file type validation
- HTTPS for all communications

## Support

For support and questions, please:
1. Check the documentation
2. Create an issue in the repository
3. Contact the development team

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
