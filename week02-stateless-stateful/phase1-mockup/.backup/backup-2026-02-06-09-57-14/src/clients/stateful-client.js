#!/usr/bin/env node

/**
 * Stateful Client Demonstration
 * Shows how stateful server interactions work with sessions
 */

const axios = require('axios');

// Configuration
const STATEFUL_PORT = 3002;
const BASE_URL = `http://localhost:${STATEFUL_PORT}`;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(title, 'bright');
    log('='.repeat(60), 'cyan');
}

function printRequest(method, url, data = null, sessionId = null) {
    log(`\n📤 ${method} ${url}`, 'yellow');
    if (sessionId) {
        log(`   Session-ID: ${sessionId}`, 'magenta');
    }
    if (data) {
        log(`   Body: ${JSON.stringify(data, null, 2)}`, 'blue');
    }
}

function printResponse(response) {
    log(`📥 Status: ${response.status}`, 'green');
    log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');
}

// Stateful client instance
class StatefulClient {
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
        this.sessionId = null;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'Client-ID': 'stateful-demo-client'
            }
        });
    }

    // Add session ID to requests if available
    async makeRequest(method, url, data = null) {
        const config = {};
        if (this.sessionId) {
            config.headers = {
                'Session-ID': this.sessionId
            };
        }

        try {
            let response;
            switch (method.toLowerCase()) {
                case 'get':
                    response = await this.client.get(url, config);
                    break;
                case 'post':
                    response = await this.client.post(url, data, config);
                    break;
                case 'put':
                    response = await this.client.put(url, data, config);
                    break;
                case 'delete':
                    response = await this.client.delete(url, config);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
            
            printRequest(method.toUpperCase(), url, data, this.sessionId);
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Request failed: ${error.message}`, 'red');
            if (error.response) {
                log(`   Error response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
            }
            throw error;
        }
    }

    async healthCheck() {
        return await this.makeRequest('GET', '/health');
    }

    async getServerInfo() {
        return await this.makeRequest('GET', '/info');
    }

    // Session management
    async createSession(userId, data = {}) {
        const response = await this.makeRequest('POST', '/session', { userId, data });
        
        // Extract session ID from response headers or body
        if (response.data.session && response.data.session.id) {
            this.sessionId = response.data.session.id;
            log(`✅ Session created: ${this.sessionId}`, 'green');
        }
        
        return response;
    }

    async getSession() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('GET', '/session');
    }

    async updateSession(data) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('PUT', '/session', { data });
    }

    async deleteSession() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        const response = await this.makeRequest('DELETE', '/session');
        log(`🗑️  Session ${this.sessionId} deleted`, 'yellow');
        this.sessionId = null;
        return response;
    }

    // Shopping cart operations
    async getCart() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('GET', '/cart');
    }

    async addToCart(productId, quantity = 1) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('POST', '/cart/add', { productId, quantity });
    }

    async removeFromCart(productId) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('DELETE', `/cart/remove/${productId}`);
    }

    async clearCart() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('DELETE', '/cart');
    }

    // User profile operations
    async getProfile() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('GET', '/profile');
    }

    async updatePreferences(preferences) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('PUT', '/profile/preferences', { preferences });
    }

    // Demonstration endpoints
    async demonstrateStatefulBehavior() {
        return await this.makeRequest('GET', '/demonstrate/stateful');
    }

    async startWorkflow() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('POST', '/workflow/start');
    }

    async nextWorkflowStep() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }
        return await this.makeRequest('POST', '/workflow/next');
    }
}

// Demonstration functions
async function demonstrateSessionLifecycle(client) {
    printSection('🔄 Session Lifecycle Demonstration');
    
    log('📋 Testing session management...', 'yellow');
    
    // Create session
    await client.createSession('user001', { 
        userAgent: 'Stateful Demo Client',
        preferences: { theme: 'light' }
    });
    
    // Get session info
    await client.getSession();
    
    // Update session data
    await client.updateSession({ 
        lastAction: 'Updated session data',
        timestamp: new Date().toISOString()
    });
    
    // Get updated session
    await client.getSession();
}

