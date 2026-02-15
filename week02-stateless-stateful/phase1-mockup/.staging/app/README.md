# Phase 1 Mockup: Stateless vs Stateful Server Demonstration

## Overview

This is the Phase 1 mockup implementation for the stateless vs stateful server network assignment. This lightweight, runnable mockup demonstrates core concepts of stateless vs stateful server interactions through HTTP-based examples.

### Purpose
- Validate architectural concepts before committing to full Docker/Ubuntu/Nginx implementation
- Provide clear, educational examples of stateless vs stateful patterns
- Create a foundation for Phase 2 production implementation

### Key Principles
- **Simplicity**: Minimal dependencies, easy to run locally
- **Clarity**: Clear demonstration of stateless vs stateful differences
- **Educational**: Focus on concepts over production-ready code
- **Transition-ready**: Clear path to Phase 2 implementation

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation
```bash
cd week02-stateless-stateful/phase1-mockup
npm install
```

### Running the Server
```bash
# Start both stateless and stateful servers
npm start

# Or start in development mode with auto-reload
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Server Endpoints

### Stateless Server (Port 3001)
- **GET** `/api/stateless/info` - Basic server information
- **POST** `/api/stateless/calculate` - Process calculations without state
- **GET** `/api/stateless/random` - Generate random values
- **GET** `/api/stateless/health` - Health check endpoint

### Stateful Server (Port 3002)
- **GET** `/api/stateful/info` - Server information with session tracking
- **POST** `/api/stateful/session` - Create or update session
- **GET** `/api/stateful/session/:id` - Retrieve session data
- **POST** `/api/stateful/cart/add` - Add item to shopping cart (stateful example)
- **GET** `/api/stateful/cart` - View current cart contents
- **GET** `/api/stateful/health` - Health check endpoint

### Combined Server (Port 3000)
- All stateless endpoints under `/api/stateless/*`
- All stateful endpoints under `/api/stateful/*`

## Project Structure

```
phase1-mockup/
├── README.md                          # This file
├── package.json                       # Node.js dependencies
├── server.js                          # Main server entry point
├── config/
│   └── server-config.json             # Server configuration
├── src/
│   ├── stateless-server.js            # Stateless server implementation
│   ├── stateful-server.js             # Stateful server implementation
│   ├── shared/
│   │   ├── http-helpers.js            # HTTP utility functions
│   │   ├── mock-data.js               # Mock user/data storage
│   │   └── logger.js                  # Request logging
│   └── clients/
│       ├── stateless-client.js        # Stateless client examples
│       ├── stateful-client.js         # Stateful client examples
│       └── comparison-demo.js         # Side-by-side comparison
├── examples/
│   ├── basic-requests.http            # HTTP request examples
│   ├── curl-commands.txt              # cURL examples
│   └── postman-collection.json        # Postman collection
├── tests/
│   ├── stateless.test.js              # Stateless server tests
│   ├── stateful.test.js               # Stateful server tests
│   └── integration.test.js            # Integration tests
└── docs/
    ├── concepts.md                    # Stateless vs stateful explanation
    ├── api-reference.md               # Mock API documentation
    └── transition-to-phase2.md        # Migration guide
```

## Key Concepts Demonstrated

### Stateless Server Characteristics
- No memory between requests
- Each request contains all necessary information
- Simple request/response pattern
- No session tracking
- Easily scalable horizontally

### Stateful Server Characteristics
- Maintains client state across requests
- Uses sessions to track user interactions
- Requires session management
- Enables complex multi-step interactions
- Requires sticky sessions or shared storage for scaling

## Usage Examples

### Using cURL
```bash
# Stateless request
curl http://localhost:3001/api/stateless/info

# Stateful request with session
curl -X POST http://localhost:3002/api/stateful/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "data": {"preferences": {"theme": "dark"}}}'
```

### Using the Example Clients
```bash
# Run stateless client example
node src/clients/stateless-client.js

# Run stateful client example  
node src/clients/stateful-client.js

# Run comparison demo
node src/clients/comparison-demo.js
```

## Testing Strategy

### Unit Tests
- Test individual server components
- Verify stateless behavior (no persistence)
- Verify stateful behavior (session persistence)

### Integration Tests
- Test client-server interactions
- Verify API contract compliance
- Test error handling and edge cases

### Validation Tests
- Ensure concepts are clearly demonstrated
- Verify educational examples work as expected

## Transition to Phase 2

This mockup is designed to transition smoothly to Phase 2 (Production Implementation):

1. **API Compatibility**: Phase 2 will maintain similar API endpoints
2. **Data Models**: Mock data structures map to PostgreSQL schema
3. **Session Management**: In-memory sessions map to Redis storage
4. **Configuration**: Environment-based configuration for production

See `docs/transition-to-phase2.md` for detailed migration guide.

## License

Educational use - part of network assignment project.

## Contributing

This is an educational project. Feedback and improvements are welcome through the main project repository.