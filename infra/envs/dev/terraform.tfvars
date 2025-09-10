# Environment Configuration
region   = "us-east-1"
app_name = "dms"
env      = "dev"

# Logging
log_level = "INFO"

# Cognito Configuration
cognito_callback_urls = [
  "https://d29ewm56ohyich.cloudfront.net/auth/callback",
  "http://localhost:3000/auth/callback"
]

cognito_logout_urls = [
  "https://d29ewm56ohyich.cloudfront.net/auth/login",
  "http://localhost:3000/auth/login"
]
