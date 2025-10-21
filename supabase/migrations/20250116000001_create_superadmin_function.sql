-- Función para crear superadmin
CREATE OR REPLACE FUNCTION public.create_superadmin(user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.user_roles (user_id, role)
  VALUES (create_superadmin.user_id, 'superadmin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';
$$;

-- Función para verificar si existe un superadmin
CREATE OR REPLACE FUNCTION public.has_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = 'superadmin'
    LIMIT 1
  );
$$;

-- Función para crear el primer superadmin si no existe
CREATE OR REPLACE FUNCTION public.ensure_superadmin_exists()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_superadmin();
$$;
