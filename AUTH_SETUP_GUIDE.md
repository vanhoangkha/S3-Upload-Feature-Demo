# Authentication Setup Guide

This guide will help you set up authentication properly for the S3 Upload Feature Demo.

## Step 1: Create IAM Roles

First, create the required IAM roles for the Identity Pool:

1. Create authenticated role:
```bash
aws iam create-role \
    --role-name s3-upload-auth-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "cognito-identity.amazonaws.com:aud": "<YOUR_IDENTITY_POOL_ID>"
                }
            }
        }]
    }'
```

2. Create unauthenticated role:
```bash
aws iam create-role \
    --role-name s3-upload-unauth-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "cognito-identity.amazonaws.com:aud": "<YOUR_IDENTITY_POOL_ID>"
                }
            }
        }]
    }'
```

3. Attach policies to authenticated role:
```bash
aws iam attach-role-policy \
    --role-name s3-upload-auth-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

aws iam attach-role-policy \
    --role-name s3-upload-auth-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser
```

4. Attach policies to unauthenticated role:
```bash
aws iam attach-role-policy \
    --role-name s3-upload-unauth-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

## Step 2: Configure Amplify Auth

1. Remove existing auth configuration:
```bash
cd s3-upload-ui
amplify remove auth
```

2. Add new auth configuration:
```bash
amplify add auth
```

When prompted, use these exact selections:
```
? Do you want to use the default authentication and security configuration? 
❯ Default configuration with Social Provider (Federation) 

? How do you want users to be able to sign in? 
❯ Username 

? Do you want to configure advanced settings? 
❯ Yes, I want to make some additional changes 

? What attributes are required for signing up? 
❯ Email 

? Do you want to enable any of the following capabilities? 
❯ Add User Pool sign-in options
❯ Add Social sign-in options (Social providers)
❯ Add User Pool Groups
❯ Add admin queries API

? What domain name prefix do you want to use? 
❯ s3-upload-demo

? Enter your redirect signin URI: 
❯ http://localhost:3000/

? Do you want to add another redirect signin URI? 
❯ No

? Enter your redirect signout URI: 
❯ http://localhost:3000/

? Do you want to add another redirect signout URI? 
❯ No

? Select the authentication/authorization scopes to enable: 
❯ email
❯ openid
❯ profile

? Select the OAuth flows enabled for this project: 
❯ Authorization code grant

? Select the OAuth2 token revocation behavior: 
❯ Revoke refresh token and access token

? Select the social providers you want to configure for your user pool: 
❯ None
```

3. Update the auth configuration in `amplify/backend/auth/fcjserverlessdms69a051f5/parameters.json`:
```json
{
    "authRoleArn": {
        "Fn::GetAtt": ["AuthRole", "Arn"]
    },
    "unauthRoleArn": {
        "Fn::GetAtt": ["UnauthRole", "Arn"]
    },
    "authRoleName": {
        "Ref": "AuthRole"
    },
    "unauthRoleName": {
        "Ref": "UnauthRole"
    },
    "userPoolName": "s3uploaddemouserpool",
    "autoVerifiedAttributes": ["email"],
    "mfaConfiguration": "OFF",
    "mfaTypes": ["SMS"],
    "smsAuthenticationMessage": "Your authentication code is {####}",
    "smsVerificationMessage": "Your verification code is {####}",
    "emailVerificationMessage": "Your verification code is {####}",
    "emailVerificationSubject": "Your verification code",
    "defaultPasswordPolicy": true,
    "passwordPolicyMinLength": 8,
    "passwordPolicyCharacters": ["REQUIRES_LOWERCASE", "REQUIRES_UPPERCASE", "REQUIRES_NUMBERS", "REQUIRES_SYMBOLS"],
    "requiredAttributes": ["email"],
    "userpoolClientGenerateSecret": false,
    "userpoolClientRefreshTokenValidity": 30,
    "userpoolClientWriteAttributes": ["email"],
    "userpoolClientReadAttributes": ["email"],
    "userpoolClientLambdaRole": "s3uploaddemouserpool_userpoolclient_lambda_role",
    "userpoolClientSetAttributes": false,
    "sharedId": "s3uploaddemo",
    "resourceName": "s3uploaddemouserpool",
    "authSelections": "identityPoolAndUserPool",
    "useDefault": "default",
    "usernameAttributes": ["email"],
    "userPoolGroupList": ["admin", "vendor"],
    "serviceName": "Cognito",
    "usernameCaseSensitive": false,
    "useEnabledMfas": true,
    "breakCircularDependency": true,
    "dependsOn": [],
    "allowUnauthenticatedIdentities": false
}
```

4. Push the changes:
```bash
amplify push
```

## Step 3: Update Environment Variables

Update your `.env` file with the new values:

```
REACT_APP_USER_POOL_ID=<new-user-pool-id>
REACT_APP_USER_POOL_WEB_CLIENT_ID=<new-client-id>
REACT_APP_IDENTITY_POOL_ID=<new-identity-pool-id>
```

## Step 4: Test Authentication

1. Start the development server:
```bash
npm start
```

2. Test the following flows:
   - User registration
   - User login
   - Access to protected routes
   - S3 bucket access

## Troubleshooting

### Common Issues

1. Role Not Found
```bash
# Verify role exists
aws iam get-role --role-name s3-upload-auth-role
aws iam get-role --role-name s3-upload-unauth-role
```

2. Permission Issues
```bash
# Check role policies
aws iam list-attached-role-policies --role-name s3-upload-auth-role
aws iam list-attached-role-policies --role-name s3-upload-unauth-role
```

3. Identity Pool Issues
```bash
# Get Identity Pool details
aws cognito-identity describe-identity-pool --identity-pool-id <YOUR_IDENTITY_POOL_ID>
```

### Getting Help

- Check CloudWatch Logs for detailed error messages
- Review IAM role policies
- Verify Cognito User Pool settings
- Check Identity Pool configuration

## Security Notes

- Use least privilege principle for IAM roles
- Regularly review and update policies
- Monitor CloudTrail for authentication events
- Enable MFA for admin users
- Use secure password policies 