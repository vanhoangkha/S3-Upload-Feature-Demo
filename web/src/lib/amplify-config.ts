import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_GcPiggAiS',
      userPoolClientId: '5kpfm8nfp48dkinpphvlhm6fqv',
      loginWith: {
        oauth: {
          domain: 'dms-dev-9jnusleq.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [`${window.location.origin}/auth/callback`],
          redirectSignOut: [window.location.origin],
          responseType: 'code'
        }
      }
    }
  }
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
