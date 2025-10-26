-- Función para crear usuario con rol
-- Esta función necesita ser llamada DESPUÉS de que el usuario se haya creado en auth.users
-- usando supabase.auth.signUp() desde el cliente

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS public.create_user_with_role(TEXT, TEXT, TEXT, TEXT, INTEGER, UUID, UUID);
DROP FUNCTION IF EXISTS public.create_user_with_role(TEXT, TEXT, TEXT);

-- Crear la función con los parámetros correctos
CREATE FUNCTION public.create_user_with_role(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT,
  user_nombre TEXT,
  user_tier_id INTEGER DEFAULT NULL,
  user_cliente_id UUID DEFAULT NULL,
  user_marca_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  auth_user_exists BOOLEAN;
BEGIN
  -- Verificar si el usuario ya existe en auth.users
  -- Usar LOWER() para comparación case-insensitive
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = LOWER(user_email)
  ) INTO auth_user_exists;

  -- Si el usuario no existe en auth.users, debe crearse primero usando supabase.auth.signUp()
  IF NOT auth_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El usuario debe ser creado primero usando supabase.auth.signUp() desde el cliente. Esta función solo asigna el rol.'
    );
  END IF;

  -- Obtener el ID del usuario de auth.users
  -- Usar LOWER() para comparación case-insensitive
  SELECT id INTO new_user_id FROM auth.users WHERE LOWER(email) = LOWER(user_email);

  -- Verificar si el email ya existe en public.usuarios (comparación case-insensitive)
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE LOWER(email) = LOWER(user_email)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El email ya está registrado en la base de datos'
    );
  END IF;

  -- Verificar si ya existe en public.usuarios por ID
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = new_user_id) THEN
    -- Insertar en public.usuarios
    INSERT INTO public.usuarios (id, email, nombre, activo)
    VALUES (new_user_id, LOWER(user_email), user_nombre, true);
  END IF;

  -- Verificar si ya existe un rol para este usuario
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = new_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El usuario ya tiene un rol asignado'
    );
  END IF;

  -- Insertar rol en user_roles
  INSERT INTO public.user_roles (user_id, role, nombre, tier_id, cliente_id, marca_id)
  VALUES (new_user_id, user_role, user_nombre, user_tier_id, user_cliente_id, user_marca_id);

  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El email ya está registrado'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ==========================================
-- FUNCIÓN HELPER PARA EVITAR RECURSIÓN
-- ==========================================

-- Crear una función helper para verificar si el usuario es superadmin
-- Esta función evitará la recursión infinita
CREATE OR REPLACE FUNCTION public.is_current_user_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  );
$$;

-- ==========================================
-- POLÍTICAS RLS PARA LA TABLA usuarios
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Los usuarios pueden ver su propia información, los superadmins pueden ver todo
DROP POLICY IF EXISTS "Usuarios pueden ver su propia información" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propia información"
ON public.usuarios FOR SELECT
TO public
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'superadmin'
  )
);

-- 2. INSERT: Solo superadmins pueden insertar usuarios
DROP POLICY IF EXISTS "Superadmin puede insertar usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede insertar usuarios"
ON public.usuarios FOR INSERT
TO public
WITH CHECK (
  public.is_current_user_superadmin()
);

-- 3. UPDATE: Los usuarios pueden actualizar su propia información, los superadmins pueden actualizar todo
DROP POLICY IF EXISTS "Superadmin puede actualizar usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede actualizar usuarios"
ON public.usuarios FOR UPDATE
TO public
USING (
  id = auth.uid() OR 
  public.is_current_user_superadmin()
)
WITH CHECK (
  id = auth.uid() OR 
  public.is_current_user_superadmin()
);

-- 4. DELETE: Solo superadmins pueden eliminar usuarios
DROP POLICY IF EXISTS "Superadmin puede eliminar usuarios" ON public.usuarios;
CREATE POLICY "Superadmin puede eliminar usuarios"
ON public.usuarios FOR DELETE
TO public
USING (
  public.is_current_user_superadmin()
);

-- ==========================================
-- POLÍTICAS RLS PARA LA TABLA user_roles
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Los usuarios pueden ver su propio rol, los superadmins pueden ver todo
DROP POLICY IF EXISTS "Usuarios pueden ver su propio rol" ON public.user_roles;
CREATE POLICY "Usuarios pueden ver su propio rol"
ON public.user_roles FOR SELECT
TO public
USING (
  user_id = auth.uid() OR 
  public.is_current_user_superadmin()
);

-- 2. INSERT: Solo superadmins pueden insertar roles
DROP POLICY IF EXISTS "Superadmin puede insertar roles" ON public.user_roles;
CREATE POLICY "Superadmin puede insertar roles"
ON public.user_roles FOR INSERT
TO public
WITH CHECK (
  public.is_current_user_superadmin()
);

-- 3. UPDATE: Solo superadmins pueden actualizar roles
DROP POLICY IF EXISTS "Superadmin puede actualizar roles" ON public.user_roles;
CREATE POLICY "Superadmin puede actualizar roles"
ON public.user_roles FOR UPDATE
TO public
USING (
  public.is_current_user_superadmin()
)
WITH CHECK (
  public.is_current_user_superadmin()
);

-- 4. DELETE: Solo superadmins pueden eliminar roles
DROP POLICY IF EXISTS "Superadmin puede eliminar roles" ON public.user_roles;
CREATE POLICY "Superadmin puede eliminar roles"
ON public.user_roles FOR DELETE
TO public
USING (
  public.is_current_user_superadmin()
);

-- NOTA: Estas políticas garantizan que:
-- 1. Solo los superadmins pueden crear, editar y eliminar usuarios
-- 2. Los usuarios solo pueden ver su propia información y rol
-- 3. Los superadmins pueden ver y gestionar todos los usuarios
-- 4. Se evita la recursión infinita usando la función is_current_user_superadmin()
--    marcada como SECURITY DEFINER y STABLE para que no active RLS recursivamente
