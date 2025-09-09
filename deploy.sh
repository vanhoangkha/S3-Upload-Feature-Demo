#!/bin/bash

# 🚀 DMS AWS Deployment Script
set -e

ENV=${1:-dev}
REGION="us-east-1"

echo "🚀 Deploying DMS to AWS (Environment: $ENV)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    command -v aws >/dev/null 2>&1 || { print_error "AWS CLI not installed"; exit 1; }
    command -v terraform >/dev/null 2>&1 || { print_error "Terraform not installed"; exit 1; }
    command -v docker >/dev/null 2>&1 || { print_error "Docker not installed"; exit 1; }
    command -v node >/dev/null 2>&1 || { print_error "Node.js not installed"; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { print_error "AWS credentials not configured"; exit 1; }
    
    print_status "Prerequisites check passed"
}

# Deploy infrastructure
deploy_infrastructure() {
    echo "🏗️ Deploying infrastructure..."
    
    cd infra/envs/$ENV
    
    # Initialize if needed
    if [ ! -d ".terraform" ]; then
        terraform init
    fi
    
    # Apply infrastructure
    terraform apply -var="env=$ENV" -auto-approve
    
    print_status "Infrastructure deployed"
    cd ../../..
}

# Deploy API
deploy_api() {
    echo "🚀 Deploying API..."
    
    cd api
    
    # Install dependencies and build
    npm install
    npm run build
    
    # Get ECR repository URI
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/dms-$ENV-api"
    
    # Login to ECR
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
    
    # Build and push Docker image
    docker build -t dms-api .
    docker tag dms-api:latest $ECR_URI:latest
    docker push $ECR_URI:latest
    
    # Update Lambda functions
    FUNCTIONS=(
        "createDocument" "listDocuments" "getDocument" "updateDocument" "deleteDocument"
        "presignUpload" "presignDownload" "adminListUsers" "adminCreateUser" 
        "adminUpdateUserRoles" "adminAudits" "getMe"
    )
    
    for func in "${FUNCTIONS[@]}"; do
        aws lambda update-function-code \
            --function-name "dms-$ENV-$func" \
            --image-uri "$ECR_URI:latest" >/dev/null 2>&1 || print_warning "Failed to update $func"
    done
    
    print_status "API deployed"
    cd ..
}

# Deploy frontend
deploy_frontend() {
    echo "🌐 Deploying frontend..."
    
    cd web
    
    # Install dependencies and build
    npm install
    npm run build
    
    # Deploy to S3
    aws s3 sync dist/ s3://dms-$ENV-web --delete
    
    # Get CloudFront distribution ID and invalidate cache
    DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='dms-$ENV-web'].Id" --output text)
    if [ ! -z "$DIST_ID" ]; then
        aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" >/dev/null 2>&1
        print_status "CloudFront cache invalidated"
    fi
    
    print_status "Frontend deployed"
    cd ..
}

# Create admin user
create_admin_user() {
    echo "👑 Creating admin user..."
    
    USER_POOL_ID=$(aws cognito-idp list-user-pools --max-items 10 --query "UserPools[?Name=='dms-$ENV-user-pool'].Id" --output text)
    
    if [ ! -z "$USER_POOL_ID" ]; then
        # Create admin user (suppress if already exists)
        aws cognito-idp admin-create-user \
            --user-pool-id $USER_POOL_ID \
            --username admin@example.com \
            --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
            --temporary-password TempPass123! \
            --message-action SUPPRESS >/dev/null 2>&1 || print_warning "Admin user may already exist"
        
        # Add to Admin group
        aws cognito-idp admin-add-user-to-group \
            --user-pool-id $USER_POOL_ID \
            --username admin@example.com \
            --group-name Admin >/dev/null 2>&1 || print_warning "User may already be in Admin group"
        
        print_status "Admin user configured"
    else
        print_error "User pool not found"
    fi
}

# Get deployment info
get_deployment_info() {
    echo "📋 Deployment Information:"
    
    cd infra/envs/$ENV
    
    echo "🌐 Application URL:"
    terraform output -raw cloudfront_domain 2>/dev/null || echo "CloudFront domain not available"
    
    echo "🔗 API Gateway URL:"
    terraform output -raw api_gateway_url 2>/dev/null || echo "API Gateway URL not available"
    
    echo "👤 Admin Credentials:"
    echo "  Username: admin@example.com"
    echo "  Temporary Password: TempPass123!"
    echo "  (You'll be prompted to change on first login)"
    
    cd ../../..
}

# Main deployment flow
main() {
    echo "🚀 Starting DMS deployment to AWS..."
    echo "Environment: $ENV"
    echo "Region: $REGION"
    echo ""
    
    check_prerequisites
    
    # Setup Terraform backend if needed
    if [ "$ENV" = "dev" ]; then
        echo "🔧 Setting up Terraform backend..."
        make setup >/dev/null 2>&1 || print_warning "Backend setup may have failed"
    fi
    
    deploy_infrastructure
    deploy_api
    deploy_frontend
    create_admin_user
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo ""
    
    get_deployment_info
}

# Run main function
main "$@"
