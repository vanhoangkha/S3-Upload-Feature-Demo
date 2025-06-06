# S3 Upload Feature Demo

A demonstration project showcasing how to implement secure file uploads to Amazon S3 using modern web technologies.

## Overview

This project provides a complete implementation of a file upload system using AWS S3 for storage. It demonstrates best practices for secure direct uploads to S3 from web browsers, including pre-signed URLs, proper access control, and client-side validation.

## Features

- Direct browser-to-S3 uploads using pre-signed URLs
- Support for multiple file types and size validation
- Progress tracking for uploads
- Serverless backend using AWS Lambda and API Gateway
- Secure access control with IAM policies
- Configurable file retention policies
- Thumbnail generation for image uploads
- Responsive UI for both desktop and mobile devices

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Web Client │────▶│ API Gateway │────▶│   Lambda    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       │                                       ▼
       │                               ┌─────────────┐
       │                               │             │
       └──────────────────────────────▶│     S3      │
                                       │             │
                                       └─────────────┘
```

## Prerequisites

- AWS Account
- Node.js (v14 or later)
- AWS CLI configured with appropriate permissions
- Git

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/vanhoangkha/S3-Upload-Feature-Demo.git
   cd S3-Upload-Feature-Demo
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure AWS credentials:
   ```
   aws configure
   ```

4. Deploy the backend infrastructure:
   ```
   npm run deploy
   ```

## Configuration

Create a `.env` file in the project root with the following variables:

```
S3_BUCKET_NAME=your-bucket-name
REGION=us-east-1
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

## Usage

1. Start the development server:
   ```
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Use the upload interface to select and upload files to S3

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/presigned-url` | POST | Generate a pre-signed URL for S3 upload |
| `/api/files` | GET | List all uploaded files |
| `/api/files/{fileId}` | GET | Get details of a specific file |
| `/api/files/{fileId}` | DELETE | Delete a file from S3 |

## Security Considerations

- All uploads use pre-signed URLs with limited time validity
- CORS is properly configured on the S3 bucket
- File type validation occurs on both client and server
- IAM policies follow the principle of least privilege
- All data is encrypted at rest using S3 server-side encryption

## Development

### Project Structure

```
├── backend/
│   ├── functions/
│   │   ├── generatePresignedUrl.js
│   │   ├── listFiles.js
│   │   └── deleteFile.js
│   └── serverless.yml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── README.md
```

### Local Development

For local development with mock S3:

```
npm run dev:mock
```

This uses a local mock of S3 for development without requiring AWS credentials.

## Deployment

### Development Environment

```
npm run deploy:dev
```

### Production Environment

```
npm run deploy:prod
```

## Testing

Run the test suite:

```
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- AWS Documentation for S3 and Lambda
- The serverless framework community
- All contributors to this project
