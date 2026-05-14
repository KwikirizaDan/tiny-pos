-- ============================================================
-- TinyPOS — Row Level Security Policies
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Helper: returns the vendor_id for the currently authenticated user
-- (works for both owners and staff members)
CREATE OR REPLACE FUNCTION current_vendor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT vendor_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Helper: returns true if the current user owns a vendor with this id
CREATE OR REPLACE FUNCTION owns_vendor(vid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors WHERE id = vid AND owner_id = auth.uid()
  );
$$;

-- Helper: returns the role of the current user within their vendor
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE vendors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_settings  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VENDORS
-- ============================================================
DROP POLICY IF EXISTS "vendors_select" ON vendors;
DROP POLICY IF EXISTS "vendors_insert" ON vendors;
DROP POLICY IF EXISTS "vendors_update" ON vendors;

CREATE POLICY "vendors_select" ON vendors
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id = current_vendor_id()
  );

-- INSERT is handled by create_vendor_for_user (SECURITY DEFINER)
CREATE POLICY "vendors_insert" ON vendors
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "vendors_update" ON vendors
  FOR UPDATE USING (owner_id = auth.uid());

-- ============================================================
-- USERS (staff records)
-- ============================================================
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;

-- Any staff member can see others in the same vendor
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    vendor_id = current_vendor_id()
    OR owns_vendor(vendor_id)
  );

-- Only owners can add staff
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    owns_vendor(vendor_id)
  );

-- Owners can update any staff; users can update their own auth_id (for linking)
CREATE POLICY "users_update" ON users
  FOR UPDATE
  USING (owns_vendor(vendor_id) OR auth_id = auth.uid())
  WITH CHECK (
    owns_vendor(vendor_id)
    OR (auth_id = auth.uid() AND role = current_user_role())
  );

-- Only owners can delete staff
CREATE POLICY "users_delete" ON users
  FOR DELETE USING (owns_vendor(vendor_id));

-- ============================================================
-- PRODUCTS
-- ============================================================
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;

CREATE POLICY "products_select" ON products
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "products_insert" ON products
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "products_update" ON products
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "products_delete" ON products
  FOR DELETE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- SALES
-- ============================================================
DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert" ON sales;
DROP POLICY IF EXISTS "sales_update" ON sales;

CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "sales_insert" ON sales
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "sales_update" ON sales
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- SALE ITEMS
-- ============================================================
DROP POLICY IF EXISTS "sale_items_select" ON sale_items;
DROP POLICY IF EXISTS "sale_items_insert" ON sale_items;

CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND (s.vendor_id = current_vendor_id() OR owns_vendor(s.vendor_id))
    )
  );

CREATE POLICY "sale_items_insert" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND (s.vendor_id = current_vendor_id() OR owns_vendor(s.vendor_id))
    )
  );

-- ============================================================
-- CUSTOMERS
-- ============================================================
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;

CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- DISCOUNTS
-- ============================================================
DROP POLICY IF EXISTS "discounts_select" ON discounts;
DROP POLICY IF EXISTS "discounts_insert" ON discounts;
DROP POLICY IF EXISTS "discounts_update" ON discounts;
DROP POLICY IF EXISTS "discounts_delete" ON discounts;

CREATE POLICY "discounts_select" ON discounts
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "discounts_insert" ON discounts
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "discounts_update" ON discounts
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "discounts_delete" ON discounts
  FOR DELETE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- REFUNDS
-- ============================================================
DROP POLICY IF EXISTS "refunds_select" ON refunds;
DROP POLICY IF EXISTS "refunds_insert" ON refunds;
DROP POLICY IF EXISTS "refunds_update" ON refunds;

CREATE POLICY "refunds_select" ON refunds
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "refunds_insert" ON refunds
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "refunds_update" ON refunds
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- INVENTORY LOGS
-- ============================================================
DROP POLICY IF EXISTS "inventory_logs_select" ON inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_insert" ON inventory_logs;

CREATE POLICY "inventory_logs_select" ON inventory_logs
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "inventory_logs_insert" ON inventory_logs
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;

-- Only owners can read audit logs (enforced in app too, but belt-and-suspenders)
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (owns_vendor(vendor_id));

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- VENDOR SETTINGS
-- ============================================================
DROP POLICY IF EXISTS "vendor_settings_select" ON vendor_settings;
DROP POLICY IF EXISTS "vendor_settings_insert" ON vendor_settings;
DROP POLICY IF EXISTS "vendor_settings_update" ON vendor_settings;

CREATE POLICY "vendor_settings_select" ON vendor_settings
  FOR SELECT USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "vendor_settings_insert" ON vendor_settings
  FOR INSERT WITH CHECK (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

CREATE POLICY "vendor_settings_update" ON vendor_settings
  FOR UPDATE USING (vendor_id = current_vendor_id() OR owns_vendor(vendor_id));

-- ============================================================
-- decrement_stock — atomically deduct stock, returns false if insufficient
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, p_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  WHERE id = p_id
    AND stock_quantity >= p_quantity;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- increment_discount_uses — called by createOrder()
-- ============================================================
CREATE OR REPLACE FUNCTION increment_discount_uses(discount_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE discounts
  SET uses_count = uses_count + 1
  WHERE id = discount_id
    AND vendor_id = current_vendor_id();
$$;
