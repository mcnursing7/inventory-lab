-- ==================================================
-- RLS Policies for Inventory App
-- File: rls_roles_and_policies.sql
-- Purpose: Centralized RLS setup for all roles and tables
-- ==================================================

-- ==================================================
-- 0. Enable Row-Level Security on tables
-- ==================================================
-- Add new tables here
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- 1. Admin Policies (full access)
-- ==================================================
-- Example policy for adjustments
CREATE POLICY "Admins full access adjustments" ON public.adjustments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Add similar FOR ALL policies for each table admins need access to

-- ==================================================
-- 2. Lab Manager Policies (frontend access)
-- ==================================================
-- Example policy for items
CREATE POLICY "Managers items full access" ON public.items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.managers WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.managers WHERE id = auth.uid()));

-- Add other tables here (inventory view, adjustments full access, POs, vendors, etc.)

-- ==================================================
-- 3. Lab User Policies (restricted access)
-- ==================================================
-- Example: Profiles (self only)
CREATE POLICY "Lab users view self" ON public.profiles
  FOR SELECT
  USING (id = auth.uid() AND role = 'lab_user');

CREATE POLICY "Lab users update self" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid() AND role = 'lab_user')
  WITH CHECK (id = auth.uid() AND role = 'lab_user');

-- Adjustments: full access
CREATE POLICY "Lab users adjustments full access" ON public.adjustments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lab_user'))
  WITH CHECK (true);

-- Inventory: view only but allow indirect operations (FOR ALL)
CREATE POLICY "Lab users inventory access" ON public.inventory
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lab_user'))
  WITH CHECK (true);

-- Purchase Orders: receive only
CREATE POLICY "Lab users update purchase_orders" ON public.purchase_orders
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lab_user'))
  WITH CHECK (true);

-- Views: grant SELECT
GRANT SELECT ON v_item_usage, v_low_stock_items_agg, v_po_line_receipts,
    v_purchase_orders, v_stock_valuation TO lab_user;

-- ==================================================
-- 4. Notes / Guidelines
-- ==================================================
-- 1. Use FOR ALL + WITH CHECK (true) on tables that may be modified indirectly.
-- 2. Use FOR SELECT only on tables that are strictly read-only.
-- 3. Always test each role using auth.uid() in Supabase SQL editor.
-- 4. Keep comments for each policy to clarify purpose.
-- 5. Add new tables here in section 0, then add policies per role in sections 1-3.
