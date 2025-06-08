// AWS Amplify Configuration
// This file will be updated with actual values after infrastructure deployment

const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_identity_pool_id": "", // Identity pool not used for this app
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_AgJBt2IMm", // From deployed infrastructure
  "aws_user_pools_web_client_id": "1tjimuifl8ssq5cflm77lab31s", // From deployed infrastructure
  "aws_cognito_username_attributes": ["email"],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": ["email"],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": ["SMS"],
  "aws_cognito_password_protection_settings": {
    "passwordPolicyMinLength": 8,
    "passwordPolicyCharacters": [
      "REQUIRES_LOWERCASE",
      "REQUIRES_UPPERCASE",
      "REQUIRES_NUMBERS"
    ]
  },
  "aws_cognito_verification_mechanisms": ["EMAIL"],
  "oauth": {},
  "aws_user_files_s3_bucket": "vibdmswebstore2026", // From deployed infrastructure
  "aws_user_files_s3_bucket_region": "us-east-1"
};

export default awsmobile;
