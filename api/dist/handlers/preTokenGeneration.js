"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    try {
        const { sub: userId, email } = event.request.userAttributes;
        const vendorId = event.request.userAttributes['custom:vendor_id'] || '';
        event.response.claimsOverrideDetails = {
            claimsToAddOrOverride: {
                vendor_id: vendorId,
                email: email
            }
        };
        console.log(`Token generated for user ${userId} with vendor ${vendorId}`);
        return event;
    }
    catch (error) {
        console.error('Pre-token generation error:', error);
        return event;
    }
};
exports.handler = handler;
