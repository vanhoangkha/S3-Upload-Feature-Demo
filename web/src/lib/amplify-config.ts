import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_GcPiggAiS',
      userPoolClientId: '5kpfm8nfp48dkinpphvlhm6fqv',
      region: 'us-east-1',
      loginWith: {
        oauth: {
          domain: 'https://dms-dev-9jnusleq.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['https://d1ljyycpkoybvj.cloudfront.net/auth/callback'],
          redirectSignOut: ['https://d1ljyycpkoybvj.cloudfront.net'],
          responseType: 'code'
        },
        email: true,
        username: true
      }
    }
  }
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
