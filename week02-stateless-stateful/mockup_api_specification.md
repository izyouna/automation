# Phase 1 Mockup: API Specification
## Detailed Endpoints and Data Models

### 1. Server Configuration

**Base URL**: `http://localhost:3000`

**Server Modes**:
- **Stateless Mode**: Port 3001 (or `/api/stateless/*` endpoints)
- **Stateful Mode**: Port 3002 (or `/api/stateful/*` endpoints)
- **Combined Mode**: Single server with both endpoint groups (recommended)

### 2. Stateless Endpoints

#### 2.1 GET `/api/stateless/info`
**Purpose**: Demonstrate stateless behavior - same response every time

**Request**:
```http
GET /api/stateless/info HTTP/1.1
Host: localhost:3000
Client-ID: optional-client-identifier
```

**Response**:
```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z",
  "server": "Stateless Mock Server v1.0",
  "requestCount": 42,
  "message": "I have no memory of previous requests. Each request is independent.",
  "currentTime": "2024-01-15T10:30:00Z",
  "randomValue": 0.742
}
```

**Behavior**:
- No session tracking
- `requestCount` is server-wide, not per-client
- Response identical regardless of client or headers (except timestamp)
- Demonstrates idempotent behavior

#### 2.2 POST `/api/stateless/calculate`
**Purpose**: Process data without maintaining context

**Request**:
```http
POST /api/stateless/calculate HTTP/1.1
Content-Type: application/json

{
  "operation": "add",
  "values": [5, 10, 15],
  "clientContext": "optional-context-data"
}
```

**Available Operations**: `add`, `subtract`, `multiply`, `average`

**Response**:
```json
{
  "status": "success",
  "operation": "add",
  "input": [5, 10, 15],
  "result": 30,
  "processedAt": "2024-01-15T10:30:00Z",
  "note": "Calculation complete. I won't remember this next time."
}
```

**Behavior**:
- Each request must contain all necessary data
- No memory of previous calculations
- Same input always produces same output

#### 2.3 GET `/api/stateless/random`
**Purpose**: Generate random data without state

**Request**:
```http
GET /api/stateless/random?count=3 HTTP/1.1
```

**Query Parameters**:
- `count`: Number of random values (1-10, default: 1)
- `type`: `number`, `string`, `boolean` (default: `number`)

**Response**:
```json
{
  "status": "success",
  "count": 3,
  "type": "number",
  "values": [0.423, 0.891, 0.157],
  "generatedAt": "2024-01-15T10:30:00Z",
  "note": "Random values are generated fresh each time."
}
```

#### 2.4 POST `/api/stateless/shopping-cart`
**Purpose**: Demonstrate stateless shopping cart pattern

**Request**:
```http
POST /api/stateless/shopping-cart HTTP/1.1
Content-Type: application/json

{
  "action": "add",
  "cart": {
    "items": [
      {"productId": "prod1", "quantity": 2},
      {"productId": "prod2", "quantity": 1}
    ],
    "clientId": "user123",
    "cartId": "cart_abc123"
  },
  "productCatalog": [
    {"id": "prod1", "name": "Laptop", "price": 999},
    {"id": "prod2", "name": "Mouse", "price": 49}
  ]
}
```

**Actions**: `add`, `remove`, `calculate-total`, `checkout`

**Response**:
```json
{
  "status": "success",
  "action": "add",
  "cartTotal": 2047,
  "itemCount": 3,
  "processedCart": {
    "items": [
      {"productId": "prod1", "quantity": 2, "price": 999, "subtotal": 1998},
      {"productId": "prod2", "quantity": 1, "price": 49, "subtotal": 49}
    ],
    "total": 2047,
    "cartId": "cart_abc123"
  },
  "note": "Cart processed. Client must send complete cart state next time."
}
```

**Key Concept**: Client must send entire cart state with each request.

### 3. Stateful Endpoints

#### 3.1 POST `/api/stateful/sessions`
**Purpose**: Create a new session

**Request**:
```http
POST /api/stateful/sessions HTTP/1.1
Content-Type: application/json

{
  "clientId": "user123",
  "clientType": "web",
  "metadata": {
    "userAgent": "Mozilla/5.0",
    "ipAddress": "192.168.1.100"
  }
}
```

**Response**:
```json
{
  "status": "session_created",
  "sessionId": "sess_1705314600123_abc123def",
  "createdAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-01-15T10:35:00Z",
  "clientId": "user123",
  "message": "Session created. Use session-id header for subsequent requests.",
  "instructions": {
    "nextSteps": [
      "Include 'Session-ID: sess_1705314600123_abc123def' header",
      "Session will expire after 5 minutes of inactivity",
      "Use DELETE /api/stateful/sessions/{id} to end session"
    ]
  }
}
```

#### 3.2 GET `/api/stateful/sessions/{sessionId}`
**Purpose**: Get session information

