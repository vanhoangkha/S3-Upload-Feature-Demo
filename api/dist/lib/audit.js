"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const dynamodb_1 = require("./dynamodb");
const auditLog = async (entry) => {
    const timestamp = new Date().toISOString();
    const record = {
        pk: `AUDIT#${timestamp}`,
        sk: `USER#${entry.actor.userId}#ACTION#${entry.action}`,
        timestamp,
        actor: {
            userId: entry.actor.userId,
            vendorId: entry.actor.vendorId,
            roles: entry.actor.roles
        },
        action: entry.action,
        resource: entry.resource,
        result: entry.result,
        details: entry.details
    };
    await (0, dynamodb_1.putAuditRecord)(record);
};
exports.auditLog = auditLog;
