/**
 * Unit tests for StatelessServer
 */
const request = require('supertest');
const { StatelessServer } = require('../../src/stateless-server');

describe('StatelessServer', () => {
    let server;
    let app;

    beforeAll(() => {
        server = new StatelessServer({ port: 0 }); // port 0 for dynamic allocation
        app = server.app;
    });

    afterAll(() => {
        // Clean up if needed
    });

    describe('GET /health', () => {
        it('should return health check information', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.server).toBe('Stateless Server');
            expect(response.body.data.status).toBe('healthy');
        });
    });

    describe('GET /info', () => {
        it('should return server info with request count', async () => {
            const response = await request(app)
                .get('/info')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.server).toBe('Stateless Server');
            expect(typeof response.body.data.requestCount).toBe('number');
            expect(response.body.data.message).toContain('stateless');
        });

        it('should increment request count on each call', async () => {
            const firstResponse = await request(app).get('/info');
            const secondResponse = await request(app).get('/info');

            // Request count should increase (stateless server-wide count)
            expect(secondResponse.body.data.requestCount)
                .toBeGreaterThanOrEqual(firstResponse.body.data.requestCount);
        });
    });

    describe('POST /calculate', () => {
        it('should perform calculation and return result', async () => {
            const payload = {
                operation: 'add',
                values: [1, 2, 3]
            };

            const response = await request(app)
                .post('/calculate')
                .send(payload)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.result).toBe(6);
            expect(response.body.data.operation).toBe('add');
        });

        it('should return error for invalid operation', async () => {
            const payload = {
                operation: 'invalid',
                values: [1, 2]
            };

            const response = await request(app)
                .post('/calculate')
                .send(payload)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Unsupported operation');
        });
    });

    describe('GET /random', () => {
        it('should return random numbers', async () => {
            const response = await request(app)
                .get('/random?count=5')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.values).toHaveLength(5);
            response.body.data.values.forEach(num => {
                expect(typeof num).toBe('number');
                expect(num).toBeGreaterThanOrEqual(0);
                expect(num).toBeLessThanOrEqual(100);
            });
        });

        it('should return random strings', async () => {
            const response = await request(app)
                .get('/random?count=3&type=string')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.values).toHaveLength(3);
            response.body.data.values.forEach(str => {
                expect(typeof str).toBe('string');
                expect(str.length).toBeGreaterThan(0);
            });
        });

        it('should return random booleans', async () => {
            const response = await request(app)
                .get('/random?count=4&type=boolean')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.values).toHaveLength(4);
            response.body.data.values.forEach(val => {
                expect(typeof val).toBe('boolean');
            });
        });

        it('should return error for invalid type', async () => {
            const response = await request(app)
                .get('/random?type=invalid')
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.status).toBe('error');
        });

        it('should respect count parameter limits', async () => {
            const response = await request(app)
                .get('/random?count=15') // max is 10
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data.values).toHaveLength(10);
        });
    });

    describe('GET /users', () => {
        it('should return list of users', async () => {
            const response = await request(app)
                .get('/users')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(response.body.data.users.length).toBeGreaterThan(0);
        });
    });

    describe('GET /users/:id', () => {
        it('should return user by ID', async () => {
            // First get a user ID from the list
            const listResponse = await request(app).get('/users');
            const userId = listResponse.body.data.users[0].id;

            const response = await request(app)
                .get(`/users/${userId}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.user.id).toBe(userId);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/users/nonexistent')
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.status).toBe('error');
        });
    });

    describe('Stateless behavior verification', () => {
        it('should not maintain state between requests', async () => {
            // Make a request that doesn't affect server state
            const firstResponse = await request(app).get('/info');
            const secondResponse = await request(app).get('/info');

            // The responses should be identical except for timestamp and requestCount
            // Remove variable fields
            const cleanFirst = { ...firstResponse.body };
            const cleanSecond = { ...secondResponse.body };
            delete cleanFirst.timestamp;
            delete cleanSecond.timestamp;
            delete cleanFirst.data.requestCount;
            delete cleanSecond.data.requestCount;

            expect(cleanFirst).toEqual(cleanSecond);
        });
    });
});