-- ============================================
-- Supabase Database Schema for Stock Management
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    current_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('stock_in', 'stock_out')),
    quantity INTEGER NOT NULL,
    remark TEXT,
    running_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply update trigger to items
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a simple app)
-- For categories
CREATE POLICY "Allow public read access on categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on categories" ON categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on categories" ON categories
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on categories" ON categories
    FOR DELETE USING (true);

-- For items
CREATE POLICY "Allow public read access on items" ON items
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on items" ON items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on items" ON items
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on items" ON items
    FOR DELETE USING (true);

-- For transactions
CREATE POLICY "Allow public read access on transactions" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on transactions" ON transactions
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on transactions" ON transactions
    FOR DELETE USING (true);

-- Insert some default categories
INSERT INTO categories (name, is_active) VALUES 
    ('Plate', true),
    ('Glass', true),
    ('Cutlery', true),
    ('Cookware', true)
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'Database setup complete!' as status;