async function demonstrateShoppingCart(client) {
    printSection('🛒 Shopping Cart Demonstration');
    
    log('📋 Testing shopping cart functionality...', 'yellow');
    
    // Start with empty cart
    await client.getCart();
    
    // Add items
    await client.addToCart('prod001', 2);
    await client.addToCart('prod002', 1);
    await client.addToCart('prod003', 3);
    
    // Check cart contents
    await client.getCart();
    
    // Remove an item
    await client.removeFromCart('prod002');
    
    // Check cart again
    await client.getCart();
    
    // Clear cart
    await client.clearCart();
}

async function demonstrateUserProfile(client) {
    printSection('👤 User Profile Demonstration');
    
    log('📋 Testing user profile operations...', 'yellow');
    
    // Get user profile
    await client.getProfile();
    
    // Update preferences
    await client.updatePreferences({
        theme: 'dark',
        language: 'en',
        notifications: true,
        currency: 'USD'
    });
    
    // Get updated profile
    await client.getProfile();
}

async function demonstrateWorkflow(client) {
    printSection('🔄 Multi-Step Workflow Demonstration');
    
    log('📋 Testing stateful workflow...', 'yellow');
    
    // Start workflow
    await client.startWorkflow();
    
    // Advance through workflow steps
    await client.nextWorkflowStep();
    await client.nextWorkflowStep();
    await client.nextWorkflowStep();
    await client.nextWorkflowStep(); // Should complete workflow
}

async function demonstrateStatefulConcepts(client) {
    printSection('🎓 Stateful Concepts Demonstration');
    
    log('📋 Demonstrating stateful behavior concepts...', 'yellow');
    
    // Demonstrate visit counting
    log('\n🔄 Calling demonstration endpoint multiple times:', 'magenta');
    await client.demonstrateStatefulBehavior();
    await client.demonstrateStatefulBehavior();
    await client.demonstrateStatefulBehavior();
    
    // Show server info with session context
    await client.getServerInfo();
}

async function runInteractiveDemo() {
    printSection('🚀 Stateful Client Interactive Demo');
    
    log('🔗 Connecting to stateful server...', 'yellow');
    const client = new StatefulClient();
    
    try {
        // Check if server is running
        await client.healthCheck();
        log('✅ Connected to stateful server!', 'green');
        
        // Run demonstrations
        await demonstrateSessionLifecycle(client);
        await demonstrateShoppingCart(client);
        await demonstrateUserProfile(client);
        await demonstrateWorkflow(client);
        await demonstrateStatefulConcepts(client);
        
        // Clean up session
        if (client.sessionId) {
            await client.deleteSession();
        }
        
        printSection('✅ Demo Complete');
        log('🎉 Stateful client demonstration completed successfully!', 'green');
        log('\n💡 Key Takeaways:', 'yellow');
        log('   • Server maintains session state across requests', 'cyan');
        log('   • Client must include Session-ID in subsequent requests', 'cyan');
        log('   • Shopping cart, preferences, and workflow state persist', 'cyan');
        log('   • Server remembers user between interactions', 'cyan');
        log('   • More complex but enables richer user experiences', 'cyan');
        
    } catch (error) {
        log('\n❌ Demo failed!', 'red');
        log('   • Make sure the stateful server is running on port 3002', 'yellow');
        log('   • Run: npm start or node server.js', 'yellow');
        log(`   • Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        log('📖 Stateful Client Demonstration', 'bright');
        log('\nUsage:', 'yellow');
        log('  node src/clients/stateful-client.js [options]', 'cyan');
        log('\nOptions:', 'yellow');
        log('  --help, -h     Show this help message', 'cyan');
        log('  --port N       Use custom port (default: 3002)', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node src/clients/stateful-client.js', 'cyan');
        log('  node src/clients/stateful-client.js --port 3002', 'cyan');
        process.exit(0);
    }
    
    const portIndex = args.indexOf('--port');
    if (portIndex !== -1 && args[portIndex + 1]) {
        const port = parseInt(args[portIndex + 1]);
        if (!isNaN(port)) {
            BASE_URL.replace(/:\d+/, `:${port}`);
        }
    }
    
    runInteractiveDemo();
}

module.exports = StatefulClient;
