# API Reference Documentation

## Overview

This document provides comprehensive API documentation for both the stateless and stateful server implementations in the Phase 1 mockup.

## Base URLs

- **Stateless Server**: `http://localhost:3001`
- **Stateful Server**: `http://localhost:3002`

## General Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Content-Type` | Yes (for POST/PUT) | Request content type | `application/json` |
| `Client-ID` | Optional | Client identifier for logging | `demo-client` |
| `Session-ID` | Required for stateful endpoints | Session identifier | `abc123-def456` |

## Response Format

All responses follow a consistent format:

```json
{
  "status": "success|error",
  "message": "Human-readable message",
  "data": {
    // Response data specific to endpoint
  },
  "timestamp": "2026-02-06T09:30:00.000Z"
}
```

---

## Stateless Server Endpoints

### Health Check

**GET** `/health`

Returns server health status and basic metrics.

#### Response Example
```json
{
  "status": "success",
  "message": "Stateless server is healthy",
  "data": {
    "server": "Stateless Server",
    "status": "healthy",
    "requestCount": 42,
    "serverType": "stateless",
    "note": "I have no memory of previous requests"
  }
}
```

### Server Information

**GET** `/info`

Returns basic server information with request counting.

#### Response Example
```json
{
  "status": "success",
  "message": "Stateless server information",
  "data": {
    "server": "Stateless Mock Server v1.0",
    "timestamp": "2026-02-06T09:30:00.000Z",
    "requestCount": 42,
    "clientId": "demo-client",
    "randomValue": 0.7234,
    "message": "I have no memory of previous requests. Each request is independent.",
    "note": "This is a stateless server - I don't remember you from previous requests."
  }
}
```

### Calculation

**POST** `/calculate`

Performs mathematical operations without maintaining any state.

#### Request Body
```json
{
  "operation": "add|subtract|multiply|divide|average",
  "values": [1, 2, 3, 4, 5],
  "clientContext": "optional context data"
}
```

#### Response Example
```json
{
  "status": "success",
  "message": "Calculation successful",
  "data": {
    "operation": "add",
    "input": [1, 2, 3, 4, 5],
    "result": 15,
    "processedAt": "2026-02-06T09:30:00.000Z",
    "clientContext": null,
    "note": "Calculation complete. I won't remember this next time."
  }
}
```

#### Error Responses
- `400`: Missing or invalid parameters
- `400`: Unsupported operation
- `400`: Invalid values array

### Random Data Generation

**GET** `/random`

Generates random data of specified type and quantity.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | integer | 1 | Number of items to generate (1-10) |
| `type` | string | `number` | Type of data: `number`, `string`, `boolean` |

#### Response Example
```json
{
  "status": "success",
  "message": "Random data generated",
  "data": {
    "count": 5,
    "type": "number",
    "values": [42, 17, 89, 3, 76],
    "generatedAt": "2026-02-06T09:30:00.000Z",
    "note": "Random values are generated fresh each time with no memory of previous generations."
  }
}
```

### User Data

#### GET `/users`

Returns list of all users (same data every time).

```json
{
  "status": "success",
  "message": "Users retrieved",
  "data": {
    "users": [
      {
        "id": "user001",
        "name": "Test User 1",
        "email": "user1@example.com",
        "preferences": {
          "theme": "light",
          "language": "en"
        }
      }
    ],
    "count": 1,
    "retrievedAt": "2026-02-06T09:30:00.000Z",
    "note": "User data is retrieved fresh each time. No session or user-specific state is maintained."
  }
}
```

#### GET `/users/:id`

Returns specific user by ID.

```json
{
  "status": "success",
  "message": "User found",
  "data": {
    "user": {
      "id": "user001",
      "name": "Test User 1",
      "email": "user1@example.com",
      "preferences": {
        "theme": "light",
        "language": "en"
      }
    },
    "retrievedAt": "2026-02-06T09:30:00.000Z",
    "note": "User data retrieved. No authentication or session required - all data is in the request."
  }
}
```

### Product Data

#### GET `/products`

Returns list of products with optional filtering.

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by product category |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |

#### Response Example
```json
{
  "status": "success",
  "message": "Products retrieved",
  "data": {
    "products": [
      {
        "id": "prod001",
        "name": "Sample Product A",
        "price": 29.99,
        "category": "electronics"
      }
    ],
    "count": 1,
    "filters": {
      "category": "electronics",
      "minPrice": null,
      "maxPrice": null
    },
    "retrievedAt": "2026-02-06T09:30:00.000Z",
    "note": "Product data filtered based on query parameters. No user-specific preferences applied."
  }
}
```

### Demonstration Endpoints

#### GET `/demonstrate/stateless`

Demonstrates stateless behavior concepts.

