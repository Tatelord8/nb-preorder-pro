-- Allow authenticated users to insert their own user_role on signup
CREATE POLICY "Usuario puede crear su propio rol"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update productos to use categoria field that already exists (prendas/calzados)
-- No changes needed to schema, categoria field already exists