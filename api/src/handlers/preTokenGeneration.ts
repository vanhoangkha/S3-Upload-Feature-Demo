import { PreTokenGenerationTriggerEvent, PreTokenGenerationTriggerHandler } from 'aws-lambda';

export const handler: PreTokenGenerationTriggerHandler = async (event: PreTokenGenerationTriggerEvent) => {
  console.log('PreTokenGeneration triggered', JSON.stringify(event, null, 2));
  
  try {
    if (!event?.request?.userAttributes) {
      console.error('Invalid event structure - missing userAttributes');
      return event;
    }
    
    const { sub: userId, email } = event.request.userAttributes;
    const vendorId = event.request.userAttributes['custom:vendor_id'] || '';
    
    // Get user's groups from the event or external provider
    let userGroups = event.request.groupConfiguration?.groupsToOverride || [];
    
    // Handle external identity provider users
    const identities = event.request.userAttributes['identities'];
    if (identities) {
      const externalRole = event.request.userAttributes['custom:role'] || event.request.userAttributes['role'];
      if (externalRole) {
        userGroups = mapExternalRole(externalRole);
      }
    }
    
    // Build claims for API Gateway Cognito authorizer
    event.response = {
      claimsOverrideDetails: {
        claimsToAddOrOverride: {
          // Standard claims
          vendor_id: vendorId,
          email: email || '',
          user_id: userId,
          
          // Groups claim for API Gateway authorization
          'cognito:groups': userGroups.join(','),
          
          // Custom claims for fine-grained permissions
          'custom:permissions': buildPermissions(userGroups, vendorId, userId).join(','),
          'custom:scope': getAccessScope(userGroups, vendorId, userId),
          
          // Resource access patterns
          'custom:document_access': getDocumentAccess(userGroups, vendorId, userId),
          'custom:user_access': getUserAccess(userGroups, vendorId),
          'custom:admin_access': getAdminAccess(userGroups)
        }
      }
    };
    
    console.log(`Token generated for user ${userId} with groups: ${userGroups.join(',')} and scope: ${getAccessScope(userGroups, vendorId, userId)}`);
    return event;
    
  } catch (error) {
    console.error('PreTokenGeneration error:', error);
    return event;
  }
};

function buildPermissions(groups: string[], vendorId: string, userId: string): string[] {
  const permissions: string[] = [];
  
  if (groups.includes('Admin')) {
    permissions.push('admin:*', 'read:*', 'write:*', 'delete:*');
  } else if (groups.includes('Vendor')) {
    permissions.push(`vendor:${vendorId}`, `read:vendor:${vendorId}`, `write:vendor:${vendorId}`);
  } else if (groups.includes('User')) {
    permissions.push(`user:${userId}`, `read:user:${userId}`, `write:user:${userId}`);
  }
  
  return permissions;
}

// External provider role mapping
function mapExternalRole(externalRole: string): string[] {
  const roleMapping: Record<string, string[]> = {
    'admin': ['Admin'],
    'administrator': ['Admin'],
    'vendor': ['Vendor'], 
    'supplier': ['Vendor'],
    'user': ['User'],
    'employee': ['User']
  };
  return roleMapping[externalRole?.toLowerCase()] || ['User'];
}

function getAccessScope(groups: string[], vendorId: string, userId: string): string {
  if (groups.includes('Admin')) return 'global';
  if (groups.includes('Vendor')) return `vendor:${vendorId}`;
  if (groups.includes('User')) return `user:${userId}`;
  return 'none';
}

function getDocumentAccess(groups: string[], vendorId: string, userId: string): string {
  if (groups.includes('Admin')) return 'all';
  if (groups.includes('Vendor')) return vendorId;
  if (groups.includes('User')) return userId;
  return 'none';
}

function getUserAccess(groups: string[], vendorId: string): string {
  if (groups.includes('Admin')) return 'all';
  if (groups.includes('Vendor')) return vendorId;
  return 'self';
}

function getAdminAccess(groups: string[]): string {
  return groups.includes('Admin') ? 'full' : 'none';
}
