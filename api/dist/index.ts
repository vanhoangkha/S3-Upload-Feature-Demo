// Main entry point for Lambda functions
// Each function will have its own handler file created by Dockerfile

export { handler as createDocument } from './handlers/createDocument';
export { handler as getDocument } from './handlers/getDocument';
export { handler as listDocuments } from './handlers/listDocuments';
export { handler as updateDocument } from './handlers/updateDocument';
export { handler as deleteDocument } from './handlers/deleteDocument';
export { handler as restoreDocument } from './handlers/restoreDocument';
export { handler as listVersions } from './handlers/listVersions';
export { handler as presignUpload } from './handlers/presignUpload';
export { handler as presignDownload } from './handlers/presignDownload';
export { handler as whoAmI } from './handlers/whoAmI';
export { handler as adminListUsers } from './handlers/adminListUsers';
export { handler as adminCreateUser } from './handlers/adminCreateUser';
export { handler as adminUpdateRoles } from './handlers/adminUpdateRoles';
export { handler as adminSignOut } from './handlers/adminSignOut';
export { handler as adminAudits } from './handlers/adminAudits';
export { handler as preTokenGeneration } from './handlers/preTokenGeneration';