**Request**:
```http
GET /api/stateful/sessions/sess_1705314600123_abc123def HTTP/1.1
Session-ID: sess_1705314600123_abc123def
```

**Response**:
```json
{
  "status": "success",
  "session": {
    "id": "sess_1705314600123_abc123def",
    "clientId": "user123",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastActivity": "2024-01-15T10:32:00Z",
    "messageCount": 5,
    "totalBytes": 2048,
    "status": "active",
    "timeUntilExpiry": 180000
  },
  "activity": [
    {
      "timestamp": "2024-01-15T10:30:30Z",
      "endpoint": "/api/stateful/sessions",
      "action": "create"
    },
    {
      "timestamp": "2024-01-15T10:31:15Z",
      "endpoint": "/api/stateful/conversation",
      "action": "message"
    }
  ]
}
```

#### 3.3 POST `/api/stateful/conversation`
**Purpose**: Add to conversation (stateful interaction)

**Request**:
```http
POST /api/stateful/conversation HTTP/1.1
Session-ID: sess_1705314600123_abc123def
Content-Type: application/json

{
  "message": "Hello, I'd like to buy a laptop",
  "type": "user_message"
}
```

**Response**:
```json
{
  "status": "success",
  "sessionId": "sess_1705314600123_abc123def",
  "messageId": "msg_1705314735000",
  "conversation": {
    "totalMessages": 6,
    "yourMessage": "Hello, I'd like to buy a laptop",
    "response": "Hello again! I remember we've exchanged 5 messages already. I can help you with laptop purchases.",
    "context": {
      "previousTopics": ["greeting", "product inquiry"],
      "messageCount": 6,
      "sessionDuration": "2 minutes 15 seconds"
    }
  },
  "note": "I remember our conversation history."
}
```

#### 3.4 POST `/api/stateful/shopping-cart`
**Purpose**: Stateful shopping cart operations

**Request**:
```http
POST /api/stateful/shopping-cart HTTP/1.1
Session-ID: sess_1705314600123_abc123def
Content-Type: application/json

{
  "action": "add",
  "productId": "prod1",
  "quantity": 1
}
```

**Available Actions**:
- `add`: Add item to cart
- `remove`: Remove item from cart
- `update`: Update quantity
- `clear`: Clear cart
- `checkout`: Process purchase

**Response**:
```json
{
  "status": "success",
  "action": "add",
  "product": {
    "id": "prod1",
    "name": "Laptop",
    "price": 999,
    "quantity": 1
  },
  "cart": {
    "sessionId": "sess_1705314600123_abc123def",
    "items": [
      {"productId": "prod1", "name": "Laptop", "price": 999, "quantity": 1}
    ],
    "itemCount": 1,
    "total": 999,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastUpdated": "2024-01-15T10:32:00Z"
  },
  "history": {
    "operations": [
      {"action": "add", "productId": "prod1", "timestamp": "2024-01-15T10:32:00Z"}
    ]
  }
}
```

**Key Concept**: Server maintains cart state; client only sends delta changes.

#### 3.5 DELETE `/api/stateful/sessions/{sessionId}`
**Purpose**: End session gracefully

**Request**:
```http
DELETE /api/stateful/sessions/sess_1705314600123_abc123def HTTP/1.1
Session-ID: sess_1705314600123_abc123def
```

**Response**:
```json
{
  "status": "session_ended",
  "sessionId": "sess_1705314600123_abc123def",
  "endedAt": "2024-01-15T10:33:00Z",
  "summary": {
    "duration": "3 minutes",
    "totalMessages": 8,
    "totalBytes": 4096,
    "cartFinalized": true
  },
  "message": "Session ended successfully. All session data has been cleared."
}
```

### 4. Comparison Endpoints

#### 4.1 GET `/api/compare/behavior`
**Purpose**: Side-by-side comparison of stateless vs stateful

**Request**:
```http
GET /api/compare/behavior HTTP/1.1
```

**Response**:
```json
{
  "comparison": {
    "stateless": {
      "description": "No memory between requests",
      "characteristics": [
        "Each request independent",
        "No session tracking",
        "Client sends all data",
        "Easy to scale horizontally",
        "Server restart has no client impact"
      ],
      "example": {
        "request": "GET /api/stateless/info",
        "response": "Always identical (except timestamp)"
      }
    },
    "stateful": {
      "description": "Maintains conversation state",
      "characteristics": [
        "Session establishment required",
        "Server remembers client context",
        "Client sends minimal data",
        "Harder to scale",
        "Server restart loses all sessions"
      ],
      "example": {
        "request": "GET /api/stateful/session/{id}",
        "response": "Includes conversation history"
      }
    }
  }
}
```

### 5. Mock Data Models

