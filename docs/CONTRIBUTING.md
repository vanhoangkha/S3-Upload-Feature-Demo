# Contributing to DMS

## Development Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- AWS CLI
- Terraform >= 1.6

### Local Development

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd S3-Upload-Feature-Demo
   ./scripts/setup-local.sh
   ```

2. **Start development servers**
   ```bash
   # Option 1: Using Docker Compose
   docker-compose up api-dev web-dev
   
   # Option 2: Native development
   cd api && npm install && npm run dev
   cd web && npm install && npm run dev
   ```

3. **Access applications**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - DynamoDB Admin: http://localhost:8000
   - LocalStack: http://localhost:4566

## Code Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write JSDoc comments for public APIs

### React Components

- Use functional components with hooks
- Follow Cloudscape Design System patterns
- Implement proper error boundaries
- Use React Query for server state

### API Development

- Follow RESTful conventions
- Implement proper error handling
- Use structured logging
- Write comprehensive tests

## Testing

### Running Tests

```bash
# API tests
cd api && npm test

# Web tests  
cd web && npm test

# All tests
make test
```

### Test Requirements

- Unit tests for all business logic
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

## Security Guidelines

### Code Security

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate all inputs
- Implement proper error handling
- Follow OWASP security guidelines

### Dependencies

- Regularly update dependencies
- Run security audits: `npm audit`
- Use Snyk for vulnerability scanning
- Review dependency licenses

## Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Production fixes

### Commit Messages

Follow conventional commits:

```
type(scope): description

feat(api): add document versioning
fix(web): resolve upload progress issue
docs(readme): update deployment guide
```

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

## Documentation

### Required Documentation

- API changes: Update OpenAPI spec
- New features: Update README
- Architecture changes: Update docs/architecture/
- Security changes: Update docs/security/

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update diagrams when needed
- Maintain changelog

## Deployment

### Environment Promotion

```
develop → dev → staging → production
```

### Deployment Checklist

- [ ] Tests passing
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Rollback plan prepared

## Performance Guidelines

### API Performance

- Keep Lambda cold starts under 1s
- Optimize DynamoDB queries
- Use appropriate caching
- Monitor response times

### Frontend Performance

- Implement code splitting
- Optimize bundle size
- Use lazy loading
- Monitor Core Web Vitals

## Monitoring and Debugging

### Logging

- Use structured JSON logging
- Include correlation IDs
- Log at appropriate levels
- Avoid logging sensitive data

### Debugging

- Use CloudWatch for production logs
- Local debugging with VS Code
- Performance profiling tools
- Error tracking with proper context

## Release Process

### Version Management

- Follow semantic versioning
- Tag releases in Git
- Maintain changelog
- Document breaking changes

### Release Checklist

- [ ] Version bumped
- [ ] Changelog updated
- [ ] Tests passing
- [ ] Security review complete
- [ ] Documentation current
- [ ] Deployment tested
- [ ] Rollback verified

## Getting Help

### Resources

- Architecture docs: `docs/architecture/`
- API docs: `docs/api/`
- Security guide: `docs/security/`
- Deployment guide: `docs/deployment/`

### Support Channels

- GitHub Issues: Bug reports and feature requests
- Team Chat: Development questions
- Code Reviews: Technical discussions

## Code Review Guidelines

### What to Review

- Code correctness and logic
- Security implications
- Performance impact
- Test coverage
- Documentation updates

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are comprehensive
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Documentation updated
- [ ] Breaking changes noted

## Common Issues

### Local Development

**DynamoDB connection issues**
```bash
# Restart DynamoDB Local
docker-compose restart dynamodb-local
```

**Port conflicts**
```bash
# Check port usage
lsof -i :3000
lsof -i :3001
```

**AWS credentials**
```bash
# Configure local AWS credentials
aws configure
# Or use environment variables
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```

### Build Issues

**Node.js version mismatch**
```bash
# Use Node Version Manager
nvm use 20
```

**Dependency conflicts**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```
