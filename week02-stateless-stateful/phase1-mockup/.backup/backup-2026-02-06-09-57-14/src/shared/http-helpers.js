/**
 * HTTP utility functions for consistent request/response handling
 */

const { defaultLogger } = require('./logger');

class HttpHelpers {
    /**
     * Create a standardized success response
     */
    static successResponse(res, data = {}, message = 'Success', statusCode = 200) {
        const response = {
            status: 'success',
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Create a standardized error response
     */
    static errorResponse(res, message = 'An error occurred', statusCode = 500, errors = []) {
        const response = {
            status: 'error',
            message,
            errors: Array.isArray(errors) ? errors : [errors],
            timestamp: new Date().toISOString()
        };

        defaultLogger.error(`HTTP Error ${statusCode}: ${message}`, { errors });
        return res.status(statusCode).json(response);
    }

    /**
     * Create a validation error response
     */
    static validationError(res, errors) {
        return this.errorResponse(
            res,
            'Validation failed',
            400,
            errors
        );
    }

    /**
     * Create a not found response
     */
    static notFound(res, resource = 'Resource') {
        return this.errorResponse(
            res,
            `${resource} not found`,
            404
        );
    }

    /**
     * Create an unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized') {
        return this.errorResponse(
            res,
            message,
            401
        );
    }

    /**
     * Create a forbidden response
     */
    static forbidden(res, message = 'Forbidden') {
        return this.errorResponse(
            res,
            message,
            403
        );
    }

    /**
     * Validate request body against required fields
     */
    static validateRequestBody(req, requiredFields = []) {
        const missingFields = [];
        const errors = [];

        // Check for missing fields
        requiredFields.forEach(field => {
            if (req.body[field] === undefined || req.body[field] === null) {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            errors.push({
                field: 'body',
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate query parameters
     */
    static validateQueryParams(req, requiredParams = []) {
        const missingParams = [];
        const errors = [];

        requiredParams.forEach(param => {
            if (req.query[param] === undefined || req.query[param] === null) {
                missingParams.push(param);
            }
        });

        if (missingParams.length > 0) {
            errors.push({
                field: 'query',
                message: `Missing required query parameters: ${missingParams.join(', ')}`
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Extract pagination parameters from request
     */
    static getPaginationParams(req, defaults = { page: 1, limit: 10 }) {
        const page = Math.max(1, parseInt(req.query.page) || defaults.page);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaults.limit));
        const skip = (page - 1) * limit;

        return { page, limit, skip };
    }

    /**
     * Add pagination metadata to response
     */
    static addPaginationMetadata(data, total, paginationParams) {
        const { page, limit } = paginationParams;
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Generate a request ID for tracking
     */
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Measure request processing time
     */
    static startRequestTimer() {
        const startTime = process.hrtime();

        return {
            getElapsedMs: () => {
                const [seconds, nanoseconds] = process.hrtime(startTime);
                return (seconds * 1000) + (nanoseconds / 1000000);
            }
        };
    }

    /**
     * Set common security headers
     */
    static setSecurityHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    /**
     * Handle async route handlers with error catching
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Create health check response
     */
    static healthCheckResponse(serviceName, additionalInfo = {}) {
        return {
            status: 'healthy',
            service: serviceName,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            ...additionalInfo
        };
    }
}

module.exports = HttpHelpers;