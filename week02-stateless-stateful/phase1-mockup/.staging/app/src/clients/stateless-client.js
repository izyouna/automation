#!/usr/bin/env node

/**
 * Stateless Client Demonstration
 * Shows how stateless server interactions work
 */

const axios = require('axios');

// Configuration
const STATELESS_PORT = 3001;
const BASE_URL = `http://localhost:${STATELESS_PORT}`;

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

function printRequest(method, url, data = null) {
    log(`\n📤 ${method} ${url}`, 'yellow');
    if (data) {
        log(`   Body: ${JSON.stringify(data, null, 2)}`, 'blue');
    }
}

function printResponse(response) {
    log(`📥 Status: ${response.status}`, 'green');
    log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');
}

// Stateless client instance
class StatelessClient {
    constructor(baseUrl = BASE_URL) {
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'Client-ID': 'stateless-demo-client'
            }
        });
    }

    async healthCheck() {
        try {
            printRequest('GET', '/health');
            const response = await this.client.get('/health');
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Health check failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async getServerInfo() {
        try {
            printRequest('GET', '/info');
            const response = await this.client.get('/info');
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Get server info failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async performCalculation(operation, values) {
        try {
            const data = { operation, values };
            printRequest('POST', '/calculate', data);
            const response = await this.client.post('/calculate', data);
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Calculation failed: ${error.message}`, 'red');
            if (error.response) {
                log(`   Error response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
            }
            throw error;
        }
    }

    async getRandomData(count = 5, type = 'number') {
        try {
            printRequest('GET', `/random?count=${count}&type=${type}`);
            const response = await this.client.get(`/random?count=${count}&type=${type}`);
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Random data generation failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async getUsers() {
        try {
            printRequest('GET', '/users');
            const response = await this.client.get('/users');
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Get users failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async getUserById(id) {
        try {
            printRequest('GET', `/users/${id}`);
            const response = await this.client.get(`/users/${id}`);
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Get user by ID failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async getProducts(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const url = queryString ? `/products?${queryString}` : '/products';
            printRequest('GET', url);
            const response = await this.client.get(url);
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Get products failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async demonstrateStatelessBehavior() {
        try {
            printRequest('GET', '/demonstrate/stateless');
            const response = await this.client.get('/demonstrate/stateless');
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Demonstration failed: ${error.message}`, 'red');
            throw error;
        }
    }

    async compareWithStateful() {
        try {
            printRequest('GET', '/compare/stateful');
            const response = await this.client.get('/compare/stateful');
            printResponse(response);
            return response.data;
        } catch (error) {
            log(`❌ Comparison failed: ${error.message}`, 'red');
            throw error;
        }
    }
}

// Demonstration functions
async function demonstrateBasicRequests(client) {
    printSection('🔍 Basic Stateless Requests');
    
    log('📋 Testing basic server functionality...', 'yellow');
    
    // Health check
    await client.healthCheck();
    
    // Server info (multiple times to show statelessness)
    log('\n🔄 Calling /info multiple times to demonstrate statelessness:', 'magenta');
    await client.getServerInfo();
    await client.getServerInfo();
    await client.getServerInfo();
}

async function demonstrateCalculations(client) {
    printSection('🧮 Calculation Demonstrations');
    
    log('📋 Testing calculation endpoints...', 'yellow');
    
    // Different calculations
    await client.performCalculation('add', [1, 2, 3, 4, 5]);
    await client.performCalculation('multiply', [2, 3, 4]);
    await client.performCalculation('average', [10, 20, 30, 40, 50]);
    
    // Edge case
    try {
        await client.performCalculation('invalid', [1, 2, 3]);
    } catch (error) {
        log('✅ Error handling works correctly', 'green');
    }
}

async function demonstrateDataAccess(client) {
    printSection('📊 Data Access Patterns');
    
    log('📋 Testing data access endpoints...', 'yellow');
    
    // Users
    await client.getUsers();
    await client.getUserById('user001');
    
    // Products with filters
    await client.getProducts();
    await client.getProducts({ category: 'electronics' });
    await client.getProducts({ minPrice: 15, maxPrice: 25 });
    
    // Random data
    await client.getRandomData(3, 'number');
    await client.getRandomData(2, 'string');
    await client.getRandomData(4, 'boolean');
}

async function demonstrateStatelessConcepts(client) {
    printSection('🎓 Stateless Concepts Demonstration');
    
    log('📋 Demonstrating stateless behavior concepts...', 'yellow');
    
    // Demonstration endpoint
    await client.demonstrateStatelessBehavior();
    
    // Comparison with stateful
    await client.compareWithStateful();
}

async function runInteractiveDemo() {
    printSection('🚀 Stateless Client Interactive Demo');
    
    log('🔗 Connecting to stateless server...', 'yellow');
    const client = new StatelessClient();
    
    try {
        // Check if server is running
        await client.healthCheck();
        log('✅ Connected to stateless server!', 'green');
        
        // Run demonstrations
        await demonstrateBasicRequests(client);
        await demonstrateCalculations(client);
        await demonstrateDataAccess(client);
        await demonstrateStatelessConcepts(client);
        
        printSection('✅ Demo Complete');
        log('🎉 Stateless client demonstration completed successfully!', 'green');
        log('\n💡 Key Takeaways:', 'yellow');
        log('   • Each request is independent', 'cyan');
        log('   • No session memory between requests', 'cyan');
        log('   • All context must be provided in each request', 'cyan');
        log('   • Server scales easily (no session affinity needed)', 'cyan');
        log('   • Simple, predictable, and reliable', 'cyan');
        
    } catch (error) {
        log('\n❌ Demo failed!', 'red');
        log('   • Make sure the stateless server is running on port 3001', 'yellow');
        log('   • Run: npm start or node server.js', 'yellow');
        log(`   • Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        log('📖 Stateless Client Demonstration', 'bright');
        log('\nUsage:', 'yellow');
        log('  node src/clients/stateless-client.js [options]', 'cyan');
        log('\nOptions:', 'yellow');
        log('  --help, -h     Show this help message', 'cyan');
        log('  --port N       Use custom port (default: 3001)', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node src/clients/stateless-client.js', 'cyan');
        log('  node src/clients/stateless-client.js --port 3001', 'cyan');
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

module.exports = StatelessClient;
