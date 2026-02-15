#!/usr/bin/env node

/**
 * Side-by-Side Comparison Demo
 * Demonstrates the differences between stateless and stateful servers
 */

const StatelessClient = require('./stateless-client');
const StatefulClient = require('./stateful-client');

// Configuration
const STATELESS_PORT = 3001;
const STATEFUL_PORT = 3002;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
    log('\n' + '='.repeat(80), 'cyan');
    log(title, 'bright');
    log('='.repeat(80), 'cyan');
}

function printSubSection(title) {
    log('\n' + '-'.repeat(50), 'yellow');
    log(title, 'bright');
    log('-'.repeat(50), 'yellow');
}

function printComparison(statelessResult, statefulResult, description) {
    log(`\n📊 ${description}`, 'magenta');
    
    log('\n🔵 Stateless Result:', 'blue');
    log(JSON.stringify(statelessResult, null, 4), 'blue');
    
    log('\n🟢 Stateful Result:', 'green');
    log(JSON.stringify(statefulResult, null, 4), 'green');
}

// Comparison demo class
class ComparisonDemo {
    constructor() {
        this.statelessClient = new StatelessClient(`http://localhost:${STATELESS_PORT}`);
        this.statefulClient = new StatefulClient(`http://localhost:${STATEFUL_PORT}`);
    }

    async checkServers() {
        printSection('🔍 Server Health Check');
        
        try {
            log('🔵 Checking stateless server...', 'blue');
            const statelessHealth = await this.statelessClient.healthCheck();
            log('✅ Stateless server is healthy!', 'green');
            
            log('🟢 Checking stateful server...', 'green');
            const statefulHealth = await this.statefulClient.healthCheck();
            log('✅ Stateful server is healthy!', 'green');
            
            return true;
        } catch (error) {
            log('❌ Server health check failed!', 'red');
            log('   • Make sure both servers are running', 'yellow');
            log('   • Run: npm start or node server.js', 'yellow');
            log(`   • Error: ${error.message}`, 'red');
            return false;
        }
    }

    async compareBasicRequests() {
        printSection('📡 Basic Request Comparison');
        
        printSubSection('Server Information');
        
        // Stateless server info
        const statelessInfo1 = await this.statelessClient.getServerInfo();
        const statelessInfo2 = await this.statelessClient.getServerInfo();
        const statelessInfo3 = await this.statelessClient.getServerInfo();
        
        // Stateful server - create session first
        await this.statefulClient.createSession('user001', { demo: 'comparison' });
        const statefulInfo1 = await this.statefulClient.getServerInfo();
        const statefulInfo2 = await this.statefulClient.getServerInfo();
        const statefulInfo3 = await this.statefulClient.getServerInfo();
        
        log('\n🔵 Stateless Server - Multiple /info calls:', 'blue');
        log('   • Each call is independent', 'cyan');
        log('   • No memory of previous requests', 'cyan');
        log('   • Request count increments globally', 'cyan');
        
        log('\n🟢 Stateful Server - Multiple /info calls:', 'green');
        log('   • Same session context maintained', 'cyan');
        log('   • Server remembers the user', 'cyan');
        log('   • Session information persists', 'cyan');
        
        printComparison(statelessInfo3, statefulInfo3, 'Final server info comparison');
    }

    async compareCalculations() {
        printSection('🧮 Calculation Comparison');
        
        const calculations = [
            { operation: 'add', values: [1, 2, 3, 4, 5] },
            { operation: 'multiply', values: [2, 3, 4] },
            { operation: 'average', values: [10, 20, 30, 40, 50] }
        ];
        
        for (const calc of calculations) {
            printSubSection(`${calc.operation.toUpperCase()} Calculation`);
            
            const statelessResult = await this.statelessClient.performCalculation(calc.operation, calc.values);
            const statefulResult = await this.statefulClient.performCalculation(calc.operation, calc.values);
            
            log('\n🔵 Stateless Calculation:', 'blue');
            log('   • One-time calculation', 'cyan');
            log('   • No memory of previous calculations', 'cyan');
            
            log('\n🟢 Stateful Calculation:', 'green');
            log('   • Same calculation logic', 'cyan');
            log('   • Could track calculation history in session', 'cyan');
        }
    }

