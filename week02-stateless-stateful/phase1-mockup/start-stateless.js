#!/usr/bin/env node
const StatelessServer = require('./src/stateless-server');

const PORT = process.env.SERVICE_PORT || 3000;
const server = new StatelessServer({ port: PORT });
server.start(PORT);
