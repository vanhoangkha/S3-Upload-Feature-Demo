const COGNITO_DOMAIN = 'https://dms-dev-trx3mj0d.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = '6du5l9nn54dpvgand5t86g8agb';
const REDIRECT_URI = window.location.origin + '/callback';

export interface User {
  userId: string;
  email: string;
  username: string;
  vendorId: string;
  groups: string[];
  permissions: string[];
  scope: string;
  documentAccess: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('dms_token');
    if (token) {
      try {
        // Validate token is not expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp > now) {
          this.token = token;
          this.user = this.parseToken(token);
          console.log('Loaded valid token from storage:', this.user);
        } else {
          console.log('Token expired, clearing storage');
          this.clearAuth();
        }
      } catch (error) {
        console.error('Invalid stored token:', error);
        this.clearAuth();
      }
    }
  }

  private parseToken(token: string): User {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Parsing JWT payload:', payload);
    
    // Extract groups from cognito:groups claim (StackOverflow pattern)
    const cognitoGroups = payload['cognito:groups'] || '';
    const groups = typeof cognitoGroups === 'string' 
      ? cognitoGroups.split(',').map(g => g.trim()).filter(Boolean)
      : Array.isArray(cognitoGroups) ? cognitoGroups : [];

    // Extract custom claims for fine-grained permissions
    const permissions = payload['custom:permissions']?.split(',') || [];
    const scope = payload['custom:scope'] || 'none';
    const documentAccess = payload['custom:document_access'] || 'none';

    console.log('Extracted user data:', { groups, permissions, scope, documentAccess });

    return {
      userId: payload.sub,
      email: payload.email || '',
      username: payload['cognito:username'] || payload.email?.split('@')[0] || 'user',
      vendorId: payload.vendor_id || payload['custom:vendor_id'] || '',
      groups,
      permissions,
      scope,
      documentAccess
    };
  }

  // Redirect to Cognito Hosted UI
  login() {
    console.log('Initiating login flow');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'openid email profile'
    });
    
    const loginUrl = `${COGNITO_DOMAIN}/oauth2/authorize?${params}`;
    console.log('Redirecting to:', loginUrl);
    window.location.href = loginUrl;
  }

  // Handle OAuth callback
  async handleCallback(code: string): Promise<void> {
    console.log('Handling OAuth callback with code:', code.substring(0, 10) + '...');
    
    try {
      const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokens = await response.json();
      console.log('Received tokens:', { 
        id_token: tokens.id_token ? 'present' : 'missing',
        access_token: tokens.access_token ? 'present' : 'missing' 
      });
      
      this.setToken(tokens.id_token);
      console.log('Authentication successful');
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    }
  }

  private setToken(token: string) {
    console.log('Setting new token');
    this.token = token;
    this.user = this.parseToken(token);
    localStorage.setItem('dms_token', token);
    console.log('Token set successfully, user:', this.user);
  }

  logout() {
    console.log('Logging out');
    this.clearAuth();
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      logout_uri: window.location.origin
    });
    window.location.href = `${COGNITO_DOMAIN}/logout?${params}`;
  }

  private clearAuth() {
    console.log('Clearing authentication');
    this.token = null;
    this.user = null;
    localStorage.removeItem('dms_token');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    const authenticated = !!this.token && !!this.user;
    console.log('Authentication check:', authenticated, { 
      hasToken: !!this.token, 
      hasUser: !!this.user 
    });
    return authenticated;
  }

  hasRole(role: string): boolean {
    return this.user?.groups.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    return this.user?.permissions.includes(permission) || false;
  }
}

export const authService = new AuthService();