#### 5.1 Product Catalog
```javascript
const productCatalog = [
  {
    id: "prod1",
    name: "Laptop",
    description: "High-performance laptop",
    price: 999.99,
    category: "electronics",
    stock: 10,
    attributes: {
      brand: "TechBrand",
      model: "X1 Carbon",
      warranty: "2 years"
    }
  },
  {
    id: "prod2",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse",
    price: 49.99,
    category: "accessories",
    stock: 50,
    attributes: {
      brand: "PeriTech",
      connectivity: "Bluetooth 5.0",
      battery: "Rechargeable"
    }
  },
  {
    id: "prod3",
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard",
    price: 129.99,
    category: "accessories",
    stock: 25,
    attributes: {
      brand: "KeyMaster",
      switches: "Cherry MX Red",
      backlight: "RGB"
    }
  }
];
```

#### 5.2 User Profiles
```javascript
const userProfiles = [
  {
    id: "user1",
    username: "alice",
    email: "alice@example.com",
    role: "admin",
    preferences: {
      theme: "dark",
      language: "en",
      notifications: true
    },
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "user2",
    username: "bob",
    email: "bob@example.com",
    role: "user",
    preferences: {
      theme: "light",
      language: "en",
      notifications: false
    },
    createdAt: "2024-01-02T00:00:00Z"
  }
];
```

#### 5.3 Session Data Structure
```javascript
class Session {
  constructor(clientId) {
    this.id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.clientId = clientId;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.status = "active"; // active, idle, expired, closed
    this.messageCount = 0;
    this.totalBytes = 0;
    this.conversation = [];
    this.shoppingCart = {
      items: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    this.metadata = {
      userAgent: "",
      ipAddress: "",
      clientType: "unknown"
    };
  }
}
```

### 6. Error Responses

#### 6.1 Common Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "additional error details",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "suggestion": "Suggested action to resolve"
  }
}
```

#### 6.2 Specific Error Codes
- `NO_SESSION`: Session ID required but not provided
- `INVALID_SESSION`: Session ID not found or expired
- `MISSING_DATA`: Required request data missing
- `INVALID_OPERATION`: Requested operation not supported
- `SESSION_TIMEOUT`: Session expired due to inactivity
- `SERVER_ERROR`: Internal server error

### 7. Demonstration Scenarios with cURL Examples

#### 7.1 Stateless Demonstration
```bash
# Make multiple independent requests
curl -X GET http://localhost:3000/api/stateless/info
curl -X GET http://localhost:3000/api/stateless/info
curl -X GET http://localhost:3000/api/stateless/info

# Each response is identical (except timestamp)
# Demonstrates no memory between requests
```

#### 7.2 Stateful Demonstration
```bash
# 1. Create session
SESSION_ID=$(curl -X POST http://localhost:3000/api/stateful/sessions \
  -H "Content-Type: application/json" \
  -d '{"clientId": "demo-user"}' | jq -r '.sessionId')

# 2. Use session in conversation
curl -X POST http://localhost:3000/api/stateful/conversation \
  -H "Session-ID: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# 3. Check session state
curl -X GET http://localhost:3000/api/stateful/sessions/$SESSION_ID

# 4. Add to shopping cart
curl -X POST http://localhost:3000/api/stateful/shopping-cart \
  -H "Session-ID: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"action": "add", "productId": "prod1", "quantity": 1}'

# 5. End session
curl -X DELETE http://localhost:3000/api/stateful/sessions/$SESSION_ID
```

#### 7.3 Comparison Demonstration
```bash
# Run side-by-side comparison
./scripts/compare-stateless-stateful.sh

# Expected output shows:
# - Stateless: Same response every time
# - Stateful: Responses build on previous interactions
```

### 8. Performance Characteristics to Monitor

#### 8.1 Stateless Metrics
- Request latency (should be consistent)
- Memory usage (should not grow with requests)
- Throughput (requests per second)
- Error rate under load

#### 8.2 Stateful Metrics
- Session creation time
- Memory growth with active sessions
- Session cleanup efficiency
- Impact of session timeouts
- Memory leak detection

### 9. Testing Data

#### 9.1 Test Users
```json
{
  "testUsers": [
    {"id": "test1", "name": "Test User 1", "role": "user"},
    {"id": "test2", "name": "Test User 2", "role": "admin"},
    {"id": "test3", "name": "Test User 3", "role": "user"}
  ]
}
```

#### 9.2 Test Products
```json
{
  "testProducts": [
    {"id": "test-prod-1", "name": "Test Product A", "price": 100},
    {"id": "test-prod-2", "name": "Test Product B", "price": 200},
    {"id": "test-prod-3", "name": "Test Product C", "price": 300}
  ]
}
```

### 10. Next Steps for Implementation

1. **Implement server scaffolding** with Express.js
2. **Create stateless endpoints** first (simpler)
3. **Implement stateful session management**
4. **Add mock data models**
5. **Create demonstration clients**
6. **Write comprehensive tests**
7. **Document API and concepts**
8. **Create comparison examples**

This specification provides a complete blueprint for implementing the Phase 1 mockup with clear endpoints, data models, and demonstration scenarios that effectively illustrate the differences between stateless and stateful server architectures.
