# S3 Upload Feature Demo - React UI Guide

This guide provides detailed instructions for setting up and running the React-based user interface for the S3 Upload Feature Demo using Yarn.

## Overview

The S3 Upload Feature Demo UI is a React application that provides a user-friendly interface for managing files in Amazon S3. It includes features like authentication, file uploads, downloads, and document management with a clean, responsive design.

![S3 Upload Demo UI](https://via.placeholder.com/800x450.png?text=S3+Upload+Demo+UI)

## Features

- User authentication with Amazon Cognito
- File upload with progress tracking
- Document listing and management
- Profile management
- Responsive design for desktop and mobile

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or later) - [Download Node.js](https://nodejs.org/)
2. **Yarn** - [Installation Guide](https://yarnpkg.com/getting-started/install)
3. **AWS Account** - The backend infrastructure should be deployed first

## Project Structure

```
s3-upload-ui/
├── src/
│   ├── component/
│   │   ├── Authen/       # Authentication components (Login, Register)
│   │   ├── Document/     # Document management components
│   │   ├── Home/         # Home page components
│   │   ├── Menu/         # Navigation menu components
│   │   └── Profile/      # User profile components
│   ├── common/           # Common UI components (ProgressBar, etc.)
│   ├── App.js            # Main application component
│   ├── constant.js       # Application constants and utilities
│   └── index.js          # Application entry point
├── public/               # Static assets
├── amplify/              # AWS Amplify configuration
└── package.json          # Project dependencies and scripts
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/vanhoangkha/S3-Upload-Feature-Demo.git
cd S3-Upload-Feature-Demo/s3-upload-ui
```

### 2. Install Dependencies

```bash
yarn install
```

This will install all the required dependencies listed in the `package.json` file.

### 3. Configure AWS Amplify

The application uses AWS Amplify to connect to the backend services. You need to configure it with your AWS resources.

If you've already deployed the backend using SAM, you should have the necessary configuration values from the outputs.

#### Option 1: Manual Configuration

Create or update the `src/aws-exports.js` file with your AWS configuration:

```javascript
const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_identity_pool_id": "YOUR_IDENTITY_POOL_ID",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "YOUR_USER_POOL_ID",
  "aws_user_pools_web_client_id": "YOUR_USER_POOL_CLIENT_ID",
  "aws_user_files_s3_bucket": "YOUR_S3_BUCKET_NAME",
  "aws_user_files_s3_bucket_region": "us-east-1"
};

export default awsmobile;
```

#### Option 2: Using Amplify CLI

If you prefer to use the Amplify CLI:

```bash
# Install Amplify CLI if you haven't already
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
amplify init

# Add authentication
amplify add auth

# Add storage
amplify add storage

# Push the configuration to AWS
amplify push
```

### 4. Update API Endpoint

Open `src/constant.js` and update the `APP_API_URL` with your API Gateway endpoint URL:

```javascript
export const APP_API_URL = "YOUR_API_GATEWAY_ENDPOINT";
```

You can find this URL in the outputs of your SAM deployment.

## Running the Application

### Development Mode

Start the development server:

```bash
yarn start
```

This will run the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes. You may also see any lint errors in the console.

### Testing

Run the test suite:

```bash
yarn test
```

This launches the test runner in interactive watch mode.

### Building for Production

Build the app for production:

```bash
yarn build
```

This builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

## Deploying the UI

### Option 1: Manual Deployment to S3

1. Build the application:
```bash
yarn build
```

2. Upload the contents of the `build` folder to your S3 web hosting bucket:
```bash
aws s3 sync build/ s3://YOUR_WEB_BUCKET_NAME
```

3. Access your application at the S3 website URL.

### Option 2: Using AWS Amplify Hosting

1. Install and configure the Amplify CLI if you haven't already:
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. Add hosting to your Amplify project:
```bash
amplify add hosting
```

3. Publish your application:
```bash
amplify publish
```

## Using the Application

### Authentication

1. **Register**: Create a new account with your email and password
2. **Login**: Sign in with your credentials
3. **Logout**: Sign out from the application

### Document Management

1. **Upload Files**: Use the upload button to select and upload files
2. **View Documents**: Browse your uploaded documents in the document list
3. **Download Files**: Click on a document to download it
4. **Delete Files**: Remove documents you no longer need

### Profile Management

1. **View Profile**: See your user information
2. **Update Profile**: Modify your profile details

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your Cognito User Pool configuration
   - Check that you're using the correct User Pool ID and Client ID

2. **API Connection Issues**
   - Ensure the API Gateway endpoint URL is correct
   - Check CORS settings on your API Gateway

3. **File Upload Problems**
   - Verify S3 bucket permissions
   - Check file size limits in your configuration

4. **Build Errors**
   - Clear node_modules and reinstall dependencies:
     ```bash
     rm -rf node_modules
     yarn install
     ```

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
