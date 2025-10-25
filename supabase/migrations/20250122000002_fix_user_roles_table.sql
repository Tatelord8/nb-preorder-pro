-- Actualizar tabla user_roles para incluir campos faltantes y rol 'superadmin'
-- Agregar columna 'nombre' si no existe
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS nombre TEXT;

-- Actualizar CHECK constraint para incluir 'superadmin'
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('superadmin', 'admin', 'cliente'));

-- Actualizar tier_id para que sea UUID (ya que tiers.id es UUID)
-- Primero eliminar el tipo antiguo si existe
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_tier_id_fkey;
ALTER TABLE public.user_roles ALTER COLUMN tier_id TYPE UUID USING tier_id::text::uuid;

-- Agregar foreign key si tier_id no era UUID
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_tier_id_fkey 
  FOREIGN KEY (tier_id) REFERENCES public.tiers(id) ON DELETE SET NULL;

-- Comentarios para documentar
COMMENT ON TABLE public.user_roles IS 'Tabla de roles de usuario con soporte para superadmin, admin y cliente';
COMMENT ON COLUMN public.user_roles.nombre IS 'Nombre del usuario';
COMMENT ON COLUMN public.user_roles.role IS 'Rol del usuario: superadmin (acceso total), admin (gestión de marca), cliente (comprador)';
COMMENT ON COLUMN public.user_roles.tier_id IS 'ID del tier del cliente (UUID)';
COMMENT ON COLUMN public.user_roles.marca_id IS 'ID de la marca asignada (para admins)';
COMMENT ON COLUMN public.user_roles.cliente_id IS 'ID del cliente asignado (para clientes)';
