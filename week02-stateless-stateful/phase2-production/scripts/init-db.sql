-- Database initialization script for Phase 2 production
-- This script runs automatically when PostgreSQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS phase2_production;

-- Connect to the database
\c phase2_production;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial users (for testing)
INSERT INTO users (id, name, email, preferences, is_active, created_at, updated_at) VALUES
(1, 'Test User 1', 'user1@example.com', '{"theme": "light", "notifications": true}', true, NOW(), NOW()),
(2, 'Test User 2', 'user2@example.com', '{"theme": "dark", "notifications": false}', true, NOW(), NOW()),
(3, 'Test User 3', 'user3@example.com', '{"theme": "light", "notifications": true}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create initial products (for testing)
INSERT INTO products (id, name, category, price, description, stock, is_available, created_at, updated_at) VALUES
(1, 'Laptop Pro', 'Electronics', 1299.99, 'High-performance laptop for professionals', 50, true, NOW(), NOW()),
(2, 'Wireless Mouse', 'Electronics', 29.99, 'Ergonomic wireless mouse', 200, true, NOW(), NOW()),
(3, 'Mechanical Keyboard', 'Electronics', 89.99, 'RGB mechanical keyboard', 75, true, NOW(), NOW()),
(4, 'Desk Chair', 'Furniture', 299.99, 'Ergonomic office chair', 25, true, NOW(), NOW()),
(5, 'Monitor Stand', 'Furniture', 49.99, 'Adjustable monitor stand', 100, true, NOW(), NOW()),
(6, 'USB Hub', 'Electronics', 19.99, '7-port USB hub', 150, true, NOW(), NOW()),
(7, 'Webcam HD', 'Electronics', 79.99, '1080p HD webcam', 60, true, NOW(), NOW()),
(8, 'Headphones', 'Electronics', 149.99, 'Noise-cancelling headphones', 40, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log initialization
SELECT 'Phase 2 Production Database Initialized' as status;
