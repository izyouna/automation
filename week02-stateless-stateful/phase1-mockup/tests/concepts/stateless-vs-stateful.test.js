/**
 * Concept validation tests - explicitly demonstrate stateless vs stateful differences
 */
const request = require('supertest');
const { StatelessServer } = require('../../src/stateless-server');
const { StatefulServer } = require('../../src/stateful-server');

describe('Concept: Stateless vs Stateful Behavior', () => {
    let statelessApp;
    let statefulApp;

    beforeAll(() => {
        const statelessServer = new StatelessServer({ port: 0 });
        statelessApp = statelessServer.app;

        const statefulServer = new StatefulServer({ port: 0 });
        statefulApp = statefulServer.app;
    });

    describe('Memory Between Requests', () => {
        test('stateless server has no memory between requests', async () => {
            // First request
            const firstResponse = await request(statelessApp)
                .get('/demonstrate/stateless');

            // Second identical request
            const secondResponse = await request(statelessApp)
                .get('/demonstrate/stateless');

            // The server should not remember anything about the first request
            expect(secondResponse.body.data.previousCount).toBeNull();
            expect(secondResponse.body.data.note).toContain('no memory');
        });

        test('stateful server remembers previous interactions', async () => {
            // Create a session
            const sessionResponse = await request(statefulApp)
                .post('/session')
                .send({ userId: 'concept-test' });
            const sessionId = sessionResponse.body.data.sessionId;

            // First request with session
            const firstResponse = await request(statefulApp)
                .get('/demonstrate/stateful')
                .set('Session-ID', sessionId);

            // Second request with same session
            const secondResponse = await request(statefulApp)
                .get('/demonstrate/stateful')
                .set('Session-ID', sessionId);

            // The server should remember the previous request
            expect(secondResponse.body.data.previousRequests).toBeGreaterThan(0);
            expect(secondResponse.body.data.note).toContain('state maintained');

            // Clean up
            await request(statefulApp)
                .delete('/session')
                .set('Session-ID', sessionId);
        });
    });

    describe('Request Independence', () => {
        test('stateless requests are completely independent', async () => {
            const responses = [];
            const clientIds = ['client-a', 'client-b', 'client-c'];

            // Make requests with different client IDs
            for (const clientId of clientIds) {
                const res = await request(statelessApp)
                    .get('/info')
                    .set('Client-ID', clientId);
                responses.push(res.body);
            }

            // Remove variable fields
            const normalized = responses.map(r => ({
                status: r.status,
                message: r.message,
                data: {
                    server: r.data.server,
                    message: r.data.message
                }
            }));

            // All responses should be identical regardless of client ID
            for (let i = 1; i < normalized.length; i++) {
                expect(normalized[i]).toEqual(normalized[0]);
            }
        });

        test('stateful requests are dependent on session', async () => {
            // Create two sessions
            const session1 = await request(statefulApp)
                .post('/session')
                .send({ userId: 'user1' });
            const session1Id = session1.body.data.sessionId;

            const session2 = await request(statefulApp)
                .post('/session')
                .send({ userId: 'user2' });
            const session2Id = session2.body.data.sessionId;

            // Add item to cart in session 1
            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', session1Id)
                .send({ productId: 'prod-1', quantity: 1 });

            // Add different item to cart in session 2
            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', session2Id)
                .send({ productId: 'prod-2', quantity: 2 });

            // Verify carts are different
            const cart1 = await request(statefulApp)
                .get('/cart')
                .set('Session-ID', session1Id);
            const cart2 = await request(statefulApp)
                .get('/cart')
                .set('Session-ID', session2Id);

            expect(cart1.body.data.cart.items[0].productId).toBe('prod-1');
            expect(cart2.body.data.cart.items[0].productId).toBe('prod-2');

            // Clean up
            await request(statefulApp)
                .delete('/session')
                .set('Session-ID', session1Id);
            await request(statefulApp)
                .delete('/session')
                .set('Session-ID', session2Id);
        });
    });

    describe('Failure Impact', () => {
        test('stateless server restart has no impact on clients', async () => {
            // This is a conceptual test - we simulate restart by creating a new server instance
            const firstServer = new StatelessServer({ port: 0 });
            const firstApp = firstServer.app;

            // Make a request
            const firstResponse = await request(firstApp).get('/info');
            const firstRequestCount = firstResponse.body.data.requestCount;

            // "Restart" - create a new server instance
            const secondServer = new StatelessServer({ port: 0 });
            const secondApp = secondServer.app;

            // Make same request to new server
            const secondResponse = await request(secondApp).get('/info');
            const secondRequestCount = secondResponse.body.data.requestCount;

            // Request count resets (server-wide state lost)
            // This demonstrates that stateless servers can be restarted without affecting clients
            // (except for server-wide counters)
            expect(secondRequestCount).toBe(1); // Fresh start
        });

        test('stateful server restart loses all sessions', async () => {
            // Create a session
            const firstServer = new StatefulServer({ port: 0 });
            const firstApp = firstServer.app;

            const sessionResponse = await request(firstApp)
                .post('/session')
                .send({ userId: 'test-user' });
            const sessionId = sessionResponse.body.data.sessionId;

            // Add item to cart
            await request(firstApp)
                .post('/cart/add')
                .set('Session-ID', sessionId)
                .send({ productId: 'prod-1', quantity: 1 });

            // "Restart" - create new server instance (simulating restart)
            const secondServer = new StatefulServer({ port: 0 });
            const secondApp = secondServer.app;

            // Try to access session - should fail
            const cartResponse = await request(secondApp)
                .get('/cart')
                .set('Session-ID', sessionId)
                .expect(404); // Session not found

            expect(cartResponse.body.message).toContain('Session not found');
            // This demonstrates that stateful servers lose all session data on restart
        });
    });

    describe('Scalability Characteristics', () => {
        test('stateless servers can handle identical requests efficiently', async () => {
            const startTime = Date.now();
            const requests = Array(50).fill(null);

            // Make many identical requests
            const responses = await Promise.all(
                requests.map(() => request(statelessApp).get('/info'))
            );

            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / requests.length;

            // All should succeed
            responses.forEach(res => {
                expect(res.status).toBe(200);
            });

            console.log(`Stateless: ${requests.length} requests in ${totalTime}ms (avg ${avgTime}ms)`);
            // No assertion about time, just demonstration
        });

        test('stateful servers require session management overhead', async () => {
            const startTime = Date.now();
            const sessions = [];

            // Create multiple sessions
            for (let i = 0; i < 10; i++) {
                const res = await request(statefulApp)
                    .post('/session')
                    .send({ userId: `user-${i}` });
                sessions.push(res.body.data.sessionId);
            }

            // Make requests with each session
            for (const sessionId of sessions) {
                await request(statefulApp)
                    .get('/session')
                    .set('Session-ID', sessionId);
            }

            const totalTime = Date.now() - startTime;

            // Clean up
            await Promise.all(
                sessions.map(sessionId =>
                    request(statefulApp)
                        .delete('/session')
                        .set('Session-ID', sessionId)
                )
            );

            console.log(`Stateful: 10 sessions created and queried in ${totalTime}ms`);
            // Demonstrates overhead of session management
        });
    });

    describe('Use Case Examples', () => {
        test('stateless use case: calculation service', async () => {
            // Stateless is ideal for independent calculations
            const calculations = [
                { operation: 'add', values: [1, 2, 3] },
                { operation: 'multiply', values: [4, 5] },
                { operation: 'average', values: [10, 20, 30] }
            ];

            for (const calc of calculations) {
                const response = await request(statelessApp)
                    .post('/calculate')
                    .send(calc);

                expect(response.status).toBe(200);
                expect(response.body.data.operation).toBe(calc.operation);
                // Each calculation is independent, no need for session
            }
        });

        test('stateful use case: shopping cart', async () => {
            // Stateful is necessary for shopping cart
            const sessionResponse = await request(statefulApp)
                .post('/session')
                .send({ userId: 'shopper' });
            const sessionId = sessionResponse.body.data.sessionId;

            // Multi-step interaction
            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', sessionId)
                .send({ productId: 'prod-a', quantity: 2 });

            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', sessionId)
                .send({ productId: 'prod-b', quantity: 1 });

            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', sessionId)
                .send({ productId: 'prod-a', quantity: 1 }); // Increase quantity

            const cartResponse = await request(statefulApp)
                .get('/cart')
                .set('Session-ID', sessionId);

            expect(cartResponse.body.data.cart.items).toHaveLength(2);
            const itemA = cartResponse.body.data.cart.items.find(i => i.productId === 'prod-a');
            expect(itemA.quantity).toBe(3); // State maintained across requests

            // Clean up
            await request(statefulApp)
                .delete('/session')
                .set('Session-ID', sessionId);
        });
    });

    describe('Educational Demonstration', () => {
        test('side-by-side comparison of identical request sequences', async () => {
            // Sequence of actions
            const actions = [
                { type: 'info', method: 'GET', path: '/info' },
                { type: 'data', method: 'GET', path: '/users' },
                { type: 'calc', method: 'POST', path: '/calculate', body: { operation: 'add', values: [1, 2] } }
            ];

            const statelessResults = [];
            const statefulResults = [];

            // Create a stateful session
            const sessionResponse = await request(statefulApp)
                .post('/session')
                .send({ userId: 'comparison-user' });
            const sessionId = sessionResponse.body.data.sessionId;

            // Execute each action on both servers
            for (const action of actions) {
                // Stateless
                const statelessReq = request(statelessApp)[action.method.toLowerCase()](action.path);
                if (action.body) statelessReq.send(action.body);
                const statelessRes = await statelessReq;
                statelessResults.push({
                    type: action.type,
                    status: statelessRes.status,
                    data: statelessRes.body.data
                });

                // Stateful (with session)
                const statefulReq = request(statefulApp)[action.method.toLowerCase()](action.path)
                    .set('Session-ID', sessionId);
                if (action.body) statefulReq.send(action.body);
                const statefulRes = await statefulReq;
                statefulResults.push({
                    type: action.type,
                    status: statefulRes.status,
                    data: statefulRes.body.data
                });
            }

            // Compare results
            console.log('=== Stateless vs Stateful Comparison ===');
            console.log('Stateless results:', JSON.stringify(statelessResults, null, 2));
            console.log('Stateful results:', JSON.stringify(statefulResults, null, 2));

            // Key observation: stateless responses don't change based on previous requests
            // while stateful responses may include session context
            expect(statelessResults[0].data.server).toBe('Stateless Server');
            expect(statefulResults[0].data.server).toBe('Stateful Server');

            // Clean up
            await request(statefulApp)
                .delete('/session')
                .set('Session-ID', sessionId);
        });
    });
});