```json
{
  "status": "success",
  "message": "Stateless behavior demonstration",
  "data": {
    "demonstration": "Stateless Server Behavior",
    "previousRequestCount": 41,
    "currentRequestCount": 42,
    "yourRequestNumber": 42,
    "timestamp": "2026-02-06T09:30:00.000Z",
    "clientIdentifier": "demo-client",
    "explanation": [
      "This server is STATELESS:",
      "1. I don't remember your previous requests",
      "2. The request count is server-wide, not per-client",
      "3. Each request contains all necessary information",
      "4. No sessions, no authentication state",
      "5. Easily scalable - any instance can handle any request"
    ]
  }
}
```

#### GET `/compare/stateful`

Provides comparison between stateless and stateful architectures.

```json
{
  "status": "success",
  "message": "Architecture comparison",
  "data": {
    "comparison": "Stateless vs Stateful",
    "statelessCharacteristics": [
      "No memory between requests",
      "Each request is independent",
      "All data in request/response",
      "Easily scalable horizontally",
      "No session management needed"
    ],
    "statefulCharacteristics": [
      "Maintains client state",
      "Requires session management",
      "Client context preserved",
      "Scaling requires sticky sessions or shared storage",
      "Examples: Shopping carts, user sessions, real-time games"
    ]
  }
}
```

---

## Stateful Server Endpoints

### Health Check

**GET** `/health`

Returns server health status with session metrics.

#### Response Example
```json
{
  "status": "success",
  "message": "Stateful server is healthy",
  "data": {
    "server": "Stateful Server",
    "status": "healthy",
    "activeSessions": 3,
    "activeCarts": 1,
    "serverType": "stateful",
    "note": "I maintain client state across requests"
  }
}
```

### Session Management

#### POST `/session`

Creates a new user session.

#### Request Body
```json
{
  "userId": "user001",
  "data": {
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  }
}
```

#### Response Example
```json
{
  "status": "success",
  "message": "Session created successfully",
  "data": {
    "session": {
      "id": "abc123-def456-ghi789",
      "userId": "user001",
      "createdAt": "2026-02-06T09:30:00.000Z",
      "expiresAt": "2026-02-06T09:45:00.000Z"
    },
    "user": {
      "id": "user001",
      "name": "Test User 1",
      "email": "user1@example.com"
    },
    "note": "Session created. Include Session-ID header in subsequent requests to maintain state."
  }
}
```

#### GET `/session`

Retrieves current session information.

**Headers**: `Session-ID` required

#### Response Example
```json
{
  "status": "success",
  "message": "Session information",
  "data": {
    "session": {
      "id": "abc123-def456-ghi789",
      "userId": "user001",
      "createdAt": "2026-02-06T09:30:00.000Z",
      "lastAccessed": "2026-02-06T09:32:00.000Z",
      "expiresAt": "2026-02-06T09:45:00.000Z",
      "data": {
        "preferences": {
          "theme": "dark",
          "language": "en"
        }
      }
    },
    "note": "Session retrieved. This server remembers your session across requests."
  }
}
```

#### PUT `/session`

Updates session data.

**Headers**: `Session-ID` required

#### Request Body
```json
{
  "data": {
    "lastAction": "Updated preferences",
    "timestamp": "2026-02-06T09:30:00.000Z"
  }
}
```

#### DELETE `/session`

Terminates current session (logout).

**Headers**: `Session-ID` required

### Shopping Cart Management

#### GET `/cart`

Retrieves current shopping cart contents.

**Headers**: `Session-ID` required

#### Response Example
```json
{
  "status": "success",
  "message": "Cart retrieved",
  "data": {
    "cart": {
      "sessionId": "abc123-def456-ghi789",
      "items": [
        {
          "productId": "prod001",
          "name": "Sample Product A",
          "price": 29.99,
          "quantity": 2,
          "subtotal": 59.98
        }
      ],
      "total": 59.98,
      "itemCount": 2,
      "createdAt": "2026-02-06T09:30:00.000Z",
      "updatedAt": "2026-02-06T09:32:00.000Z"
    },
    "note": "Shopping cart retrieved. This is a stateful feature - the server remembers your cart across requests."
  }
}
```

#### POST `/cart/add`

Adds item to shopping cart.

**Headers**: `Session-ID` required

#### Request Body
```json
{
  "productId": "prod001",
  "quantity": 2
}
```

#### DELETE `/cart/remove/:productId`

Removes specific item from cart.

**Headers**: `Session-ID` required

#### DELETE `/cart`

Clears entire cart.

**Headers**: `Session-ID` required

### User Profile Management

#### GET `/profile`

Retrieves user profile information.

**Headers**: `Session-ID` required

