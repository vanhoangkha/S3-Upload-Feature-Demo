export interface Document {
  document_id: string;
  name: string;
  mime: string;
  size: number;
  checksum: string;
  s3_key: string;
  version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  owner_user_id: string;
  vendor_id: string;
}

export interface UserInfo {
  userId: string;
  vendorId: string;
  roles: string[];
}

export interface User {
  sub?: string;
  username: string;
  email?: string;
  vendor_id?: string;
  roles: string[];
  groups?: string[];
  status?: string;
  enabled?: boolean;
}

export interface AuditRecord {
  timestamp: string;
  actor: {
    userId: string;
    vendorId: string;
    roles: string[];
  };
  action: string;
  resource: {
    type: string;
    id: string;
  };
  result: 'success' | 'error';
  details?: any;
}
