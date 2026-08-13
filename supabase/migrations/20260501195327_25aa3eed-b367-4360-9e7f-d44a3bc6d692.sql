-- ============================================================
-- Granular admin module permissions
-- ============================================================
-- L0 = users with the existing 'admin' role (super admin) — full access, manage other admins.
-- L1+ = users with 'editor' role — access only to modules explicitly granted by L0.

-- 1) Enum of permission-gated modules
CREATE TYPE public.admin_module AS ENUM (
  'analytics',
  'jobs',
  'bulk_jobs',
  'blogs',
  'resources',
  'featured_carousel',
  'taxonomy',
  'user_management'
);

-- 2) Permissions table
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module public.admin_module NOT NULL,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

CREATE INDEX idx_admin_permissions_user ON public.admin_permissions(user_id);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- 3) Helper: is the caller a super admin (L0)?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 4) Helper: does a user have access to a given module?
--    Super admins always pass. Editors must have an explicit grant.
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module public.admin_module)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.admin_permissions
      WHERE user_id = _user_id AND module = _module
    );
$$;

REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, public.admin_module) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, public.admin_module) TO authenticated;

-- 5) RLS policies on admin_permissions
-- Only super admins can manage rows
CREATE POLICY "Super admins manage permissions"
ON public.admin_permissions
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Any authenticated user can read their OWN permissions (so the UI can gate itself)
CREATE POLICY "Users read own permissions"
ON public.admin_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 6) Trigger to stamp granted_by automatically
CREATE OR REPLACE FUNCTION public.stamp_admin_permission_granter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.granted_by IS NULL THEN
    NEW.granted_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.stamp_admin_permission_granter() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_stamp_admin_permission_granter
BEFORE INSERT ON public.admin_permissions
FOR EACH ROW EXECUTE FUNCTION public.stamp_admin_permission_granter();
