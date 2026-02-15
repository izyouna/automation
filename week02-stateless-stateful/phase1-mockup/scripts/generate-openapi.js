#!/usr/bin/env node

/**
 * OpenAPI/Swagger Specification Generator
 * Generates OpenAPI 3.0 specification from server implementations
 */

const fs = require('fs');
const path = require('path');

// OpenAPI 3.0 specification template
const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Stateless vs Stateful Server API',
        description: 'Phase 1 mockup implementation demonstrating stateless and stateful server architectures',
        version: '1.0.0',
        contact: {
            name: 'Network Assignment Project',
            email: 'project@example.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Stateless Server'
        },
        {
            url: 'http://localhost:3002',
            description: 'Stateful Server'
        }
    ],
    tags: [
        {
            name: 'stateless',
            description: 'Stateless server endpoints'
        },
        {
            name: 'stateful',
            description: 'Stateful server endpoints'
        },
        {
            name: 'session',
            description: 'Session management'
        },
        {
            name: 'cart',
            description: 'Shopping cart operations'
        },
        {
            name: 'demo',
            description: 'Demonstration endpoints'
        }
    ],
    paths: {},
    components: {
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['error'],
                        example: 'error'
                    },
                    message: {
                        type: 'string',
                        example: 'An error occurred'
                    },
                    errors: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/ValidationError'
                        }
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-02-06T09:30:00.000Z'
                    }
                },
                required: ['status', 'message', 'timestamp']
            },
            ValidationError: {
                type: 'object',
                properties: {
                    field: {
                        type: 'string',
                        example: 'operation'
                    },
                    message: {
                        type: 'string',
                        example: 'Operation is required'
                    }
                },
                required: ['field', 'message']
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['success'],
                        example: 'success'
                    },
                    message: {
                        type: 'string',
                        example: 'Operation successful'
                    },
                    data: {
                        type: 'object',
                        description: 'Response data specific to endpoint'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-02-06T09:30:00.000Z'
                    }
                },
                required: ['status', 'message', 'timestamp']
            },
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'user001',
                        description: 'Unique user identifier'
                    },
                    name: {
                        type: 'string',
                        example: 'Test User 1',
                        description: 'User display name'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'user1@example.com',
                        description: 'User email address'
                    },
                    preferences: {
                        $ref: '#/components/schemas/UserPreferences'
                    }
                },
                required: ['id', 'name', 'email']
            },
            UserPreferences: {
                type: 'object',
                properties: {
                    theme: {
                        type: 'string',
                        enum: ['light', 'dark'],
                        example: 'light'
                    },
                    language: {
                        type: 'string',
                        example: 'en'
                    },
                    notifications: {
                        type: 'boolean',
                        example: true
                    },
                    currency: {
                        type: 'string',
                        example: 'USD'
                    }
                }
            },
            Product: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'prod001',
                        description: 'Unique product identifier'
                    },
                    name: {
                        type: 'string',
                        example: 'Sample Product A',
                        description: 'Product display name'
                    },
                    price: {
                        type: 'number',
                        format: 'float',
                        example: 29.99,
                        description: 'Product price'
                    },
                    category: {
                        type: 'string',
                        example: 'electronics',
                        description: 'Product category'
                    }
                },
                required: ['id', 'name', 'price', 'category']
            },
            CartItem: {
                type: 'object',
                properties: {
                    productId: {
                        type: 'string',
                        example: 'prod001'
                    },
                    name: {
                        type: 'string',
                        example: 'Sample Product A'
                    },
                    price: {
                        type: 'number',
                        format: 'float',
                        example: 29.99
                    },
                    quantity: {
                        type: 'integer',
                        minimum: 1,
                        example: 2
                    },
                    subtotal: {
                        type: 'number',
                        format: 'float',
                        example: 59.98
                    }
                },
                required: ['productId', 'name', 'price', 'quantity', 'subtotal']
            },
            Cart: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        example: 'abc123-def456-ghi789'
                    },
                    items: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/CartItem'
                        }
                    },
                    total: {
                        type: 'number',
                        format: 'float',
                        example: 59.98
                    },
                    itemCount: {
                        type: 'integer',
                        minimum: 0,
                        example: 2
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                required: ['sessionId', 'items', 'total', 'itemCount']
            },
            Session: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'abc123-def456-ghi789',
                        description: 'Unique session identifier'
                    },
                    userId: {
                        type: 'string',
                        example: 'user001',
                        description: 'User ID this session belongs to'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Session creation timestamp'
                    },
                    lastAccessed: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last access timestamp'
                    },
                    expiresAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Session expiration timestamp'
                    },
                    data: {
                        type: 'object',
                        description: 'Custom session data'
                    }
                },
                required: ['id', 'userId', 'createdAt', 'expiresAt']
            },
            CalculationRequest: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['add', 'subtract', 'multiply', 'divide', 'average'],
                        example: 'add',
                        description: 'Mathematical operation to perform'
                    },
                    values: {
                        type: 'array',
                        items: {
                            type: 'number'
                        },
                        minItems: 1,
                        example: [1, 2, 3, 4, 5],
                        description: 'Array of numbers to operate on'
                    },
                    clientContext: {
                        type: 'object',
                        description: 'Optional client context data'
                    }
                },
                required: ['operation', 'values']
            },
            SessionCreateRequest: {
                type: 'object',
                properties: {
                    userId: {
                        type: 'string',
                        example: 'user001',
                        description: 'User ID to create session for'
                    },
                    data: {
                        type: 'object',
                        description: 'Initial session data'
                    }
                },
                required: ['userId']
            },
            CartAddRequest: {
                type: 'object',
                properties: {
                    productId: {
                        type: 'string',
                        example: 'prod001',
                        description: 'Product ID to add to cart'
                    },
                    quantity: {
                        type: 'integer',
                        minimum: 1,
                        default: 1,
                        example: 2,
                        description: 'Quantity of product to add'
                    }
                },
                required: ['productId']
            },
            PreferencesUpdateRequest: {
                type: 'object',
                properties: {
                    preferences: {
                        $ref: '#/components/schemas/UserPreferences'
                    }
                },
                required: ['preferences']
            }
        },
        parameters: {
            ClientId: {
                name: 'Client-ID',
                in: 'header',
                description: 'Client identifier for logging',
                schema: {
                    type: 'string'
                },
                example: 'demo-client'
            },
            SessionId: {
                name: 'Session-ID',
                in: 'header',
                description: 'Session identifier for stateful endpoints',
                schema: {
                    type: 'string'
                },
                example: 'abc123-def456-ghi789'
            },
            UserId: {
                name: 'id',
                in: 'path',
                description: 'User identifier',
                required: true,
                schema: {
                    type: 'string'
                },
                example: 'user001'
            },
            ProductId: {
                name: 'productId',
                in: 'path',
                description: 'Product identifier',
                required: true,
                schema: {
                    type: 'string'
                },
                example: 'prod001'
            },
            RandomCount: {
                name: 'count',
                in: 'query',
                description: 'Number of random items to generate',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 10,
                    default: 1
                },
                example: 5
            },
            RandomType: {
                name: 'type',
                in: 'query',
                description: 'Type of random data to generate',
                schema: {
                    type: 'string',
                    enum: ['number', 'string', 'boolean'],
                    default: 'number'
                },
                example: 'number'
            },
            ProductCategory: {
                name: 'category',
                in: 'query',
                description: 'Filter products by category',
                schema: {
                    type: 'string'
                },
                example: 'electronics'
            },
            MinPrice: {
                name: 'minPrice',
                in: 'query',
                description: 'Minimum price filter',
                schema: {
                    type: 'number',
                    minimum: 0
                },
                example: 15
            },
            MaxPrice: {
                name: 'maxPrice',
                in: 'query',
                description: 'Maximum price filter',
                schema: {
                    type: 'number',
                    minimum: 0
                },
                example: 25
            }
        },
        responses: {
            Success: {
                description: 'Successful operation',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/SuccessResponse'
                        }
                    }
                }
            },
            BadRequest: {
                description: 'Bad request - validation error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            Unauthorized: {
                description: 'Unauthorized - session required',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            InternalServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            }
        }
    }
};

