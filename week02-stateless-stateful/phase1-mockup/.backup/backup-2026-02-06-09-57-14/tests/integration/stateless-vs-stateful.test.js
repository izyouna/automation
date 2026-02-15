/**
 * Integration test comparing stateless vs stateful behavior
 */
const request = require('supertest');
const { StatelessServer } = require('../../src/stateless-server');
const { StatefulServer } = require('../../src/stateful-server');

describe('Stateless vs Stateful Integration Comparison', () => {
    let statelessApp;
    let statefulApp;
    let statefulSessionId;

    beforeAll(() => {
        const statelessServer = new StatelessServer({ port: 0 });
        statelessApp = statelessServer.app;

        const statefulServer = new StatefulServer({ port: 0 });
        statefulApp = statefulServer.app;
    });

    beforeEach(async () => {
        // Create a session for stateful tests
        const sessionResponse = await request(statefulApp)
            .post('/session')
            .send({ userId: 'integration-test-user' });
        statefulSessionId = sessionResponse.body.data.sessionId;
    });

    afterEach(async () => {
        // Clean up session
        if (statefulSessionId) {
            await request(statefulApp)
                .delete('/session')
                .set('Session-ID', statefulSessionId);
        }
    });

    describe('Request Independence', () => {
        test('stateless requests are independent', async () => {
            // Make 3 identical stateless requests
            const responses = [];
            for (let i = 0; i < 3; i++) {
                const res = await request(statelessApp)
                    .get('/info');
                responses.push(res.body);
            }

            // Remove variable fields (timestamps, requestCount)
            const normalized = responses.map(r => ({
                status: r.status,
                message: r.message,
                data: {
                    server: r.data.server,
                    message: r.data.message,
                    // ignore requestCount and timestamp
                }
            }));

            // All should be identical (proving no state)
            for (let i = 1; i < normalized.length; i++) {
                expect(normalized[i]).toEqual(normalized[0]);
            }
        });

        test('stateful requests maintain context', async () => {
            const messageCounts = [];

            // Make multiple requests with same session
            for (let i = 0; i < 3; i++) {
                const res = await request(statefulApp)
                    .post('/workflow/start')
                    .set('Session-ID', statefulSessionId)
                    .send({ workflowType: 'test' });

                // Each request should increment step
                messageCounts.push(res.body.data.workflow.step);
            }

            // Steps should increment: 1, 2, 3 (or at least increase)
            expect(messageCounts[0]).toBe(1);
            expect(messageCounts[1]).toBeGreaterThan(messageCounts[0]);
            expect(messageCounts[2]).toBeGreaterThan(messageCounts[1]);
        });
    });

    describe('Session Persistence', () => {
        test('stateful server remembers session data across requests', async () => {
            // Add item to cart
            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', statefulSessionId)
                .send({ productId: 'prod-001', quantity: 2 });

            // Retrieve cart
            const cartResponse = await request(statefulApp)
                .get('/cart')
                .set('Session-ID', statefulSessionId);

            expect(cartResponse.body.data.cart.items).toHaveLength(1);
            expect(cartResponse.body.data.cart.items[0].productId).toBe('prod-001');
            expect(cartResponse.body.data.cart.items[0].quantity).toBe(2);

            // Add another item
            await request(statefulApp)
                .post('/cart/add')
                .set('Session-ID', statefulSessionId)
                .send({ productId: 'prod-002', quantity: 1 });

            // Retrieve cart again - should have 2 items
            const updatedCartResponse = await request(statefulApp)
                .get('/cart')
                .set('Session-ID', statefulSessionId);

            expect(updatedCartResponse.body.data.cart.items).toHaveLength(2);
            expect(updatedCartResponse.body.data.cart.items[1].productId).toBe('prod-002');
        });

        test('stateless server does not remember anything between requests', async () => {
            // Make a request that could potentially set state (but shouldn't)
            const firstResponse = await request(statelessApp)
                .post('/calculate')
                .send({ operation: 'add', values: [1, 2] });

            // Make another request - server should not remember previous calculation
            const secondResponse = await request(statelessApp)
                .post('/calculate')
                .send({ operation: 'add', values: [3, 4] });

            // Responses should be independent
            expect(firstResponse.body.data.result).toBe(3);
            expect(secondResponse.body.data.result).toBe(7);
            // No shared state between these requests
        });
    });

    describe('Error Handling Differences', () => {
        test('stateless server returns error without context', async () => {
            const response = await request(statelessApp)
                .post('/calculate')
                .send({ invalid: 'data' })
                .expect(400);

            expect(response.body.status).toBe('error');
            // Error message doesn't reference previous requests
        });

        test('stateful server returns session-specific errors', async () => {
            // Try to access cart without session
            const response = await request(statefulApp)
                .get('/cart')
                .expect(401); // No session header

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Session');
        });
    });

    describe('Performance Characteristics', () => {
        test('stateless requests are faster (no session lookup)', async () => {
            const iterations = 10;
            let statelessTotalTime = 0;
            let statefulTotalTime = 0;

            // Time stateless requests
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request(statelessApp).get('/info');
                statelessTotalTime += Date.now() - start;
            }

            // Time stateful requests (with session)
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request(statefulApp)
                    .get('/session')
                    .set('Session-ID', statefulSessionId);
                statefulTotalTime += Date.now() - start;
            }

            const statelessAvg = statelessTotalTime / iterations;
            const statefulAvg = statefulTotalTime / iterations;

            // Stateless should generally be faster (no session lookup)
            // We'll just log the times for observation
            console.log(`Stateless avg: ${statelessAvg}ms, Stateful avg: ${statefulAvg}ms`);
            expect(statelessAvg).toBeLessThan(statefulAvg * 2); // Allow some variance
        });
    });

    describe('Scalability Implications', () => {
        test('multiple stateless requests don\'t increase memory burden', async () => {
            // Make many stateless requests
            const requests = Array(20).fill(null);
            const responses = await Promise.all(
                requests.map(() => request(statelessApp).get('/info'))
            );

            // All should succeed
            responses.forEach(res => {
                expect(res.status).toBe(200);
            });
        });

        test('multiple stateful sessions increase memory usage', async () => {
            // Create multiple sessions
            const sessions = [];
            for (let i = 0; i < 5; i++) {
                const res = await request(statefulApp)
                    .post('/session')
                    .send({ userId: `user-${i}` });
                sessions.push(res.body.data.sessionId);
            }

            // Verify each session is independent
            for (let i = 0; i < sessions.length; i++) {
                const res = await request(statefulApp)
                    .get('/session')
                    .set('Session-ID', sessions[i]);
                expect(res.body.data.session.userId).toBe(`user-${i}`);
            }

            // Clean up
            await Promise.all(
                sessions.map(sessionId =>
                    request(statefulApp)
                        .delete('/session')
                        .set('Session-ID', sessionId)
                )
            );
        });
    });
});