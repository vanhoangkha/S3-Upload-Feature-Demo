# Contributing to Document Management System (DMS)

Thank you for your interest in contributing to DMS! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **AWS CLI** configured with appropriate permissions
- **Terraform** >= 1.6
- **Docker** and Docker Compose
- **Git** for version control

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/S3-Upload-Feature-Demo.git
   cd S3-Upload-Feature-Demo
   ```

2. **Install Dependencies**
   ```bash
   # API dependencies
   cd api && npm install && cd ..
   
   # Web dependencies
   cd web && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment templates
   cp web/.env.example web/.env.local
   cp infra/envs/dev/terraform.tfvars.example infra/envs/dev/terraform.tfvars
   ```

4. **Local Development**
   ```bash
   # Start local development environment
   make dev-up
   
   # Or start components individually
   make dev-api    # Start API server
   make dev-web    # Start web server
   ```

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use strict TypeScript configuration
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code formatting is enforced
- **Naming**: Use descriptive names for variables and functions

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(api): add document versioning support
fix(web): resolve authentication token refresh issue
docs: update deployment guide for new regions
test(api): add unit tests for RBAC middleware
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🧪 Testing

### Running Tests

```bash
# Run all tests
make test

# Run API tests only
make api-test

# Run web tests only
make web-test

# Run with coverage
npm run test:coverage
```

### Writing Tests

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and workflows
- **E2E Tests**: Test complete user workflows

**Test Structure:**
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Test implementation
  });

  afterEach(() => {
    // Cleanup
  });
});
```

## 🏗️ Architecture Guidelines

### Backend (API)

- **Lambda Functions**: One function per endpoint
- **TypeScript**: Strict typing for all code
- **Error Handling**: Consistent error responses
- **Logging**: Structured logging with context
- **Security**: RBAC middleware on all protected endpoints

### Frontend (Web)

- **React**: Functional components with hooks
- **Cloudscape**: Use AWS Cloudscape Design System
- **TypeScript**: Strict typing for props and state
- **Context**: Use React Context for global state
- **RBAC**: Permission-based UI rendering

### Infrastructure

- **Terraform**: Modular infrastructure as code
- **AWS Services**: Serverless-first architecture
- **Security**: Least-privilege IAM policies
- **Monitoring**: CloudWatch logs and metrics

## 🔒 Security Guidelines

### Code Security

- **No Hardcoded Secrets**: Use environment variables
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Prevention**: Sanitize user content
- **CSRF Protection**: Implement CSRF tokens

### Infrastructure Security

- **IAM Policies**: Least-privilege access
- **Encryption**: KMS encryption for data at rest
- **TLS**: HTTPS only for all communications
- **VPC**: Network isolation where appropriate

## 📝 Documentation

### Code Documentation

- **JSDoc**: Document all public functions
- **README**: Update relevant README files
- **API Docs**: Update OpenAPI specifications
- **Architecture**: Document significant changes

### Examples

```typescript
/**
 * Creates a new document with metadata
 * @param request - Document creation request
 * @param context - Authentication context
 * @returns Promise<Document> - Created document
 * @throws {ValidationError} - When request is invalid
 * @throws {UnauthorizedError} - When user lacks permissions
 */
export async function createDocument(
  request: CreateDocumentRequest,
  context: AuthContext
): Promise<Document> {
  // Implementation
}
```

## 🚀 Pull Request Process

### Before Submitting

1. **Test Locally**: Ensure all tests pass
2. **Lint Code**: Fix all linting issues
3. **Update Docs**: Update relevant documentation
4. **Security Check**: Run security scans

### PR Requirements

- **Description**: Clear description of changes
- **Testing**: Evidence of testing performed
- **Breaking Changes**: Document any breaking changes
- **Screenshots**: For UI changes, include screenshots

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## 🐛 Bug Reports

### Before Reporting

1. **Search Issues**: Check if bug already reported
2. **Reproduce**: Ensure bug is reproducible
3. **Environment**: Note your environment details

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 95]
- Node.js: [e.g. 18.17.0]
- AWS Region: [e.g. us-east-1]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Any other context or screenshots
```

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check the [docs/](./docs/) directory
- **Examples**: See example implementations in the codebase

## 🏆 Recognition

Contributors will be recognized in:
- **README**: Contributors section
- **Release Notes**: Major contributions highlighted
- **GitHub**: Contributor badges and stats

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DMS! 🚀
