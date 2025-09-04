-- Restaurant Database Schema
-- PostgreSQL Database Setup Instructions

-- Create database (run this command in PostgreSQL command line or pgAdmin)
-- CREATE DATABASE bella_db;

-- Connect to the database and run the following schema

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for customer and admin accounts
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- NULL for Google OAuth users
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    google_id VARCHAR(255) UNIQUE, -- For Google OAuth
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role ON users(role);

-- User sessions table for session management
CREATE TABLE user_sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX idx_session_expire ON user_sessions(expire);

-- Menu categories table
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_categories_active ON menu_categories(is_active);
CREATE INDEX idx_menu_categories_order ON menu_categories(display_order);

-- Menu items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category_id INTEGER REFERENCES menu_categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    label VARCHAR(50), -- Product label (promotion, new, sold, etc.)
    allergens TEXT[], -- Array of allergen information
    dietary_info TEXT[], -- Array of dietary information (vegan, gluten-free, etc.)
    preparation_time INTEGER, -- in minutes
    calories INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_active ON menu_items(is_active);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_featured ON menu_items(is_featured);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    delivery_fee DECIMAL(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
    final_total DECIMAL(10, 2) NOT NULL CHECK (final_total >= 0),
    order_type VARCHAR(20) DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    delivery_address TEXT,
    phone_number VARCHAR(20),
    special_instructions TEXT,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_type ON orders(order_type);

-- Order items table (junction table for orders and menu items)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), -- Price at time of order
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0), -- quantity * price
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- System settings table for configurable application settings
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer addresses table (for delivery)
CREATE TABLE customer_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(user_id, is_default);

-- Reviews table for menu item reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id, order_id)
);

CREATE INDEX idx_reviews_menu_item ON reviews(menu_item_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);

-- Coupons table for discount management
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Order coupons junction table
CREATE TABLE order_coupons (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_coupons_order ON order_coupons(order_id);
CREATE INDEX idx_order_coupons_coupon ON order_coupons(coupon_id);

-- Insert default admin user
INSERT INTO users (full_name, email, password, role, is_active, email_verified) 
VALUES (
    'Restaurant Admin', 
    'admin@restaurant.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: 'admin123'
    'admin', 
    true, 
    true
);

-- Insert default menu categories
INSERT INTO menu_categories (name, description, display_order) VALUES
('Appetizers', 'Start your meal with our delicious appetizers', 1),
('Main Courses', 'Our signature main dishes', 2),
('Desserts', 'Sweet endings to your perfect meal', 3),
('Beverages', 'Refreshing drinks and beverages', 4),
('Salads', 'Fresh and healthy salad options', 5);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category_id, is_featured, is_available, preparation_time, calories) VALUES
('Caesar Salad', 'Fresh romaine lettuce with parmesan cheese, croutons, and our signature Caesar dressing', 12.99, 1, true, true, 10, 320),
('Bruschetta', 'Toasted bread topped with fresh tomatoes, basil, and mozzarella', 9.99, 1, false, true, 8, 180),
('Grilled Salmon', 'Fresh Atlantic salmon grilled to perfection with lemon herb seasoning', 24.99, 2, true, true, 20, 450),
('Beef Tenderloin', 'Premium beef tenderloin cooked to your preference with garlic mashed potatoes', 32.99, 2, true, true, 25, 580),
('Vegetarian Pasta', 'Penne pasta with seasonal vegetables in a light tomato basil sauce', 18.99, 2, false, true, 15, 420),
('Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream', 8.99, 3, true, true, 12, 520),
('Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 7.99, 3, false, true, 5, 380),
('Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, 4, false, true, 2, 110),
('Craft Beer', 'Local craft beer selection', 6.99, 4, false, true, 1, 150),
('Garden Salad', 'Mixed greens with cherry tomatoes, cucumbers, and balsamic vinaigrette', 10.99, 5, false, true, 8, 180);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('restaurant_name', 'Delicious Bites Restaurant', 'Name of the restaurant'),
('restaurant_phone', '+1 (555) 123-4567', 'Restaurant contact phone number'),
('restaurant_email', 'info@deliciousbites.com', 'Restaurant contact email'),
('restaurant_address', '123 Food Street, Culinary City, FC 12345', 'Restaurant physical address'),
('delivery_fee', '5.99', 'Standard delivery fee'),
('tax_rate', '0.08', 'Tax rate (8%)'),
('minimum_order_amount', '15.00', 'Minimum order amount for delivery'),
('restaurant_hours', 'Mon-Thu: 11:00 AM - 10:00 PM, Fri-Sat: 11:00 AM - 11:00 PM, Sun: 12:00 PM - 9:00 PM', 'Restaurant operating hours'),
('max_delivery_distance', '10', 'Maximum delivery distance in miles'),
('average_preparation_time', '30', 'Average order preparation time in minutes');

-- Create triggers to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- View for menu items with category information
CREATE VIEW menu_items_with_category AS
SELECT 
    mi.id,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.is_available,
    mi.is_featured,
    mi.allergens,
    mi.dietary_info,
    mi.preparation_time,
    mi.calories,
    mc.name as category_name,
    mc.id as category_id,
    mi.created_at,
    mi.updated_at
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.is_active = true;

-- View for order summary with customer information
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.final_total,
    o.status,
    o.order_type,
    o.created_at,
    u.full_name as customer_name,
    u.email as customer_email,
    u.phone_number as customer_phone,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.full_name, u.email, u.phone_number;

-- Insert default admin user
-- Password is 'admin123' hashed with bcrypt (12 salt rounds)
INSERT INTO users (full_name, email, password, role, is_active, email_verified, created_at, updated_at)
VALUES (
    'Admin User',
    'admin@bellavista.com',
    '$2a$12$LQv3c1yqBwEHXk.JHd3vVeaJQd3bM4q4f4Ed9IFkt2krO.PX.oa',
    'admin',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Newsletter subscribers table for email marketing
CREATE TABLE newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    source VARCHAR(50) DEFAULT 'website', -- website, admin, import, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);
CREATE INDEX idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);

-- Create trigger for newsletter_subscribers updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for customers and administrators';
COMMENT ON TABLE menu_categories IS 'Categories for organizing menu items';
COMMENT ON TABLE menu_items IS 'Restaurant menu items with pricing and details';
COMMENT ON TABLE orders IS 'Customer orders with delivery and payment information';
COMMENT ON TABLE order_items IS 'Individual items within each order';
COMMENT ON TABLE system_settings IS 'Configurable application settings';
COMMENT ON TABLE customer_addresses IS 'Customer delivery addresses';
COMMENT ON TABLE reviews IS 'Customer reviews for menu items';
COMMENT ON TABLE coupons IS 'Discount coupons and promotional codes';
COMMENT ON TABLE newsletter_subscribers IS 'Email subscribers for newsletter and promotional offers';

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO restaurant_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO restaurant_app;