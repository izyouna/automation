/**
 * Stateful Server Implementation
 * Demonstrates stateful HTTP server behavior - maintains client state across requests
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { defaultLogger } = require('./shared/logger');
const HttpHelpers = require('./shared/http-helpers');
const { mockData } = require('./shared/mock-data');

class StatefulServer {
    constructor(config = {}) {
        this.config = config;
        this.app = express();

        // Session cleanup interval
        this.sessionCleanupInterval = setInterval(() => {
            const cleaned = mockData.cleanupExpiredSessions();
            if (cleaned > 0) {
                defaultLogger.debug(`Cleaned up ${cleaned} expired sessions`);
            }
        }, config.sessionCleanupInterval || 60000);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Setup middleware for the stateful server
     */
    setupMiddleware() {
        // Security headers
        this.app.use(helmet());

        // CORS configuration
        this.app.use(cors({
            origin: this.config.corsOrigin || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Session-ID', 'Client-ID'],
            credentials: true
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

        // Request logging middleware with session tracking
        this.app.use((req, res, next) => {
            const requestTimer = HttpHelpers.startRequestTimer();
            const requestId = HttpHelpers.generateRequestId();

            // Add request ID to request object
            req.requestId = requestId;
            req.startTime = Date.now();

            // Extract session ID from headers or cookies
            const sessionId = req.headers['session-id'] || req.cookies?.sessionId;
            if (sessionId) {
                req.sessionId = sessionId;
                req.session = mockData.getSession(sessionId);
            }

            // Log request start with session info
            defaultLogger.info(`Request started: ${req.method} ${req.url}`, {
                requestId,
                sessionId: sessionId || 'none',
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

        // Session validation middleware (for routes that require sessions)
        this.app.use('/api/stateful/session*', (req, res, next) => {
            if (!req.sessionId || !req.session) {
                return HttpHelpers.unauthorized(res, 'Valid session required');
            }
            next();
        });
    }

    /**
     * Setup stateful routes
     */
    setupRoutes() {
        // ========== HEALTH CHECK ==========
        this.app.get('/health', (req, res) => {
            const activeSessions = Array.from(mockData.sessions.values()).length;
            const activeCarts = Array.from(mockData.carts.values()).length;

            const healthInfo = HttpHelpers.healthCheckResponse('Stateful Server', {
                activeSessions,
                activeCarts,
                serverType: 'stateful',
                note: 'I maintain client state across requests'
            });

            return HttpHelpers.successResponse(res, healthInfo, 'Stateful server is healthy');
        });

        // ========== SESSION MANAGEMENT ==========

        // Create new session
        this.app.post('/session', HttpHelpers.asyncHandler(async (req, res) => {
            const validation = HttpHelpers.validateRequestBody(req, ['userId']);
            if (!validation.isValid) {
                return HttpHelpers.validationError(res, validation.errors);
            }

            const { userId, data = {} } = req.body;

            // Check if user exists
            const user = mockData.getUserById(userId);
            if (!user) {
                return HttpHelpers.notFound(res, 'User');
            }

            // Create session
            const session = mockData.createSession(userId, data);

            const responseData = {
                session: {
                    id: session.id,
                    userId: session.userId,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt
                },
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                note: "Session created. Include Session-ID header in subsequent requests to maintain state."
            };

            // Set session ID in response header
            res.setHeader('Session-ID', session.id);

            return HttpHelpers.successResponse(res, responseData, 'Session created successfully');
        }));

        // Get session info
        this.app.get('/session', (req, res) => {
            const session = req.session;

            const responseData = {
                session: {
                    id: session.id,
                    userId: session.userId,
                    createdAt: session.createdAt,
                    lastAccessed: session.lastAccessed,
                    expiresAt: session.expiresAt,
                    data: session.data
                },
                note: "Session retrieved. This server remembers your session across requests."
            };

            return HttpHelpers.successResponse(res, responseData, 'Session information');
        });

        // Update session data
        this.app.put('/session', HttpHelpers.asyncHandler(async (req, res) => {
            const { data } = req.body;

            if (!data || typeof data !== 'object') {
                return HttpHelpers.validationError(res, [{
                    field: 'data',
                    message: 'Data must be an object'
                }]);
            }

            const updatedSession = mockData.updateSession(req.sessionId, data);

            const responseData = {
                session: {
                    id: updatedSession.id,
                    data: updatedSession.data,
                    lastAccessed: updatedSession.lastAccessed
                },
                note: "Session updated. The server maintains this state for your future requests."
            };

            return HttpHelpers.successResponse(res, responseData, 'Session updated successfully');
        }));

        // Delete session (logout)
        this.app.delete('/session', (req, res) => {
            const sessionId = req.sessionId;
            const deleted = mockData.deleteSession(sessionId);

            // Also clear cart for this session
            mockData.carts.delete(sessionId);

            const responseData = {
                sessionId,
                deleted,
                note: "Session terminated. All server-side state for this session has been cleared."
            };

            return HttpHelpers.successResponse(res, responseData, 'Session terminated');
        });

        // ========== SHOPPING CART DEMONSTRATION (Classic stateful example) ==========

        // Get cart contents
        this.app.get('/cart', (req, res) => {
            const cart = mockData.getCart(req.sessionId);

            const responseData = {
                cart: {
                    sessionId: cart.sessionId,
                    items: cart.items,
                    total: cart.total,
                    itemCount: cart.items.length,
                    createdAt: cart.createdAt,
                    updatedAt: cart.updatedAt
                },
                note: "Shopping cart retrieved. This is a stateful feature - the server remembers your cart across requests."
            };

            return HttpHelpers.successResponse(res, responseData, 'Cart retrieved');
        });

        // Add item to cart
        this.app.post('/cart/add', HttpHelpers.asyncHandler(async (req, res) => {
            const validation = HttpHelpers.validateRequestBody(req, ['productId']);
            if (!validation.isValid) {
                return HttpHelpers.validationError(res, validation.errors);
            }

            const { productId, quantity = 1 } = req.body;

            try {
                const cart = mockData.addToCart(req.sessionId, productId, quantity);

                const responseData = {
                    cart: {
                        sessionId: cart.sessionId,
                        items: cart.items,
                        total: cart.total,
                        itemCount: cart.items.length,
                        updatedAt: cart.updatedAt
                    },
                    addedItem: {
                        productId,
                        quantity
                    },
                    note: "Item added to cart. The server maintains your cart state for future requests."
                };

                return HttpHelpers.successResponse(res, responseData, 'Item added to cart');
            } catch (error) {
                return HttpHelpers.errorResponse(res, error.message, 400);
            }
        }));

        // Remove item from cart
        this.app.delete('/cart/remove/:productId', (req, res) => {
            const { productId } = req.params;

            const cart = mockData.removeFromCart(req.sessionId, productId);

            const responseData = {
                cart: {
                    sessionId: cart.sessionId,
                    items: cart.items,
                    total: cart.total,
                    itemCount: cart.items.length,
                    updatedAt: cart.updatedAt
                },
                removedProductId: productId,
                note: "Item removed from cart. Cart state updated and maintained."
            };

            return HttpHelpers.successResponse(res, responseData, 'Item removed from cart');
        });

        // Clear cart
        this.app.delete('/cart', (req, res) => {
            const cart = mockData.clearCart(req.sessionId);

            const responseData = {
                cart: {
                    sessionId: cart.sessionId,
                    items: cart.items,
                    total: cart.total,
                    updatedAt: cart.updatedAt
                },
                note: "Cart cleared. Empty cart state maintained for session."
            };

            return HttpHelpers.successResponse(res, responseData, 'Cart cleared');
        });

        // ========== USER PROFILE MANAGEMENT (Stateful) ==========

        // Get user profile (requires session)
        this.app.get('/profile', (req, res) => {
            const user = mockData.getUserById(req.session.userId);

            if (!user) {
                return HttpHelpers.notFound(res, 'User');
            }

            const responseData = {
                profile: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    preferences: user.preferences,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                note: "User profile retrieved. Authentication via session ensures you only see your own data."
            };

            return HttpHelpers.successResponse(res, responseData, 'User profile');
        });

        // Update user preferences (stateful - persists across sessions)
        this.app.put('/profile/preferences', HttpHelpers.asyncHandler(async (req, res) => {
            const { preferences } = req.body;

            if (!preferences || typeof preferences !== 'object') {
                return HttpHelpers.validationError(res, [{
                    field: 'preferences',
                    message: 'Preferences must be an object'
                }]);
            }

            const updatedUser = mockData.updateUser(req.session.userId, { preferences });

            // Also update session data
            mockData.updateSession(req.sessionId, {
                lastPreferencesUpdate: new Date().toISOString()
            });

            const responseData = {
                profile: {
                    id: updatedUser.id,
                    preferences: updatedUser.preferences,
                    updatedAt: updatedUser.updatedAt
                },
                note: "Preferences updated. Changes persist across sessions (stored in user data)."
            };

            return HttpHelpers.successResponse(res, responseData, 'Preferences updated');
        }));

        // ========== DEMONSTRATION ENDPOINTS ==========

        // Endpoint to demonstrate stateful behavior
        this.app.get('/demonstrate/stateful', (req, res) => {
            const session = req.session;
            const visitCount = (session.data.visitCount || 0) + 1;

            // Update session with visit count
            mockData.updateSession(req.sessionId, {
                visitCount,
                lastDemonstrationVisit: new Date().toISOString()
            });

            const responseData = {
                demonstration: "Stateful Server Behavior",
                sessionInfo: {
                    sessionId: session.id,
                    userId: session.userId,
                    sessionCreated: session.createdAt,
                    sessionAge: `${Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000)} seconds`
                },
                visitCount,
                timestamp: new Date().toISOString(),
                explanation: [
                    "This server is STATEFUL:",
                    `1. I remember you! This is visit #${visitCount}`,
                    "2. Your session ID: " + session.id,
                    "3. I maintain your shopping cart, preferences, and visit history",
                    "4. Each request builds upon previous interactions",
                    "5. Server maintains client state across multiple requests",
                    "6. Requires session management and storage"
                ],
                note: "Refresh this page to see the visit count increase!"
            };

            return HttpHelpers.successResponse(res, responseData, 'Stateful behavior demonstration');
        });

        // Multi-step workflow demonstration (stateful)
        this.app.post('/workflow/start', (req, res) => {
            // Start a multi-step workflow
            const workflowId = `workflow_${Date.now()}`;
            const steps = ['started', 'data_collected', 'processing', 'completed'];

            mockData.updateSession(req.sessionId, {
                workflow: {
                    id: workflowId,
                    currentStep: 'started',
                    steps,
                    startedAt: new Date().toISOString(),
                    data: {}
                }
            });

            const responseData = {
                workflowId,
                currentStep: 'started',
                nextStep: 'data_collected',
                message: "Workflow started. Proceed to /workflow/next to continue.",
                note: "This demonstrates stateful multi-step processes where server maintains workflow state."
            };

            return HttpHelpers.successResponse(res, responseData, 'Workflow started');
        });

        this.app.post('/workflow/next', (req, res) => {
            const session = req.session;

            if (!session.data.workflow) {
                return HttpHelpers.errorResponse(res, 'No active workflow. Start one first.', 400);
            }

            const workflow = session.data.workflow;
            const currentIndex = workflow.steps.indexOf(workflow.currentStep);

            if (currentIndex === -1 || currentIndex >= workflow.steps.length - 1) {
                // Workflow completed
                mockData.updateSession(req.sessionId, {
                    workflow: {
                        ...workflow,
                        currentStep: 'completed',
                        completedAt: new Date().toISOString()
                    }
                });

                const responseData = {
                    workflowId: workflow.id,
                    currentStep: 'completed',
                    message: "Workflow completed!",
                    steps: workflow.steps,
                    startedAt: workflow.startedAt,
                    completedAt: new Date().toISOString(),
                    note: "Workflow state maintained across multiple requests."
                };

                return HttpHelpers.successResponse(res, responseData, 'Workflow completed');
            }

            // Move to next step
            const nextStep = workflow.steps[currentIndex + 1];
            mockData.updateSession(req.sessionId, {
                workflow: {
                    ...workflow,
                    currentStep: nextStep
                }
            });

            const responseData = {
                workflowId: workflow.id,
                currentStep: nextStep,
                nextStep: workflow.steps[currentIndex + 2] || 'completed',
                progress: `${currentIndex + 2}/${workflow.steps.length}`,
                message: `Proceeded to step: ${nextStep}`,
                note: "Each request advances the workflow, with state maintained by the server."
            };

            return HttpHelpers.successResponse(res, responseData, 'Workflow advanced');
        });

        // ========== INFO ENDPOINT (with session context) ==========
        this.app.get('/info', (req, res) => {
            const session = req.session;
            const activeSessions = Array.from(mockData.sessions.values()).length;

            const responseData = {
                server: 'Stateful Mock Server v1.0',
                timestamp: new Date().toISOString(),
                sessionInfo: {
                    sessionId: session.id,
                    userId: session.userId,
                    sessionAge: `${Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000)} seconds`
                },
                serverStats: {
                    activeSessions,
                    activeCarts: Array.from(mockData.carts.values()).length
                },
                message: "I remember you and maintain your state across requests!",
                note: "This is a stateful server - I track sessions, carts, and user preferences."
            };

            return HttpHelpers.successResponse(res, responseData, 'Stateful server information');
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
                sessionId: req.sessionId || 'none',
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
     * Start the stateful server
     */
    start(port = 3002) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, () => {
                defaultLogger.logServerStart('Stateful', port);
                resolve(this.server);
            });

            this.server.on('error', (error) => {
                defaultLogger.error('Failed to start stateful server', { error: error.message });
                reject(error);
            });
        });
    }

    /**
     * Stop the stateful server
     */
    stop() {
        return new Promise((resolve, reject) => {
            // Clear session cleanup interval
            if (this.sessionCleanupInterval) {
                clearInterval(this.sessionCleanupInterval);
            }

            if (!this.server) {
                resolve();
                return;
            }

            this.server.close((error) => {
                if (error) {
                    defaultLogger.error('Error stopping stateful server', { error: error.message });
                    reject(error);
                } else {
                    defaultLogger.logServerStop('Stateful');
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

module.exports = StatefulServer;
