/**
 * Unit tests for StatefulServer
 */
const request = require('supertest');
const { StatefulServer } = require('../../src/stateful-server');

describe('StatefulServer', () => {
    let server;
    let app;

    beforeAll(() => {
        server = new StatefulServer({ port: 0 });
        app = server.app;
    });

    afterAll(async () => {
        // Clean up if needed
        if (server && server.stop) {
            await server.stop();
        }
    });

    describe('GET /health', () => {
        it('should return health check information', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.server).toBe('Stateful Server');
            expect(response.body.data.status).toBe('healthy');
            expect(typeof response.body.data.activeSessions).toBe('number');
        });
    });

    describe('Session Management', () => {
        let sessionId;

        describe('POST /session', () => {
            it('should create a new session', async () => {
                const payload = {
                    userId: 'test-user-1',
                    data: { preferences: { theme: 'dark' } }
                };

                const response = await request(app)
                    .post('/session')
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(201);

                expect(response.body.status).toBe('success');
                expect(response.body.data.session).toBeDefined();
                expect(response.body.data.session.id).toBeDefined();
                expect(response.body.data.session.userId).toBe('test-user-1');
                expect(response.body.data.session.createdAt).toBeDefined();

                sessionId = response.body.data.session.id;
            });

            it('should return error for missing userId', async () => {
                const payload = { data: {} };

                const response = await request(app)
                    .post('/session')
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.status).toBe('error');
            });

            it('should return error for non-existent user', async () => {
                const payload = { userId: 'non-existent-user' };

                const response = await request(app)
                    .post('/session')
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(404);

                expect(response.body.status).toBe('error');
            });
        });

        describe('GET /session', () => {
            it('should return session info with valid session header', async () => {
                const response = await request(app)
                    .get('/session')
                    .set('Session-ID', sessionId)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.session.userId).toBe('test-user-1');
                expect(response.body.data.session.id).toBe(sessionId);
            });

            it('should return 401 without session header', async () => {
                const response = await request(app)
                    .get('/session')
                    .expect('Content-Type', /json/)
                    .expect(401);

                expect(response.body.status).toBe('error');
                expect(response.body.message).toContain('Session required');
            });

            it('should return 404 for invalid session', async () => {
                const response = await request(app)
                    .get('/session')
                    .set('Session-ID', 'invalid-session-id')
                    .expect('Content-Type', /json/)
                    .expect(404);

                expect(response.body.status).toBe('error');
                expect(response.body.message).toContain('Session not found');
            });
        });

        describe('PUT /session', () => {
            it('should update session data', async () => {
                const payload = {
                    data: { preferences: { theme: 'light', language: 'en' } }
                };

                const response = await request(app)
                    .put('/session')
                    .set('Session-ID', sessionId)
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.session.data.preferences.theme).toBe('light');
            });
        });

        describe('DELETE /session', () => {
            it('should delete session (logout)', async () => {
                const response = await request(app)
                    .delete('/session')
                    .set('Session-ID', sessionId)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.message).toContain('Session ended');
            });

            it('should not allow access after deletion', async () => {
                const response = await request(app)
                    .get('/session')
                    .set('Session-ID', sessionId)
                    .expect('Content-Type', /json/)
                    .expect(404);

                expect(response.body.status).toBe('error');
            });
        });
    });

    describe('Cart Management', () => {
        let sessionId;

        beforeAll(async () => {
            // Create a new session for cart tests
            const response = await request(app)
                .post('/session')
                .send({ userId: 'cart-user' });
            sessionId = response.body.data.sessionId;
        });

        afterAll(async () => {
            // Clean up session
            await request(app)
                .delete('/session')
                .set('Session-ID', sessionId);
        });

        describe('POST /cart/add', () => {
            it('should add item to cart', async () => {
                const payload = {
                    productId: 'prod-001',
                    quantity: 2
                };

                const response = await request(app)
                    .post('/cart/add')
                    .set('Session-ID', sessionId)
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.cart.items).toHaveLength(1);
                expect(response.body.data.cart.items[0].productId).toBe('prod-001');
                expect(response.body.data.cart.items[0].quantity).toBe(2);
            });

            it('should increment quantity for same product', async () => {
                const payload = {
                    productId: 'prod-001',
                    quantity: 1
                };

                const response = await request(app)
                    .post('/cart/add')
                    .set('Session-ID', sessionId)
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.data.cart.items[0].quantity).toBe(3);
            });
        });

        describe('GET /cart', () => {
            it('should return cart contents', async () => {
                const response = await request(app)
                    .get('/cart')
                    .set('Session-ID', sessionId)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.cart.sessionId).toBe(sessionId);
                expect(response.body.data.cart.items).toHaveLength(1);
            });
        });

        describe('DELETE /cart/remove/:productId', () => {
            it('should remove item from cart', async () => {
                const response = await request(app)
                    .delete('/cart/remove/prod-001')
                    .set('Session-ID', sessionId)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.cart.items).toHaveLength(0);
            });
        });

        describe('DELETE /cart', () => {
            it('should clear entire cart', async () => {
                // Add an item first
                await request(app)
                    .post('/cart/add')
                    .set('Session-ID', sessionId)
                    .send({ productId: 'prod-002', quantity: 1 });

                const response = await request(app)
                    .delete('/cart')
                    .set('Session-ID', sessionId)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(response.body.status).toBe('success');
                expect(response.body.data.cart.items).toHaveLength(0);
            });
        });
    });

    describe('Stateful behavior verification', () => {
        let sessionId;

        beforeAll(async () => {
            const response = await request(app)
                .post('/session')
                .send({ userId: 'stateful-test' });
            sessionId = response.body.data.sessionId;
        });

        afterAll(async () => {
            await request(app)
                .delete('/session')
                .set('Session-ID', sessionId);
        });

        it('should maintain state across requests', async () => {
            // First request to start a workflow
            const startResponse = await request(app)
                .post('/workflow/start')
                .set('Session-ID', sessionId)
                .send({ workflowType: 'test' })
                .expect(200);

            expect(startResponse.body.data.workflow.step).toBe(1);

            // Second request should continue from step 1
            const nextResponse = await request(app)
                .post('/workflow/next')
                .set('Session-ID', sessionId)
                .send({ input: 'next' })
                .expect(200);

            expect(nextResponse.body.data.workflow.step).toBe(2);
            expect(nextResponse.body.data.workflow.history).toContain('step1');
        });

        it('should have different state for different sessions', async () => {
            // Create second session
            const secondSession = await request(app)
                .post('/session')
                .send({ userId: 'user2' });
            const secondSessionId = secondSession.body.data.sessionId;

            // Add item to cart in first session
            await request(app)
                .post('/cart/add')
                .set('Session-ID', sessionId)
                .send({ productId: 'prod-session1', quantity: 1 });

            // Add different item to cart in second session
            await request(app)
                .post('/cart/add')
                .set('Session-ID', secondSessionId)
                .send({ productId: 'prod-session2', quantity: 2 });

            // Verify carts are separate
            const cart1 = await request(app)
                .get('/cart')
                .set('Session-ID', sessionId);
            const cart2 = await request(app)
                .get('/cart')
                .set('Session-ID', secondSessionId);

            expect(cart1.body.data.cart.items[0].productId).toBe('prod-session1');
            expect(cart2.body.data.cart.items[0].productId).toBe('prod-session2');

            // Clean up second session
            await request(app)
                .delete('/session')
                .set('Session-ID', secondSessionId);
        });
    });

    describe('GET /health', () => {
        it('should return health check with session count', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.server).toBe('Stateful Server');
            expect(typeof response.body.data.activeSessions).toBe('number');
        });
    });
});