#!/usr/bin/env node
/**
 * Week 02 Phase 1 Dual API Test
 * Tests both stateless-api and stateful-api
 */

const http = require('http');

function makeRequest(host, port, path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Week02-Test-Client/1.0'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: res.headers,
                        body: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function testStatelessAPI() {
    console.log('\n' + '='.repeat(60));
    console.log('TESTING STATELESS-API (Port 3000)');
    console.log('='.repeat(60));

    try {
        // Test 1: Health Check
        console.log('\n[TEST 1] Health Check');
        const health = await makeRequest('localhost', 3000, '/health');
        console.log(`Status: ${health.status} ${health.statusText}`);
        console.log('Response:', JSON.stringify(health.body, null, 2));

        // Test 2: Info Endpoint
        console.log('\n[TEST 2] Server Info');
        const info = await makeRequest('localhost', 3000, '/info');
        console.log(`Status: ${info.status} ${info.statusText}`);
        console.log('Response:', JSON.stringify(info.body, null, 2));

        // Test 3: Get Users
        console.log('\n[TEST 3] Get All Users');
        const users = await makeRequest('localhost', 3000, '/users');
        console.log(`Status: ${users.status} ${users.statusText}`);
        console.log('Response:', JSON.stringify(users.body, null, 2));

        // Test 4: Get Specific User
        console.log('\n[TEST 4] Get Specific User (ID: user1)');
        const user = await makeRequest('localhost', 3000, '/users/user1');
        console.log(`Status: ${user.status} ${user.statusText}`);
        console.log('Response:', JSON.stringify(user.body, null, 2));

        // Test 5: Get Products
        console.log('\n[TEST 5] Get All Products');
        const products = await makeRequest('localhost', 3000, '/products');
        console.log(`Status: ${products.status} ${products.statusText}`);
        console.log(`Response: ${products.body.count} products found`);
        if (products.body.products && products.body.products.length > 0) {
            console.log('Sample product:', JSON.stringify(products.body.products[0], null, 2));
        }

        // Test 6: Demonstrate Stateless Behavior
        console.log('\n[TEST 6] Demonstrate Stateless Behavior (call twice)');
        const demo1 = await makeRequest('localhost', 3000, '/demonstrate/stateless', 'GET', {});
        console.log('First call:', demo1.body.yourRequestNumber);
        const demo2 = await makeRequest('localhost', 3000, '/demonstrate/stateless', 'GET', {});
        console.log('Second call:', demo2.body.yourRequestNumber);
        console.log('Note:', demo2.body.explanation[1]);

        console.log('\n✓ Stateless API tests passed');
    } catch (error) {
        console.error('✗ Error testing stateless API:', error.message);
    }
}

async function testStatefulAPI() {
    console.log('\n' + '='.repeat(60));
    console.log('TESTING STATEFUL-API (Port 3001)');
    console.log('='.repeat(60));

    try {
        // Test 1: Health Check
        console.log('\n[TEST 1] Health Check');
        const health = await makeRequest('localhost', 3001, '/health');
        console.log(`Status: ${health.status} ${health.statusText}`);
        console.log('Response:', JSON.stringify(health.body, null, 2));

        // Test 2: Info Endpoint
        console.log('\n[TEST 2] Server Info');
        const info = await makeRequest('localhost', 3001, '/info');
        console.log(`Status: ${info.status} ${info.statusText}`);
        console.log('Response:', JSON.stringify(info.body, null, 2));

        // Test 3: Get Users
        console.log('\n[TEST 3] Get All Users');
        const users = await makeRequest('localhost', 3001, '/users');
        console.log(`Status: ${users.status} ${users.statusText}`);
        console.log('Response:', JSON.stringify(users.body, null, 2));

        // Test 4: Get Specific User
        console.log('\n[TEST 4] Get Specific User (ID: user1)');
        const user = await makeRequest('localhost', 3001, '/users/user1');
        console.log(`Status: ${user.status} ${user.statusText}`);
        console.log('Response:', JSON.stringify(user.body, null, 2));

        // Test 5: Get Products
        console.log('\n[TEST 5] Get All Products');
        const products = await makeRequest('localhost', 3001, '/products');
        console.log(`Status: ${products.status} ${products.statusText}`);
        console.log(`Response: ${products.body.count} products found`);
        if (products.body.products && products.body.products.length > 0) {
            console.log('Sample product:', JSON.stringify(products.body.products[0], null, 2));
        }

        // Test 6: Demonstrate Stateful Behavior
        console.log('\n[TEST 6] Demonstrate Stateful Behavior (call twice)');
        const demo1 = await makeRequest('localhost', 3001, '/demonstrate/stateful', 'GET', {});
        console.log('First call server-side count:', demo1.body.serverSideCounter);
        const demo2 = await makeRequest('localhost', 3001, '/demonstrate/stateful', 'GET', {});
        console.log('Second call server-side count:', demo2.body.serverSideCounter);
        console.log('Difference:', demo2.body.serverSideCounter - demo1.body.serverSideCounter);

        console.log('\n✓ Stateful API tests passed');
    } catch (error) {
        console.error('✗ Error testing stateful API:', error.message);
    }
}

async function compareAPIs() {
    console.log('\n' + '='.repeat(60));
    console.log('COMPARING STATELESS VS STATEFUL');
    console.log('='.repeat(60));

    try {
        // Get info from both APIs
        const statelessInfo = await makeRequest('localhost', 3000, '/info');
        const statefulInfo = await makeRequest('localhost', 3001, '/info');

        console.log('\nStateless API:');
        console.log('  Port: 3000');
        console.log('  Type:', statelessInfo.body.data.architecture);
        console.log('  Request Count:', statelessInfo.body.data.requestCount);
        console.log('  Network:', 'Public (172.18.0.6)');

        console.log('\nStateful API:');
        console.log('  Port: 3001');
        console.log('  Type:', statefulInfo.body.data.serverType);
        console.log('  Session Count:', statefulInfo.body.data.activeSessionCount || 'N/A');
        console.log('  Network:', 'Private (172.19.0.6)');

        console.log('\nKey Differences:');
        console.log('  Stateless: No memory between requests');
        console.log('  Stateful: Maintains session state between requests');
        console.log('  Stateless: Can run on any network interface');
        console.log('  Stateful: Restricted to private network for security');
    } catch (error) {
        console.error('✗ Error comparing APIs:', error.message);
    }
}

async function main() {
    console.log('\n' + '█'.repeat(60));
    console.log('█ WEEK 02 PHASE 1 - DUAL API TEST SUITE'.padEnd(59) + '█');
    console.log('█ Testing Stateless vs Stateful Architecture'.padEnd(59) + '█');
    console.log('█'.repeat(60));

    await testStatelessAPI();
    await testStatefulAPI();
    await compareAPIs();

    console.log('\n' + '█'.repeat(60));
    console.log('█ TEST SUITE COMPLETE'.padEnd(59) + '█');
    console.log('█'.repeat(60) + '\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
