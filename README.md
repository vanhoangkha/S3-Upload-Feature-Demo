# Documentation System Setup Guide

This guide explains how to run both the documentation API (docs-api) and documentation UI (docs-ui) components of the S3 Upload Feature Demo project.

## Prerequisites

Before starting, ensure you have:

- Node.js (v14 or later)
- AWS CLI configured with appropriate permissions
- npm or yarn package manager

## Running the Documentation API (docs-api)

The docs-api component serves as the backend for the documentation system, providing API endpoints for the documentation UI.

### Installation

1. Navigate to the docs-api directory:
   ```bash
   cd backend/docs-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the docs-api directory with the following variables:
   ```
   PORT=3001
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-docs-bucket-name
   API_KEY=your-api-key-for-security
   ```

### Running in Development Mode

```bash
npm run dev
```

This will start the docs-api server in development mode with hot reloading enabled.

### Running in Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

## Running the Documentation UI (docs-ui)

The docs-ui component provides a user-friendly interface for browsing and searching documentation.

### Installation

1. Navigate to the docs-ui directory:
   ```bash
   cd frontend/docs-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the docs-ui directory with the following variables:
   ```
   VITE_API_URL=http://localhost:3001/api
   VITE_APP_TITLE=S3 Upload Feature Documentation
   ```

### Running in Development Mode

```bash
npm run dev
```

This will start the development server, typically on port 3000. Open your browser and navigate to `http://localhost:3000` to view the documentation UI.

### Building for Production

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

### Serving the Production Build

```bash
npm run preview
```

This will serve the production build locally for testing.

## Running Both Components Together

For convenience, you can use the following commands from the project root to run both components simultaneously:

1. Install dependencies for both components:
   ```bash
   npm run install:all
   ```

2. Start both services in development mode:
   ```bash
   npm run start:docs
   ```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/docs` | GET | List all available documentation |
| `/api/docs/:id` | GET | Get specific documentation by ID |
| `/api/docs/search` | GET | Search documentation by keyword |

## Troubleshooting

### Common Issues

1. **API Connection Error**:
   - Ensure the docs-api server is running
   - Check that the VITE_API_URL in docs-ui .env file matches the docs-api server address
   - Verify network connectivity between the services

2. **Missing Documentation**:
   - Confirm that the S3 bucket specified in docs-api .env exists and contains documentation files
   - Check AWS credentials have proper permissions to access the bucket

3. **CORS Issues**:
   - If accessing the UI from a different domain than the API, ensure CORS is properly configured in the docs-api server
