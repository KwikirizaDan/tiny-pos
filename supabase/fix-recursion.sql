-- ============================================================
-- Fix: infinite recursion detected in policy for relation "users"
-- 
-- Problem:
--   1. current_vendor_id() queries the users table
--   2. Users policies call current_vendor_id()
--   3. Without SECURITY DEFINER, the inner query re-triggers RLS → recursion
--
-- Also supabase_schema.sql policies with names like
-- "Users can view members of the same vendor" were never dropped
-- by rls-policies.sql (which only drops "users_select" etc).
-- ============================================================

-- 1. Recreate current_vendor_id() with SECURITY DEFINER so its internal
--    SELECT on the users table bypasses RLS
CREATE OR REPLACE FUNCTION current_vendor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT vendor_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- 2. Create owns_vendor() helper (used by users policies below)
--    Queries vendors, not users — no recursion risk.
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

-- Create current_user_role() helper (used by users_update WITH CHECK)
-- SECURITY DEFINER so its query on users bypasses RLS
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;
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

-- 3. Drop old policies from supabase_schema.sql that have conflicting names
DROP POLICY IF EXISTS "Users can view members of the same vendor" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Owners can manage users of their vendor" ON users;
DROP POLICY IF EXISTS "Owners can delete users of their vendor" ON users;

-- 4. Re-apply the correct policies from rls-policies.sql
--    (These use owns_vendor() which queries vendors, not users — no recursion)
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    vendor_id = current_vendor_id()
    OR owns_vendor(vendor_id)
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (owns_vendor(vendor_id));

CREATE POLICY "users_update" ON users
  FOR UPDATE
  USING (owns_vendor(vendor_id) OR auth_id = auth.uid())
  WITH CHECK (
    owns_vendor(vendor_id)
    OR (auth_id = auth.uid() AND role = current_user_role())
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (owns_vendor(vendor_id));