    async compareDataAccess() {
        printSection('📊 Data Access Comparison');
        
        printSubSection('User Data Access');
        
        // Stateless user access
        const statelessUsers = await this.statelessClient.getUsers();
        const statelessUser = await this.statelessClient.getUserById('user001');
        
        // Stateful user access (requires session)
        const statefulUsers = await this.statefulClient.getUsers();
        const statefulProfile = await this.statefulClient.getProfile();
        
        log('\n🔵 Stateless Data Access:', 'blue');
        log('   • No authentication required', 'cyan');
        log('   • Same data for all requests', 'cyan');
        log('   • No user-specific context', 'cyan');
        
        log('\n🟢 Stateful Data Access:', 'green');
        log('   • Session-based authentication', 'cyan');
        log('   • User-specific data (profile)', 'cyan');
        log('   • Personalized context', 'cyan');
        
        printComparison(statelessUser, statefulProfile, 'User data comparison');
    }

    async demonstrateStatefulFeatures() {
        printSection('🛒 Stateful-Only Features Demonstration');
        
        printSubSection('Shopping Cart Functionality');
        
        // These only work with stateful server
        await this.statefulClient.getCart(); // Empty cart
        await this.statefulClient.addToCart('prod001', 2);
        await this.statefulClient.addToCart('prod002', 1);
        const cartWithItems = await this.statefulClient.getCart();
        
        log('\n🟢 Shopping Cart (Stateful Only):', 'green');
        log('   • Maintains cart state across requests', 'cyan');
        log('   • Persistent during user session', 'cyan');
        log('   • Cannot be implemented statelessly without client-side storage', 'cyan');
        
        printSubSection('Visit Counting');
        
        // Demonstrate visit counting
        const visit1 = await this.statefulClient.demonstrateStatefulBehavior();
        const visit2 = await this.statefulClient.demonstrateStatefulBehavior();
        const visit3 = await this.statefulClient.demonstrateStatefulBehavior();
        
        log('\n🟢 Visit Counting (Stateful Only):', 'green');
        log(`   • Visit 1: Count = ${visit1.data.visitCount}`, 'cyan');
        log(`   • Visit 2: Count = ${visit2.data.visitCount}`, 'cyan');
        log(`   • Visit 3: Count = ${visit3.data.visitCount}`, 'cyan');
        log('   • Server remembers user visits', 'cyan');
        
        printSubSection('Multi-Step Workflow');
        
        await this.statefulClient.startWorkflow();
        await this.statefulClient.nextWorkflowStep();
        await this.statefulClient.nextWorkflowStep();
        const workflowResult = await this.statefulClient.nextWorkflowStep();
        
        log('\n🟢 Multi-Step Workflow (Stateful Only):', 'green');
        log('   • Maintains workflow state across requests', 'cyan');
        log('   • Tracks progress through complex processes', 'cyan');
        log('   • Enables sophisticated user interactions', 'cyan');
    }

    async demonstrateScalability() {
        printSection('📈 Scalability Comparison');
        
        log('\n🔵 Stateless Scalability:', 'blue');
        log('   ✅ Easy horizontal scaling', 'green');
        log('   ✅ No session affinity required', 'green');
        log('   ✅ Load balancer can distribute requests freely', 'green');
        log('   ✅ Server instances are interchangeable', 'green');
        log('   ✅ Better for CDNs and edge computing', 'green');
        
        log('\n🟢 Stateful Scalability:', 'green');
        log('   ⚠️  Requires session affinity (sticky sessions)', 'yellow');
        log('   ⚠️  Shared session store needed for multiple instances', 'yellow');
        log('   ⚠️  More complex deployment', 'yellow');
        log('   ✅ Enables richer user experiences', 'green');
        log('   ✅ Necessary for many business applications', 'green');
        
        log('\n💡 Hybrid Approaches:', 'yellow');
        log('   • Use stateless for public APIs', 'cyan');
        log('   • Use stateful for user-specific features', 'cyan');
        log('   • Store state client-side when possible', 'cyan');
        log('   • Use JWT tokens for stateful-like behavior', 'cyan');
    }

