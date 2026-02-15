#!/usr/bin/env node

/**
 * Main Server Entry Point
 * Runs both stateless and stateful servers simultaneously for demonstration
 */

const path = require('path');
const fs = require('fs');

// Import server classes
const StatelessServer = require('./src/stateless-server');
const StatefulServer = require('./src/stateful-server');

// Configuration
const config = require('./config/server-config.json');

// Extract server configurations
const statelessConfig = {
    ...config.stateless,
    port: config.ports.stateless
};

const statefulConfig = {
    ...config.stateful,
    port: config.ports.stateful
};

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

function printBanner() {
    log('\n' + '='.repeat(80), 'cyan');
    log('🚀 Stateless vs Stateful Server Demonstration', 'bright');
    log('   Phase 1 Mockup Implementation', 'cyan');
    log('='.repeat(80) + '\n', 'cyan');
}

function printServerInfo() {
    log('📡 Server Information:', 'yellow');
    log(`   • Stateless Server: http://localhost:${config.ports.stateless}`, 'green');
    log(`   • Stateful Server:  http://localhost:${config.ports.stateful}`, 'green');
    log(`   • Health Checks:`, 'yellow');
    log(`     - Stateless: http://localhost:${config.ports.stateless}/health`, 'blue');
    log(`     - Stateful:  http://localhost:${config.ports.stateful}/health`, 'blue');
    log('\n📚 Quick Test Commands:', 'yellow');
    log(`   curl http://localhost:${config.ports.stateless}/health`, 'blue');
    log(`   curl http://localhost:${config.ports.stateful}/health`, 'blue');
    log('\n🔧 Development Mode:', 'yellow');
    log('   • Use npm run dev for auto-restart on file changes', 'cyan');
    log('   • Use npm test to run the test suite', 'cyan');
    log('\n⚠️  Press Ctrl+C to stop both servers\n', 'yellow');
}

async function startServers() {
    printBanner();
    
    const statelessServer = new StatelessServer(statelessConfig);
    const statefulServer = new StatefulServer(statefulConfig);

    try {
        // Start both servers
        log('🔄 Starting servers...', 'yellow');
        
        const [statelessInstance, statefulInstance] = await Promise.all([
            statelessServer.start(config.ports.stateless),
            statefulServer.start(config.ports.stateful)
        ]);

        log('✅ Both servers started successfully!', 'green');
        printServerInfo();

        // Handle graceful shutdown
        const shutdown = async (signal) => {
            log(`\n📴 Received ${signal}. Shutting down servers...`, 'yellow');
            
            try {
                await Promise.all([
                    statelessServer.stop(),
                    statefulServer.stop()
                ]);
                log('✅ All servers stopped gracefully', 'green');
                process.exit(0);
            } catch (error) {
                log(`❌ Error during shutdown: ${error.message}`, 'red');
                process.exit(1);
            }
        };

        // Register shutdown handlers
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            log(`❌ Uncaught Exception: ${error.message}`, 'red');
            log(error.stack, 'red');
            shutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            log(`❌ Unhandled Rejection at: ${promise}`, 'red');
            log(`   Reason: ${reason}`, 'red');
            shutdown('unhandledRejection');
        });

    } catch (error) {
        log(`❌ Failed to start servers: ${error.message}`, 'red');
        log('   • Check if ports are already in use', 'yellow');
        log('   • Verify configuration in config/server-config.json', 'yellow');
        process.exit(1);
    }
}

// Check if config file exists
if (!fs.existsSync('./config/server-config.json')) {
    log('❌ Configuration file not found: config/server-config.json', 'red');
    log('   • Please ensure the configuration file exists before starting', 'yellow');
    process.exit(1);
}

// Start the servers
if (require.main === module) {
    startServers();
}

module.exports = {
    startServers,
    StatelessServer,
    StatefulServer
};
