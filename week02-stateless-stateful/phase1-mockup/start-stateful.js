#!/usr/bin/env node
const StatefulServer = require('./src/stateful-server');

const PORT = process.env.SERVICE_PORT || 3001;
const server = new StatefulServer({ port: PORT });
server.start(PORT);
