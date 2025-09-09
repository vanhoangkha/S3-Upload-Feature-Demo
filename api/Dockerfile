FROM public.ecr.aws/lambda/nodejs:20

# Copy package files
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN npm ci --only=production

# Copy built source code
COPY dist/ ${LAMBDA_TASK_ROOT}/

# Create handler files for each function
RUN echo 'const { handler } = require("./handlers/createDocument"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/createDocument.js
RUN echo 'const { handler } = require("./handlers/getDocument"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/getDocument.js
RUN echo 'const { handler } = require("./handlers/listDocuments"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/listDocuments.js
RUN echo 'const { handler } = require("./handlers/updateDocument"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/updateDocument.js
RUN echo 'const { handler } = require("./handlers/deleteDocument"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/deleteDocument.js
RUN echo 'const { handler } = require("./handlers/restoreDocument"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/restoreDocument.js
RUN echo 'const { handler } = require("./handlers/listVersions"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/listVersions.js
RUN echo 'const { handler } = require("./handlers/presignUpload"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/presignUpload.js
RUN echo 'const { handler } = require("./handlers/presignDownload"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/presignDownload.js
RUN echo 'const { handler } = require("./handlers/whoAmI"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/whoAmI.js
RUN echo 'const { handler } = require("./handlers/adminListUsers"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/adminListUsers.js
RUN echo 'const { handler } = require("./handlers/adminCreateUser"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/adminCreateUser.js
RUN echo 'const { handler } = require("./handlers/adminUpdateRoles"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/adminUpdateRoles.js
RUN echo 'const { handler } = require("./handlers/adminSignOut"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/adminSignOut.js
RUN echo 'const { handler } = require("./handlers/adminAudits"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/adminAudits.js
RUN echo 'const { handler } = require("./handlers/preTokenGeneration"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/preTokenGeneration.js
RUN echo 'const { handler } = require("./handlers/getUserDocuments"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/getUserDocuments.js
RUN echo 'const { handler } = require("./handlers/getUserProfile"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/getUserProfile.js
RUN echo 'const { handler } = require("./handlers/updateUserProfile"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/updateUserProfile.js
RUN echo 'const { handler } = require("./handlers/getVendorDocuments"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/getVendorDocuments.js
RUN echo 'const { handler } = require("./handlers/getVendorUsers"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/getVendorUsers.js
RUN echo 'const { handler } = require("./handlers/getVendorStats"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/getVendorStats.js
RUN echo 'const { handler } = require("./handlers/auth"); module.exports = { handler };' > ${LAMBDA_TASK_ROOT}/auth.js

# Default handler (will be overridden by Lambda function configuration)
CMD [ "createDocument.handler" ]
