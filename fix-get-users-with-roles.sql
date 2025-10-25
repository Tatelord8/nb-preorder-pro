-- Actualizar la función get_users_with_roles para incluir tier_id
DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  nombre TEXT,
  role TEXT,
  cliente_id UUID,
  marca_id UUID,
  tier_id INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.id,
    u.id as user_id,
    u.email,
    COALESCE(ur.nombre, u.nombre) as nombre,
    ur.role,
    ur.cliente_id,
    ur.marca_id,
    ur.tier_id,
    u.created_at
  FROM public.user_roles ur
  INNER JOIN public.usuarios u ON ur.user_id = u.id
  ORDER BY u.created_at DESC;
$$;
