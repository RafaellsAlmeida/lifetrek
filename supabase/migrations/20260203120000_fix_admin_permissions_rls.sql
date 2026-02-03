-- Allow authenticated users to view their own admin permission record
-- This fixes the deadlock where a new admin cannot verify their status because they can't query the table.

DROP POLICY IF EXISTS "Users can view own permission" ON public.admin_permissions;

CREATE POLICY "Users can view own permission"
ON public.admin_permissions
FOR SELECT
TO authenticated
USING (
  email = auth.jwt() ->> 'email'
);