// Add paths for stateless endpoints
function addStatelessPaths() {
    const paths = openApiSpec.paths;

    // Health check
    paths['/health'] = {
        get: {
            tags: ['stateless'],
            summary: 'Health check',
            description: 'Returns server health status and basic metrics',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };

    // Server info
    paths['/info'] = {
        get: {
            tags: ['stateless'],
            summary: 'Server information',
            description: 'Returns basic server information with request counting',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };

    // Calculation
    paths['/calculate'] = {
        post: {
            tags: ['stateless'],
            summary: 'Perform calculation',
            description: 'Performs mathematical operations without maintaining any state',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            requestBody: {
                description: 'Calculation request',
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CalculationRequest' }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' }
            }
        }
    };

    // Random data
    paths['/random'] = {
        get: {
            tags: ['stateless'],
            summary: 'Generate random data',
            description: 'Generates random data of specified type and quantity',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/RandomCount' },
                { $ref: '#/components/parameters/RandomType' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' }
            }
        }
    };

    // Users
    paths['/users'] = {
        get: {
            tags: ['stateless'],
            summary: 'Get all users',
            description: 'Returns list of all users (same data every time)',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };

    paths['/users/{id}'] = {
        get: {
            tags: ['stateless'],
            summary: 'Get user by ID',
            description: 'Returns specific user by ID',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/UserId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '404': { $ref: '#/components/responses/NotFound' }
            }
        }
    };

    // Products
    paths['/products'] = {
        get: {
            tags: ['stateless'],
            summary: 'Get products',
            description: 'Returns list of products with optional filtering',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/ProductCategory' },
                { $ref: '#/components/parameters/MinPrice' },
                { $ref: '#/components/parameters/MaxPrice' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };

    // Demonstration endpoints
    paths['/demonstrate/stateless'] = {
        get: {
            tags: ['demo', 'stateless'],
            summary: 'Demonstrate stateless behavior',
            description: 'Demonstrates stateless behavior concepts',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };

    paths['/compare/stateful'] = {
        get: {
            tags: ['demo', 'stateless'],
            summary: 'Compare with stateful',
            description: 'Provides comparison between stateless and stateful architectures',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };
}

// Add paths for stateful endpoints
function addStatefulPaths() {
    const paths = openApiSpec.paths;

    // Health check (stateful version)
    paths['/health'] = {
        get: {
            tags: ['stateful'],
            summary: 'Health check',
            description: 'Returns server health status with session metrics',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' }
            }
        }
    };

    // Session management
    paths['/session'] = {
        post: {
            tags: ['session', 'stateful'],
            summary: 'Create session',
            description: 'Creates a new user session',
            parameters: [
                { $ref: '#/components/parameters/ClientId' }
            ],
            requestBody: {
                description: 'Session creation request',
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SessionCreateRequest' }
                    }
                }
            },
            responses: {
                '201': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' },
                '404': { $ref: '#/components/responses/NotFound' }
            }
        },
        get: {
            tags: ['session', 'stateful'],
            summary: 'Get session',
            description: 'Retrieves current session information',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        },
        put: {
            tags: ['session', 'stateful'],
            summary: 'Update session',
            description: 'Updates session data',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            requestBody: {
                description: 'Session update request',
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                data: {
                                    type: 'object',
                                    description: 'Session data to update'
                                }
                            },
                            required: ['data']
                        }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '400': { $ref: '#/components/responses/BadRequest' }
            }
        },
        delete: {
            tags: ['session', 'stateful'],
            summary: 'Delete session',
            description: 'Terminates current session (logout)',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };

    // Shopping cart
    paths['/cart'] = {
        get: {
            tags: ['cart', 'stateful'],
            summary: 'Get cart',
            description: 'Retrieves current shopping cart contents',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        },
        post: {
            tags: ['cart', 'stateful'],
            summary: 'Add to cart',
            description: 'Adds item to shopping cart',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            requestBody: {
                description: 'Add to cart request',
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CartAddRequest' }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '400': { $ref: '#/components/responses/BadRequest' }
            }
        },
        delete: {
            tags: ['cart', 'stateful'],
            summary: 'Clear cart',
            description: 'Clears entire cart',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };

    paths['/cart/remove/{productId}'] = {
        delete: {
            tags: ['cart', 'stateful'],
            summary: 'Remove from cart',
            description: 'Removes specific item from cart',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' },
                { $ref: '#/components/parameters/ProductId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };

    // User profile
    paths['/profile'] = {
        get: {
            tags: ['stateful'],
            summary: 'Get profile',
            description: 'Retrieves user profile information',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };

    paths['/profile/preferences'] = {
        put: {
            tags: ['stateful'],
            summary: 'Update preferences',
            description: 'Updates user preferences',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            requestBody: {
                description: 'Preferences update request',
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/PreferencesUpdateRequest' }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '400': { $ref: '#/components/responses/BadRequest' }
            }
        }
    };

    // Demonstration endpoint
    paths['/demonstrate/stateful'] = {
        get: {
            tags: ['demo', 'stateful'],
            summary: 'Demonstrate stateful behavior',
            description: 'Demonstrates stateful behavior with visit counting',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };

    // Workflow management
    paths['/workflow/start'] = {
        post: {
            tags: ['demo', 'stateful'],
            summary: 'Start workflow',
            description: 'Starts a multi-step workflow process',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };

    paths['/workflow/next'] = {
        post: {
            tags: ['demo', 'stateful'],
            summary: 'Next workflow step',
            description: 'Advances workflow to next step',
            parameters: [
                { $ref: '#/components/parameters/ClientId' },
                { $ref: '#/components/parameters/SessionId' }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' }
            }
        }
    };
}

// Generate the complete specification
function generateSpecification() {
    addStatelessPaths();
    addStatefulPaths();
    return openApiSpec;
}

// Write specification to file
function writeSpecification(spec, outputPath) {
    const yaml = require('js-yaml');
    
    try {
        const yamlContent = yaml.dump(spec, {
            indent: 2,
            lineWidth: 120,
            noRefs: true
        });
        
        fs.writeFileSync(outputPath, yamlContent, 'utf8');
        console.log(`✅ OpenAPI specification generated: ${outputPath}`);
        
        // Also generate JSON version
        const jsonPath = outputPath.replace('.yaml', '.json');
        fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf8');
        console.log(`✅ OpenAPI JSON specification generated: ${jsonPath}`);
        
    } catch (error) {
        console.error('❌ Error generating OpenAPI specification:', error.message);
        process.exit(1);
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const outputPath = args[0] || './docs/openapi.yaml';
    
    console.log('🔧 Generating OpenAPI specification...');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const spec = generateSpecification();
    writeSpecification(spec, path.resolve(outputPath));
    
    console.log('\n📊 Specification Statistics:');
    console.log(`   • Total paths: ${Object.keys(spec.paths).length}`);
    console.log(`   • Components: ${Object.keys(spec.components.schemas).length} schemas`);
    console.log(`   • Parameters: ${Object.keys(spec.components.parameters).length} parameters`);
    console.log(`   • Responses: ${Object.keys(spec.components.responses).length} response templates`);
    
    console.log('\n🚀 Next steps:');
    console.log('   • Import into Swagger UI: https://swagger.io/tools/swagger-ui/');
    console.log('   • Use with Postman: Import the YAML file');
    console.log('   • Generate client SDKs: https://openapi-generator.tech/');
}

if (require.main === module) {
    main();
}

module.exports = {
    generateSpecification,
    writeSpecification
};
