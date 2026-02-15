/**
 * Mock data generation and management utilities
 * Provides sample data for both stateless and stateful server demonstrations
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MockData {
    constructor(configPath = '../config/server-config.json') {
        try {
            const configFile = path.join(__dirname, configPath);
            this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        } catch (error) {
            // Fallback to default config if file not found
            this.config = {
                mockData: {
                    users: [],
                    products: []
                }
            };
        }

        this.users = [...(this.config.mockData?.users || [])];
        this.products = [...(this.config.mockData?.products || [])];

        // Initialize sessions storage for stateful server
        this.sessions = new Map();
        this.carts = new Map();

        // Request counter for stateless server demonstration
        this.requestCount = 0;
    }

    // ========== USER MANAGEMENT ==========

    /**
     * Get all users
     */
    getAllUsers() {
        return [...this.users];
    }

    /**
     * Get user by ID
     */
    getUserById(userId) {
        return this.users.find(user => user.id === userId);
    }

    /**
     * Create a new user
     */
    createUser(userData) {
        const newUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...userData
        };

        this.users.push(newUser);
        return newUser;
    }

    /**
     * Update user
     */
    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex === -1) return null;

        this.users[userIndex] = {
            ...this.users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return this.users[userIndex];
    }

    // ========== PRODUCT MANAGEMENT ==========

    /**
     * Get all products
     */
    getAllProducts() {
        return [...this.products];
    }

    /**
     * Get product by ID
     */
    getProductById(productId) {
        return this.products.find(product => product.id === productId);
    }

    /**
     * Search products by criteria
     */
    searchProducts(criteria = {}) {
        return this.products.filter(product => {
            return Object.entries(criteria).every(([key, value]) => {
                if (key === 'minPrice') return product.price >= value;
                if (key === 'maxPrice') return product.price <= value;
                if (key === 'category') return product.category === value;
                return product[key] === value;
            });
        });
    }

    // ========== SESSION MANAGEMENT (for stateful server) ==========

    /**
     * Create a new session
     */
    createSession(userId, sessionData = {}) {
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            userId,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            data: sessionData,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);

        if (session) {
            // Update last accessed time
            session.lastAccessed = new Date().toISOString();
            this.sessions.set(sessionId, session);
        }

        return session;
    }

    /**
     * Update session data
     */
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const updatedSession = {
            ...session,
            data: {
                ...session.data,
                ...updates
            },
            lastAccessed: new Date().toISOString()
        };

        this.sessions.set(sessionId, updatedSession);
        return updatedSession;
    }

    /**
     * Delete session
     */
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = new Date();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (new Date(session.expiresAt) < now) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    // ========== SHOPPING CART MANAGEMENT (stateful example) ==========

    /**
     * Get or create cart for session
     */
    getCart(sessionId) {
        if (!this.carts.has(sessionId)) {
            this.carts.set(sessionId, {
                sessionId,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                total: 0
            });
        }

        return this.carts.get(sessionId);
    }

    /**
     * Add item to cart
     */
    addToCart(sessionId, productId, quantity = 1) {
        const cart = this.getCart(sessionId);
        const product = this.getProductById(productId);

        if (!product) {
            throw new Error(`Product ${productId} not found`);
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

        if (existingItemIndex >= 0) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                productId,
                name: product.name,
                price: product.price,
                quantity,
                addedAt: new Date().toISOString()
            });
        }

        // Recalculate total
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.updatedAt = new Date().toISOString();

        this.carts.set(sessionId, cart);
        return cart;
    }

    /**
     * Remove item from cart
     */
    removeFromCart(sessionId, productId) {
        const cart = this.getCart(sessionId);
        const initialLength = cart.items.length;

        cart.items = cart.items.filter(item => item.productId !== productId);

        if (cart.items.length !== initialLength) {
            // Recalculate total
            cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cart.updatedAt = new Date().toISOString();
            this.carts.set(sessionId, cart);
        }

        return cart;
    }

    /**
     * Clear cart
     */
    clearCart(sessionId) {
        const cart = this.getCart(sessionId);
        cart.items = [];
        cart.total = 0;
        cart.updatedAt = new Date().toISOString();
        this.carts.set(sessionId, cart);

        return cart;
    }

    // ========== STATELESS SERVER UTILITIES ==========

    /**
     * Increment and get request count (for stateless demonstration)
     */
    incrementRequestCount() {
        this.requestCount++;
        return this.requestCount;
    }

    /**
     * Get current request count
     */
    getRequestCount() {
        return this.requestCount;
    }

    /**
     * Generate random data for stateless endpoints
     */
    generateRandomData(count = 1, type = 'number') {
        const results = [];

        for (let i = 0; i < count; i++) {
            switch (type) {
                case 'number':
                    results.push(Math.random());
                    break;
                case 'string':
                    results.push(Math.random().toString(36).substring(2, 10));
                    break;
                case 'boolean':
                    results.push(Math.random() > 0.5);
                    break;
                default:
                    results.push(Math.random());
            }
        }

        return results;
    }

    /**
     * Perform stateless calculation
     */
    performCalculation(operation, values) {
        if (!Array.isArray(values) || values.length === 0) {
            throw new Error('Values must be a non-empty array');
        }

        switch (operation) {
            case 'add':
                return values.reduce((sum, val) => sum + val, 0);
            case 'subtract':
                return values.reduce((diff, val, index) =>
                    index === 0 ? val : diff - val
                );
            case 'multiply':
                return values.reduce((product, val) => product * val, 1);
            case 'average':
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
    }

    // ========== DATA EXPORT/IMPORT ==========

    /**
     * Export current data state (for debugging/transition)
     */
    exportData() {
        return {
            users: this.users,
            products: this.products,
            sessions: Array.from(this.sessions.values()),
            carts: Array.from(this.carts.values()),
            requestCount: this.requestCount,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import data (for testing/restoration)
     */
    importData(data) {
        if (data.users) this.users = data.users;
        if (data.products) this.products = data.products;
        if (data.requestCount !== undefined) this.requestCount = data.requestCount;

        // Rebuild Maps from arrays
        if (data.sessions) {
            this.sessions = new Map();
            data.sessions.forEach(session => {
                this.sessions.set(session.id, session);
            });
        }

        if (data.carts) {
            this.carts = new Map();
            data.carts.forEach(cart => {
                this.carts.set(cart.sessionId, cart);
            });
        }

        return true;
    }
}

// Create singleton instance
const mockData = new MockData();

module.exports = {
    MockData,
    mockData
};