    async summarizeDifferences() {
        printSection('📋 Summary: Key Differences');
        
        log('\n🔵 Stateless Characteristics:', 'blue');
        log('   • Each request is independent', 'cyan');
        log('   • No server-side memory of clients', 'cyan');
        log('   • All context in request/response', 'cyan');
        log('   • Easy to scale horizontally', 'cyan');
        log('   • Simpler to debug and test', 'cyan');
        log('   • Examples: REST APIs, CDN, DNS', 'cyan');
        
        log('\n🟢 Stateful Characteristics:', 'green');
        log('   • Server maintains client state', 'cyan');
        log('   • Sessions and authentication', 'cyan');
        log('   • Rich user interactions', 'cyan');
        log('   • Shopping carts, user preferences', 'cyan');
        log('   • More complex deployment', 'cyan');
        log('   • Examples: Online banking, shopping, games', 'cyan');
        
        log('\n⚖️  When to Use Which:', 'yellow');
        log('   📱 Mobile Apps: Often stateless APIs', 'cyan');
        log('   🛒 E-commerce: Stateful for cart, stateless for catalog', 'cyan');
        log('   🌐 Content Delivery: Stateless (CDN)', 'cyan');
        log('   👥 Social Media: Stateful for user interactions', 'cyan');
        log('   🔍 Search APIs: Stateless', 'cyan');
        log('   📊 Analytics Dashboards: Stateful', 'cyan');
    }

    async cleanup() {
        printSection('🧹 Cleanup');
        
        try {
            if (this.statefulClient.sessionId) {
                await this.statefulClient.deleteSession();
                log('✅ Stateful session cleaned up', 'green');
            }
        } catch (error) {
            log('⚠️  Cleanup warning (non-critical)', 'yellow');
        }
    }

    async runFullComparison() {
        printSection('🚀 Stateless vs Stateful Comparison Demo');
        
        log('🔄 Starting comprehensive comparison...', 'yellow');
        
        try {
            // Check servers are running
            const serversHealthy = await this.checkServers();
            if (!serversHealthy) {
                return;
            }
            
            // Run comparison demonstrations
            await this.compareBasicRequests();
            await this.compareCalculations();
            await this.compareDataAccess();
            await this.demonstrateStatefulFeatures();
            await this.demonstrateScalability();
            await this.summarizeDifferences();
            
            // Cleanup
            await this.cleanup();
            
            printSection('✅ Comparison Demo Complete');
            log('🎉 Comprehensive comparison completed successfully!', 'green');
            log('\n🎓 Educational Objectives Achieved:', 'yellow');
            log('   ✅ Understanding of stateless vs stateful architectures', 'green');
            log('   ✅ Practical examples of both approaches', 'green');
            log('   ✅ Trade-offs and use case awareness', 'green');
            log('   ✅ Scalability considerations', 'green');
            
        } catch (error) {
            log('\n❌ Comparison demo failed!', 'red');
            log(`   • Error: ${error.message}`, 'red');
            process.exit(1);
        }
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        log('📖 Stateless vs Stateful Comparison Demo', 'bright');
        log('\nUsage:', 'yellow');
        log('  node src/clients/comparison-demo.js [options]', 'cyan');
        log('\nOptions:', 'yellow');
        log('  --help, -h     Show this help message', 'cyan');
        log('  --stateless N  Stateless server port (default: 3001)', 'cyan');
        log('  --stateful N   Stateful server port (default: 3002)', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node src/clients/comparison-demo.js', 'cyan');
        log('  node src/clients/comparison-demo.js --stateless 3001 --stateful 3002', 'cyan');
        process.exit(0);
    }
    
    const demo = new ComparisonDemo();
    demo.runFullComparison();
}

module.exports = ComparisonDemo;
