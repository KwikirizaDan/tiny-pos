-- SQL Migration to Supabase

-- Enums
CREATE TYPE sale_status AS ENUM ('completed', 'pending', 'refunded', 'cancelled');
CREATE TYPE refund_status AS ENUM ('processed', 'pending', 'rejected');
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier');
CREATE TYPE discount_type AS ENUM ('percentage', 'flat');
CREATE TYPE change_type AS ENUM ('sale', 'refund', 'restock', 'adjustment', 'damage');

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID NOT NULL, -- Refers to auth.users.id
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Settings
CREATE TABLE vendor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, key)
);

-- Users (Profiles linked to Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL, -- Refers to auth.users.id
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role user_role DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  password TEXT, -- Optional, Supabase handles auth
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discounts
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  code TEXT,
  description TEXT,
  discount_type discount_type NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(12, 2),
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  status sale_status DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sale Items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL
);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  reason TEXT,
  status refund_status DEFAULT 'processed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Logs
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  change_type change_type NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data TEXT,
  new_data TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_vendor ON users(vendor_id);
CREATE INDEX idx_customers_vendor ON customers(vendor_id);
CREATE INDEX idx_categories_vendor ON categories(vendor_id);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_discounts_vendor ON discounts(vendor_id);
CREATE INDEX idx_sales_vendor ON sales(vendor_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_refunds_vendor ON refunds(vendor_id);
CREATE INDEX idx_inv_vendor ON inventory_logs(vendor_id);
CREATE INDEX idx_audit_vendor ON audit_logs(vendor_id);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current vendor_id for the authenticated user
CREATE OR REPLACE FUNCTION current_vendor_id()
RETURNS UUID AS $$
  SELECT vendor_id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Vendors Policies (Owners see their own vendor)
CREATE POLICY "Users can view their own vendor" ON vendors
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create their own vendor" ON vendors
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their own vendor" ON vendors
  FOR UPDATE USING (owner_id = auth.uid());

-- Users Policies
CREATE POLICY "Users can view members of the same vendor" ON users
  FOR SELECT USING (vendor_id = current_vendor_id());

-- Allows a new user to insert their own profile row during onboarding
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Owners can manage users of their vendor" ON users
  FOR UPDATE USING (
    vendor_id = current_vendor_id() AND
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owners can delete users of their vendor" ON users
  FOR DELETE USING (
    vendor_id = current_vendor_id() AND
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

-- General policies for vendor-scoped tables
-- (Applies to customers, categories, products, discounts, sales, refunds, logs)

CREATE POLICY "Vendor isolation - Select" ON customers FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON customers FOR INSERT WITH CHECK (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Update" ON customers FOR UPDATE USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Delete" ON customers FOR DELETE USING (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON categories FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON categories FOR INSERT WITH CHECK (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Update" ON categories FOR UPDATE USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Delete" ON categories FOR DELETE USING (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON products FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON products FOR INSERT WITH CHECK (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Update" ON products FOR UPDATE USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Delete" ON products FOR DELETE USING (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON discounts FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON discounts FOR INSERT WITH CHECK (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Update" ON discounts FOR UPDATE USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Delete" ON discounts FOR DELETE USING (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON sales FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON sales FOR INSERT WITH CHECK (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Update" ON sales FOR UPDATE USING (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_id AND vendor_id = current_vendor_id())
);
CREATE POLICY "Vendor isolation - Insert" ON sale_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM sales WHERE id = sale_id AND vendor_id = current_vendor_id())
);

CREATE POLICY "Vendor isolation - Select" ON refunds FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON refunds FOR INSERT WITH CHECK (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON inventory_logs FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON inventory_logs FOR INSERT WITH CHECK (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON vendor_settings FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Manage" ON vendor_settings FOR ALL USING (vendor_id = current_vendor_id());

CREATE POLICY "Vendor isolation - Select" ON audit_logs FOR SELECT USING (vendor_id = current_vendor_id());
CREATE POLICY "Vendor isolation - Insert" ON audit_logs FOR INSERT WITH CHECK (vendor_id = current_vendor_id());
