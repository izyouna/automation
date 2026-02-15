/**
 * Stateless Server Implementation
 * Demonstrates stateless HTTP server behavior - no memory between requests
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { defaultLogger } = require('./shared/logger');
const HttpHelpers = require('./shared/http-helpers');
const { mockData } = require('./shared/mock-data');

class StatelessServer {
    constructor(config = {}) {
        this.config = config;
        this.app = express();
        this.requestCount = 0;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Setup middleware for the stateless server
     */
    setupMiddleware() {
        // Security headers
        this.app.use(helmet());

        // CORS configuration
        this.app.use(cors({
            origin: this.config.corsOrigin || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Client-ID']
        }));

        // JSON body parsing
        this.app.use(express.json({
            limit: this.config.maxRequestSize || '1mb'
        }));

        // URL-encoded body parsing
        this.app.use(express.urlencoded({
            extended: true,
            limit: this.config.maxRequestSize || '1mb'
        }));

        // Request logging middleware
        this.app.use((req, res, next) => {
            const requestTimer = HttpHelpers.startRequestTimer();
            const requestId = HttpHelpers.generateRequestId();

            // Add request ID to request object
            req.requestId = requestId;
            req.startTime = Date.now();

            // Log request start
            defaultLogger.info(`Request started: ${req.method} ${req.url}`, {
                requestId,
                clientId: req.headers['client-id'] || 'anonymous'
            });

            // Override res.end to log completion
            const originalEnd = res.end;
            res.end = (...args) => {
                const responseTime = requestTimer.getElapsedMs();
                defaultLogger.logRequest(req, res, responseTime);
                originalEnd.apply(res, args);
            };

            next();
        });
    }

    /**
     * Setup stateless routes
     */
    setupRoutes() {
        // ========== HEALTH CHECK ==========
        this.app.get('/health', (req, res) => {
            const healthInfo = HttpHelpers.healthCheckResponse('Stateless Server', {
                requestCount: mockData.getRequestCount(),
                serverType: 'stateless',
                note: 'I have no memory of previous requests'
            });

            return HttpHelpers.successResponse(res, healthInfo, 'Stateless server is healthy');
        });

        // ========== BASIC INFO ENDPOINT ==========
        this.app.get('/info', (req, res) => {
            const requestCount = mockData.incrementRequestCount();
            const clientId = req.headers['client-id'] || 'anonymous';

            const responseData = {
                server: 'Stateless Mock Server v1.0',
                timestamp: new Date().toISOString(),
                requestCount,
                clientId,
                randomValue: Math.random(),
                message: "I have no memory of previous requests. Each request is independent.",
                note: "This is a stateless server - I don't remember you from previous requests."
            };

            return HttpHelpers.successResponse(res, responseData, 'Stateless server information');
        });

        // ========== CALCULATION ENDPOINT ==========
        this.app.post('/calculate', HttpHelpers.asyncHandler(async (req, res) => {
            // Validate request
            const validation = HttpHelpers.validateRequestBody(req, ['operation', 'values']);
            if (!validation.isValid) {
                return HttpHelpers.validationError(res, validation.errors);
            }

            const { operation, values, clientContext } = req.body;

            // Validate values array
            if (!Array.isArray(values) || values.length === 0) {
                return HttpHelpers.validationError(res, [{
                    field: 'values',
                    message: 'Values must be a non-empty array'
                }]);
            }

            // Validate all values are numbers
            if (!values.every(val => typeof val === 'number')) {
                return HttpHelpers.validationError(res, [{
                    field: 'values',
                    message: 'All values must be numbers'
                }]);
            }

            // Perform calculation
            try {
                const result = mockData.performCalculation(operation, values);

                const responseData = {
                    operation,
                    input: values,
                    result,
                    processedAt: new Date().toISOString(),
                    clientContext: clientContext || null,
                    note: "Calculation complete. I won't remember this next time."
                };

                return HttpHelpers.successResponse(res, responseData, 'Calculation successful');
            } catch (error) {
                return HttpHelpers.errorResponse(res, error.message, 400);
            }
        }));

        // ========== RANDOM DATA GENERATION ==========
        this.app.get('/random', (req, res) => {
            const count = Math.min(10, Math.max(1, parseInt(req.query.count) || 1));
            const type = req.query.type || 'number';

            // Validate type
            const validTypes = ['number', 'string', 'boolean'];
            if (!validTypes.includes(type)) {
                return HttpHelpers.validationError(res, [{
                    field: 'type',
                    message: `Type must be one of: ${validTypes.join(', ')}`
                }]);
            }

            const randomValues = mockData.generateRandomData(count, type);

            const responseData = {
                count,
                type,
                values: randomValues,
                generatedAt: new Date().toISOString(),
                note: "Random values are generated fresh each time with no memory of previous generations."
            };

            return HttpHelpers.successResponse(res, responseData, 'Random data generated');
        });

        // ========== USER DATA ENDPOINTS (Stateless version) ==========

        // Get all users - stateless version returns same data every time
        this.app.get('/users', (req, res) => {
            const users = mockData.getAllUsers();

            const responseData = {
                users,
                count: users.length,
                retrievedAt: new Date().toISOString(),
                note: "User data is retrieved fresh each time. No session or user-specific state is maintained."
            };

            return HttpHelpers.successResponse(res, responseData, 'Users retrieved');
        });

        // Get user by ID - requires ID in request
        this.app.get('/users/:id', (req, res) => {
            const user = mockData.getUserById(req.params.id);

            if (!user) {
                return HttpHelpers.notFound(res, 'User');
            }

            const responseData = {
                user,
                retrievedAt: new Date().toISOString(),
                note: "User data retrieved. No authentication or session required - all data is in the request."
            };

            return HttpHelpers.successResponse(res, responseData, 'User found');
        });

        // ========== PRODUCT DATA ENDPOINTS ==========

        // Get all products
        this.app.get('/products', (req, res) => {
            const products = mockData.getAllProducts();

            // Apply filters if provided
            let filteredProducts = products;
            if (req.query.category) {
                filteredProducts = products.filter(p => p.category === req.query.category);
            }
            if (req.query.minPrice) {
                const minPrice = parseFloat(req.query.minPrice);
                filteredProducts = filteredProducts.filter(p => p.price >= minPrice);
            }
            if (req.query.maxPrice) {
                const maxPrice = parseFloat(req.query.maxPrice);
                filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
            }

            const responseData = {
                products: filteredProducts,
                count: filteredProducts.length,
                filters: {
                    category: req.query.category || null,
                    minPrice: req.query.minPrice || null,
                    maxPrice: req.query.maxPrice || null
                },
                retrievedAt: new Date().toISOString(),
                note: "Product data filtered based on query parameters. No user-specific preferences applied."
            };

            return HttpHelpers.successResponse(res, responseData, 'Products retrieved');
        });

        // ========== DEMONSTRATION ENDPOINTS ==========

        // Endpoint to demonstrate stateless behavior
        this.app.get('/demonstrate/stateless', (req, res) => {
            const previousCount = mockData.getRequestCount();
            const currentCount = mockData.incrementRequestCount();

            const responseData = {
                demonstration: "Stateless Server Behavior",
                previousRequestCount: previousCount,
                currentRequestCount: currentCount,
                yourRequestNumber: currentCount,
                timestamp: new Date().toISOString(),
                clientIdentifier: req.headers['client-id'] || 'not-provided',
                explanation: [
                    "This server is STATELESS:",
                    "1. I don't remember your previous requests",
                    "2. The request count is server-wide, not per-client",
                    "3. Each request contains all necessary information",
                    "4. No sessions, no authentication state",
                    "5. Easily scalable - any instance can handle any request"
                ]
            };

            return HttpHelpers.successResponse(res, responseData, 'Stateless behavior demonstration');
        });

        // Compare with stateful behavior (conceptual)
        this.app.get('/compare/stateful', (req, res) => {
            const responseData = {
                comparison: "Stateless vs Stateful",
                statelessCharacteristics: [
                    "No memory between requests",
                    "Each request is independent",
                    "All data in request/response",
                    "Easily scalable horizontally",
                    "No session management needed",
                    "Examples: REST APIs (when designed stateless), CDN, load balancers"
                ],
                statefulCharacteristics: [
                    "Maintains client state",
                    "Requires session management",
                    "Client context preserved",
                    "Scaling requires sticky sessions or shared storage",
                    "Examples: Shopping carts, user sessions, real-time games"
                ],
                whenToUseStateless: [
                    "Public APIs",
                    "Microservices",
                    "CDN edge servers",
                    "When horizontal scaling is critical",
                    "When requests are independent"
                ],
                note: "This endpoint itself is stateless - it returns the same information to every request."
            };

            return HttpHelpers.successResponse(res, responseData, 'Architecture comparison');
        });
    }

    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            return HttpHelpers.notFound(res, 'Endpoint');
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            defaultLogger.error('Unhandled error', {
                error: err.message,
                stack: err.stack,
                requestId: req.requestId,
                url: req.url,
                method: req.method
            });

            return HttpHelpers.errorResponse(
                res,
                'Internal server error',
                500,
                process.env.NODE_ENV === 'development' ? err.message : undefined
            );
        });
    }

    /**
     * Start the stateless server
     */
    start(port = 3001) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, () => {
                defaultLogger.logServerStart('Stateless', port);
                resolve(this.server);
            });

            this.server.on('error', (error) => {
                defaultLogger.error('Failed to start stateless server', { error: error.message });
                reject(error);
            });
        });
    }

    /**
     * Stop the stateless server
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }

            this.server.close((error) => {
                if (error) {
                    defaultLogger.error('Error stopping stateless server', { error: error.message });
                    reject(error);
                } else {
                    defaultLogger.logServerStop('Stateless');
                    resolve();
                }
            });
        });
    }

    /**
     * Get Express app instance (for testing)
     */
    getApp() {
        return this.app;
    }
}

module.exports = StatelessServer;