#### Response Example
```json
{
  "status": "success",
  "message": "User profile",
  "data": {
    "profile": {
      "id": "user001",
      "name": "Test User 1",
      "email": "user1@example.com",
      "preferences": {
        "theme": "light",
        "language": "en",
        "notifications": true
      },
      "createdAt": "2026-02-06T09:30:00.000Z",
      "updatedAt": "2026-02-06T09:32:00.000Z"
    },
    "note": "User profile retrieved. Authentication via session ensures you only see your own data."
  }
}
```

#### PUT `/profile/preferences`

Updates user preferences.

**Headers**: `Session-ID` required

#### Request Body
```json
{
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications": true,
    "currency": "USD"
  }
}
```

### Demonstration Endpoints

#### GET `/demonstrate/stateful`

Demonstrates stateful behavior with visit counting.

**Headers**: `Session-ID` required

#### Response Example
```json
{
  "status": "success",
  "message": "Stateful behavior demonstration",
  "data": {
    "demonstration": "Stateful Server Behavior",
    "sessionInfo": {
      "sessionId": "abc123-def456-ghi789",
      "userId": "user001",
      "sessionCreated": "2026-02-06T09:30:00.000Z",
      "sessionAge": "120 seconds"
    },
    "visitCount": 3,
    "timestamp": "2026-02-06T09:32:00.000Z",
    "explanation": [
      "This server is STATEFUL:",
      "1. I remember you! This is visit #3",
      "2. Your session ID: abc123-def456-ghi789",
      "3. I maintain your shopping cart, preferences, and visit history",
      "4. Each request builds upon previous interactions",
      "5. Server maintains client state across multiple requests",
      "6. Requires session management and storage"
    ],
    "note": "Refresh this page to see the visit count increase!"
  }
}
```

### Workflow Management

#### POST `/workflow/start`

Starts a multi-step workflow process.

**Headers**: `Session-ID` required

#### Response Example
```json
{
  "status": "success",
  "message": "Workflow started",
  "data": {
    "workflowId": "workflow_1644142200000",
    "currentStep": "started",
    "nextStep": "data_collected",
    "message": "Workflow started. Proceed to /workflow/next to continue.",
    "note": "This demonstrates stateful multi-step processes where server maintains workflow state."
  }
}
```

#### POST `/workflow/next`

Advances workflow to next step.

**Headers**: `Session-ID` required

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "operation",
      "message": "Operation is required"
    }
  ],
  "timestamp": "2026-02-06T09:30:00.000Z"
}
```

#### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Valid session required",
  "timestamp": "2026-02-06T09:30:00.000Z"
}
```

#### 404 Not Found
```json
{
  "status": "error",
  "message": "User not found",
  "timestamp": "2026-02-06T09:30:00.000Z"
}
```

#### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "timestamp": "2026-02-06T09:30:00.000Z"
}
```

---

## Usage Examples

### Stateless Usage

```bash
# Health check
curl http://localhost:3001/health

# Calculate sum
curl -X POST http://localhost:3001/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "add", "values": [1, 2, 3]}'

# Get users
curl http://localhost:3001/users
```

### Stateful Usage

```bash
# Create session
SESSION_RESPONSE=$(curl -X POST http://localhost:3002/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "user001"}')

# Extract session ID
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.session.id')

# Get cart (requires session)
curl http://localhost:3002/cart \
  -H "Session-ID: $SESSION_ID"

# Add to cart
curl -X POST http://localhost:3002/cart/add \
  -H "Content-Type: application/json" \
  -H "Session-ID: $SESSION_ID" \
  -d '{"productId": "prod001", "quantity": 2}'
```

---

## Key Differences Summary

| Aspect | Stateless | Stateful |
|--------|-----------|----------|
| **Session Management** | None required | Session-ID header required |
| **Memory** | No request memory | Maintains session state |
| **Authentication** | Not needed | Session-based |
| **Shopping Cart** | Not available | Persistent across requests |
| **User Preferences** | Not stored | Updated and remembered |
| **Scalability** | Easy horizontal scaling | Requires session affinity |
| **Use Cases** | Public APIs, microservices | User applications, e-commerce |

---

## Testing Tools

### HTTP File Testing
Use `examples/basic-requests.http` with VS Code REST Client extension.

### cURL Commands
Use `examples/curl-commands.txt` for command-line testing.

### Client Scripts
Run interactive demonstrations:
```bash
npm run examples:stateless
npm run examples:stateful
npm run examples:compare
```

### Unit Tests
```bash
npm test
npm run test:unit
npm run test:integration
npm run test:concepts
```

---

## OpenAPI Specification

This API reference can be exported to OpenAPI 3.0 format using:
```bash
npm run docs:generate
```

The generated specification will be saved as `docs/openapi.yaml`.
