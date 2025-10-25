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

-- Actualizar la tabla user_roles para que user_id referencie a usuarios.id
-- Primero, asegurarse de que user_id en user_roles sea UUID
ALTER TABLE public.user_roles 
  ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

-- Agregar foreign key de user_roles.user_id a usuarios.id
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
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

-- Políticas RLS para usuarios
-- Superadmin puede ver todos los usuarios
CREATE POLICY "Superadmin puede ver todos los usuarios"
ON public.usuarios FOR SELECT
USING (public.is_superadmin(auth.uid()));

-- Usuario puede ver su propia información
CREATE POLICY "Usuario puede ver su propia información"
ON public.usuarios FOR SELECT
USING (id = auth.uid());

-- Superadmin puede insertar usuarios
CREATE POLICY "Superadmin puede insertar usuarios"
ON public.usuarios FOR INSERT
WITH CHECK (public.is_superadmin(auth.uid()));

-- Superadmin puede actualizar usuarios
CREATE POLICY "Superadmin puede actualizar usuarios"
ON public.usuarios FOR UPDATE
USING (public.is_superadmin(auth.uid()));

-- Superadmin puede eliminar usuarios
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

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_usuarios_updated_at();

-- ==========================================
-- MIGRACIÓN COMPLETADA
-- ==========================================
