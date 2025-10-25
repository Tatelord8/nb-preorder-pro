-- ==========================================
-- CREAR TABLA USUARIOS
-- ==========================================
-- Esta migración crea la tabla usuarios que contiene la información
-- de los usuarios del sistema (emails, nombres, etc.)
-- ==========================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en la tabla usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- PASO 1: Migrar datos existentes de auth.users a public.usuarios
-- Crear usuarios desde la tabla auth.users
INSERT INTO public.usuarios (id, email, nombre, activo, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(ur.nombre, au.email) as nombre,
  true as activo,
  COALESCE(ur.created_at, now()) as created_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ON CONFLICT (id) DO NOTHING;

-- PASO 2: Actualizar la tabla user_roles para que user_id referencie a usuarios.id
-- Primero, asegurarse de que user_id en user_roles sea UUID
ALTER TABLE public.user_roles 
  ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

-- Eliminar foreign key anterior si existe
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Agregar foreign key de user_roles.user_id a usuarios.id
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- Función para obtener información completa del usuario con su rol
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID)
RETURNS TABLE (
  usuario_id UUID,
  email TEXT,
  nombre TEXT,
  role TEXT,
  activo BOOLEAN,
  cliente_id UUID,
  marca_id UUID
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.email,
    u.nombre,
    ur.role,
    u.activo,
    ur.cliente_id,
    ur.marca_id
  FROM public.usuarios u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.id = get_user_info.user_id;
$$;

-- Función para obtener todos los usuarios con sus roles
-- Primero eliminar la función existente si existe
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

-- Políticas RLS para usuarios
-- Superadmin puede ver todos los usuarios
DROP POLICY IF EXISTS "Superadmin puede ver todos los usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede ver todos los usuarios"
ON public.usuarios FOR SELECT
USING (public.is_superadmin(auth.uid()));

-- Usuario puede ver su propia información
DROP POLICY IF EXISTS "Usuario puede ver su propia información" ON public.usuarios;
CREATE POLICY "Usuario puede ver su propia información"
ON public.usuarios FOR SELECT
USING (id = auth.uid());

-- Superadmin puede insertar usuarios
DROP POLICY IF EXISTS "Superadmin puede insertar usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede insertar usuarios"
ON public.usuarios FOR INSERT
WITH CHECK (public.is_superadmin(auth.uid()));

-- Superadmin puede actualizar usuarios
DROP POLICY IF EXISTS "Superadmin puede actualizar usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede actualizar usuarios"
ON public.usuarios FOR UPDATE
USING (public.is_superadmin(auth.uid()));

-- Superadmin puede eliminar usuarios
DROP POLICY IF EXISTS "Superadmin puede eliminar usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede eliminar usuarios"
ON public.usuarios FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- Comentarios para documentar
COMMENT ON TABLE public.usuarios IS 'Tabla de usuarios del sistema con información de contacto';
COMMENT ON COLUMN public.usuarios.email IS 'Email único del usuario';
COMMENT ON COLUMN public.usuarios.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN public.usuarios.activo IS 'Estado del usuario (activo/inactivo)';

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_usuarios_updated_at();

-- ==========================================
-- MIGRACIÓN COMPLETADA
-- ==========================================

-- ==========================================
-- ACTUALIZAR TIERS EN PRODUCTOS Y CLIENTES
-- ==========================================

-- Actualizar productos: convertir 'A'->'0', 'B'->'1', 'C'->'2', 'D'->'3'
UPDATE public.productos
SET tier = CASE
  WHEN tier = 'A' THEN '0'
  WHEN tier = 'B' THEN '1'
  WHEN tier = 'C' THEN '2'
  WHEN tier = 'D' THEN '3'
  ELSE tier
END
WHERE tier IN ('A', 'B', 'C', 'D');

-- Actualizar productos: convertir 'T1'->'0', 'T2'->'1', 'T3'->'2', 'T4'->'3'
UPDATE public.productos
SET tier = CASE
  WHEN tier = 'T1' THEN '0'
  WHEN tier = 'T2' THEN '1'
  WHEN tier = 'T3' THEN '2'
  WHEN tier = 'T4' THEN '3'
  ELSE tier
END
WHERE tier IN ('T1', 'T2', 'T3', 'T4');

-- Actualizar clientes: convertir 'A'->'0', 'B'->'1', 'C'->'2', 'D'->'3'
UPDATE public.clientes
SET tier = CASE
  WHEN tier = 'A' THEN '0'
  WHEN tier = 'B' THEN '1'
  WHEN tier = 'C' THEN '2'
  WHEN tier = 'D' THEN '3'
  ELSE tier
END
WHERE tier IN ('A', 'B', 'C', 'D');

-- Actualizar clientes: convertir 'T1'->'0', 'T2'->'1', 'T3'->'2', 'T4'->'3'
UPDATE public.clientes
SET tier = CASE
  WHEN tier = 'T1' THEN '0'
  WHEN tier = 'T2' THEN '1'
  WHEN tier = 'T3' THEN '2'
  WHEN tier = 'T4' THEN '3'
  ELSE tier
END
WHERE tier IN ('T1', 'T2', 'T3', 'T4');

-- Actualizar constraint en productos para aceptar solo 0-3
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_tier_check;
ALTER TABLE public.productos ADD CONSTRAINT productos_tier_check CHECK (tier IN ('0', '1', '2', '3'));

-- Actualizar constraint en clientes para aceptar solo 0-3
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_tier_check;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_tier_check CHECK (tier IN ('0', '1', '2', '3'));

-- ==========================================
-- FIN DE ACTUALIZACIÓN DE TIERS
-- ==========================================
