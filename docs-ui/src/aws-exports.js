const awsmobile = {
  "aws_project_region": process.env.REACT_APP_AWS_REGION || "us-east-1",
  "aws_cognito_identity_pool_id": process.env.REACT_APP_IDENTITY_POOL_ID || "",
  "aws_cognito_region": process.env.REACT_APP_AWS_REGION || "us-east-1",
  "aws_user_pools_id": process.env.REACT_APP_USER_POOL_ID || "",
  "aws_user_pools_web_client_id": process.env.REACT_APP_USER_POOL_CLIENT_ID || "",
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
  "aws_user_files_s3_bucket": process.env.REACT_APP_S3_BUCKET || "",
  "aws_user_files_s3_bucket_region": process.env.REACT_APP_AWS_REGION || "us-east-1"
};

export default awsmobile;
