// Real authentication service
export class AuthService {
  private static cognitoConfig = {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    domain: import.meta.env.VITE_COGNITO_DOMAIN,
  };

  static getHostedUIUrl(type: 'login' | 'signup'): string {
    const { domain, clientId } = this.cognitoConfig;
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    
    if (type === 'signup') {
      return `${domain}/signup?client_id=${clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
    }
    
    return `${domain}/login?client_id=${clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
  }

  static async handleOAuthCallback(code: string): Promise<{ accessToken: string; idToken: string }> {
    const { domain, clientId } = this.cognitoConfig;
    const redirectUri = `${window.location.origin}/auth/callback`;

    const response = await fetch(`${domain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
    };
  }

  static async signIn(username: string, password: string): Promise<{ accessToken: string; idToken: string }> {
    try {
      // Use our API endpoint for authentication
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1'}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();
      
      if (data.accessToken && data.idToken) {
        return {
          accessToken: data.accessToken,
          idToken: data.idToken
        };
      } else {
        throw new Error('Authentication failed - no tokens received');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    }
  }

  static async signOut(): Promise<void> {
    const { domain, clientId } = this.cognitoConfig;
    const logoutUri = encodeURIComponent(`${window.location.origin}/auth/login`);
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to Cognito logout
    window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
  }

  static getStoredTokens(): { accessToken?: string; idToken?: string } {
    return {
      accessToken: localStorage.getItem('accessToken') || undefined,
      idToken: localStorage.getItem('idToken') || undefined,
    };
  }

  static storeTokens(accessToken: string, idToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('idToken', idToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  static parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }
}
