#!/usr/bin/env node
/**
 * Week 02 Phase 1 Gateway Test
 * Tests both stateless-api and stateful-api through the Nginx Gateway
 */

const http = require('http');
const https = require('https');

function makeRequest(url, method = 'GET', headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            rejectUnauthorized: false // For self-signed gateway certs
        };

        const req = lib.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', (error) => reject(error));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('\n🚀 Starting Week 02 Phase 1 Gateway Test Suite\n');

    const statelessBase = 'http://localhost:8080/api/stateless';
    const statefulBase = 'https://localhost/api/stateful';

    // --- Stateless API Tests ---
    console.log('--- Testing Stateless API (Public Gateway) ---');
    try {
        const health = await makeRequest(`${statelessBase}/health`);
        console.log(`✅ Health Check: ${health.status} OK`);
        
        const info = await makeRequest(`${statelessBase}/info`);
        console.log(`✅ Server Info: ${info.body.data.architecture}`);
        
        // Demonstrate statelessness
        const demo1 = await makeRequest(`${statelessBase}/demonstrate/stateless`);
        const firstCount = demo1.body.yourRequestNumber || demo1.body.data.requestCount;
        const demo2 = await makeRequest(`${statelessBase}/demonstrate/stateless`);
        const secondCount = demo2.body.yourRequestNumber || demo2.body.data.requestCount;
        console.log(`✅ Statelessness: Request 1 count: ${firstCount}, Request 2 count: ${secondCount}`);
    } catch (e) {
        console.error(`❌ Stateless API Error: ${e.message}`);
    }

    // --- Stateful API Tests ---
    console.log('\n--- Testing Stateful API (Private Gateway via HTTPS) ---');
    try {
        const health = await makeRequest(`${statefulBase}/health`);
        console.log(`✅ Health Check: ${health.status} OK`);

        // Test session creation
        console.log('🔄 Creating session...');
        const login = await makeRequest(`${statefulBase}/session/start`, 'POST', {}, { username: 'alice', password: 'password123' });
        
        if (login.status === 200) {
            const sessionId = login.body.sessionId;
            console.log(`✅ Session Created: ${sessionId}`);

            // Test session persistence
            console.log('🔄 Verifying session persistence...');
            const demo1 = await makeRequest(`${statefulBase}/demonstrate/stateful`, 'GET', { 'X-Session-ID': sessionId });
            const count1 = demo1.body.serverSideCounter;
            
            const demo2 = await makeRequest(`${statefulBase}/demonstrate/stateful`, 'GET', { 'X-Session-ID': sessionId });
            const count2 = demo2.body.serverSideCounter;
            
            console.log(`✅ Stateful Behavior: Count 1: ${count1}, Count 2: ${count2}`);
            if (count2 > count1) {
                console.log('✅ Success: Server remembered the session state!');
            } else {
                console.log('❌ Failure: Server did not increment session counter.');
            }
        } else {
            console.log(`❌ Session creation failed: ${login.status} ${JSON.stringify(login.body)}`);
        }
    } catch (e) {
        console.error(`❌ Stateful API Error: ${e.message}`);
    }

    console.log('\n🏁 Gateway Test Suite Complete\n');
}

runTests();
