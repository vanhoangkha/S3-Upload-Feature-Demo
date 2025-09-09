import { requireAuth, assertAccess } from '../src/lib/auth';
import { UnauthorizedError, ForbiddenError } from '../src/lib/errors';

describe('Auth Library', () => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: 'user-123',
            'custom:vendor_id': 'vendor-abc',
            'cognito:groups': ['User'],
            aud: 'client-id',
            iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX',
            exp: Math.floor(Date.now() / 1000) + 3600
          }
        }
      }
    }
  } as any;

  describe('requireAuth', () => {
    it('should extract auth context from valid JWT claims', () => {
      const auth = requireAuth(mockEvent);
      
      expect(auth.userId).toBe('user-123');
      expect(auth.vendorId).toBe('vendor-abc');
      expect(auth.roles).toEqual(['User']);
    });

    it('should throw UnauthorizedError when claims are missing', () => {
      const eventWithoutClaims = {
        requestContext: {}
      } as any;

      expect(() => requireAuth(eventWithoutClaims)).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when vendor_id is missing', () => {
      const eventWithoutVendorId = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user-123',
                'cognito:groups': ['User']
              }
            }
          }
        }
      } as any;

      expect(() => requireAuth(eventWithoutVendorId)).toThrow(UnauthorizedError);
    });
  });

  describe('assertAccess', () => {
    const userAuth = {
      userId: 'user-123',
      vendorId: 'vendor-abc',
      roles: ['User'],
      claims: {} as any
    };

    const vendorAuth = {
      userId: 'vendor-456',
      vendorId: 'vendor-abc',
      roles: ['Vendor'],
      claims: {} as any
    };

    const adminAuth = {
      userId: 'admin-789',
      vendorId: 'vendor-xyz',
      roles: ['Admin'],
      claims: {} as any
    };

    it('should allow Admin access to any resource', () => {
      expect(() => assertAccess(adminAuth, { 
        vendorId: 'different-vendor', 
        userId: 'different-user' 
      })).not.toThrow();
    });

    it('should allow User access to own resources in same vendor', () => {
      expect(() => assertAccess(userAuth, { 
        vendorId: 'vendor-abc', 
        userId: 'user-123' 
      })).not.toThrow();
    });

    it('should deny User access to other users resources', () => {
      expect(() => assertAccess(userAuth, { 
        vendorId: 'vendor-abc', 
        userId: 'other-user' 
      })).toThrow(ForbiddenError);
    });

    it('should deny User access to different vendor', () => {
      expect(() => assertAccess(userAuth, { 
        vendorId: 'different-vendor', 
        userId: 'user-123' 
      })).toThrow(ForbiddenError);
    });

    it('should allow Vendor access to any user in same vendor', () => {
      expect(() => assertAccess(vendorAuth, { 
        vendorId: 'vendor-abc', 
        userId: 'any-user' 
      })).not.toThrow();
    });

    it('should deny Vendor access to different vendor', () => {
      expect(() => assertAccess(vendorAuth, { 
        vendorId: 'different-vendor', 
        userId: 'any-user' 
      })).toThrow(ForbiddenError);
    });
  });
});
