const AuditLog = require('../models/AuditLog');

exports.logAction = (action, module) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;
        
        // Override send function to capture response
        res.send = async function(body) {
            res.send = originalSend;
            
            try {
                // Parse response body if it's a string
                const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
                
                // Check if action was successful
                const status = responseBody.status === 'success' ? 'success' : 'failure';
                
                // Create audit log
                await AuditLog.create({
                    user: req.user._id,
                    action,
                    module,
                    documentId: req.params.id || responseBody.data?.id,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    status,
                    errorMessage: status === 'failure' ? responseBody.message : undefined,
                    metadata: {
                        method: req.method,
                        url: req.originalUrl,
                        body: req.body,
                        params: req.params,
                        query: req.query
                    }
                });
            } catch (error) {
                console.error('Audit log error:', error);
            }
            
            return res.send(body);
        };
        
        next();
    };
};