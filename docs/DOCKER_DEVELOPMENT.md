# 🐳 Docker Compose Development Guide

This project includes a complete Docker Compose setup for local development with LocalStack and DynamoDB Local.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- AWS CLI (for setup scripts)
- Make (optional, for convenience commands)

### Start Development Environment

```bash
# Start all services
make dev-up
# or
docker-compose up -d

# View logs
make dev-logs
# or  
docker-compose logs -f
```

### Stop Development Environment

```bash
# Stop all services
make dev-down
# or
docker-compose down

# Clean up everything (including volumes)
make dev-clean
```

## 📋 Services

| Service | Port | Description |
|---------|------|-------------|
| **API** | 3001 | Node.js/Express API server |
| **Web** | 3000 | React development server |
| **LocalStack** | 4566 | AWS services (S3, Cognito, KMS) |
| **DynamoDB Local** | 8000 | Local DynamoDB instance |

## 🔧 Development Workflow

### 1. Start Services
```bash
make dev-up
```

This will:
- Start LocalStack (S3, Cognito, KMS)
- Start DynamoDB Local
- Start API development server
- Start Web development server
- Create required AWS resources

### 2. Access Applications
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001/v1
- **API Health**: http://localhost:3001/health

### 3. Development Features
- **Hot Reload**: Both API and Web auto-reload on file changes
- **Local AWS**: All AWS services run locally via LocalStack
- **Local Database**: DynamoDB runs locally with in-memory storage
- **CORS Enabled**: API configured for local web development

## 🛠️ Individual Services

### Start Only API
```bash
make local-api
# or
docker-compose up -d dynamodb-local localstack api-dev
```

### Start Only Web
```bash
make local-web
# or
docker-compose up -d web-dev
```

## 🔍 Debugging

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-dev
docker-compose logs -f web-dev
docker-compose logs -f localstack
```

### Check Service Health
```bash
# API Health
curl http://localhost:3001/health

# LocalStack Health
curl http://localhost:4566/health

# DynamoDB Local
curl http://localhost:8000
```

### Access LocalStack Services
```bash
# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List DynamoDB tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

## 🔧 Configuration

### Environment Variables

#### API Service
- `NODE_ENV=development`
- `AWS_REGION=us-east-1`
- `AWS_ENDPOINT_URL=http://localstack:4566`
- `DYNAMODB_ENDPOINT=http://dynamodb-local:8000`
- `TABLE_NAME=dms-dev-documents`
- `AUDIT_TABLE=dms-dev-role-audits`
- `DOC_BUCKET=dms-dev-docs`

#### Web Service
- `VITE_API_BASE_URL=http://localhost:3001/v1`
- `VITE_COGNITO_DOMAIN=http://localhost:4566`
- `VITE_USER_POOL_ID=local-pool`
- `VITE_USER_POOL_CLIENT_ID=local-client`

### Volume Mounts
- API source code: `./api/src` → `/app/src`
- Web source code: `./web/src` → `/app/src`
- LocalStack data: `/tmp/localstack` (persistent)

## 🧹 Cleanup

### Remove All Containers and Volumes
```bash
make dev-clean
```

### Reset Development Environment
```bash
make dev-restart
```

## 🚨 Troubleshooting

### Services Won't Start
1. Check Docker is running
2. Check ports 3000, 3001, 4566, 8000 are available
3. Run `docker-compose down` and try again

### LocalStack Issues
1. Check LocalStack logs: `docker-compose logs localstack`
2. Restart LocalStack: `docker-compose restart localstack`
3. Clear LocalStack data: `rm -rf /tmp/localstack`

### API Connection Issues
1. Check API logs: `docker-compose logs api-dev`
2. Verify LocalStack and DynamoDB are running
3. Check network connectivity between containers

### Web App Issues
1. Check web logs: `docker-compose logs web-dev`
2. Verify API is accessible at http://localhost:3001
3. Check CORS configuration

## 📚 Additional Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
