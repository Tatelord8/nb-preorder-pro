-- Crear tabla de marcas
CREATE TABLE public.marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  logo_url TEXT,
  color_primario TEXT DEFAULT '#000000',
  color_secundario TEXT DEFAULT '#ffffff',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para marcas
CREATE POLICY "Superadmin puede ver todas las marcas"
ON public.marcas FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Superadmin puede insertar marcas"
ON public.marcas FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Superadmin puede actualizar marcas"
ON public.marcas FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Superadmin puede eliminar marcas"
ON public.marcas FOR DELETE
USING (public.is_admin(auth.uid()));

-- Actualizar tabla user_roles para incluir marca_id
ALTER TABLE public.user_roles 
ADD COLUMN marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL;

-- Actualizar función is_admin para incluir superadmin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role IN ('admin', 'superadmin')
  );
$$;

-- Función para verificar si un usuario es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_superadmin.user_id
    AND role = 'superadmin'
  );
$$;

-- Insertar marca por defecto
INSERT INTO public.marcas (nombre, descripcion, activa) VALUES
  ('NEW BALANCE', 'Marca principal NEW BALANCE', true);

-- Actualizar políticas para incluir superadmin
DROP POLICY IF EXISTS "Admin puede ver todos los vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Admin puede insertar vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Admin puede actualizar vendedores" ON public.vendedores;

CREATE POLICY "Admin y Superadmin pueden ver todos los vendedores"
ON public.vendedores FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden insertar vendedores"
ON public.vendedores FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden actualizar vendedores"
ON public.vendedores FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Actualizar políticas de clientes
DROP POLICY IF EXISTS "Admin puede ver todos los clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin puede insertar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin puede actualizar clientes" ON public.clientes;

CREATE POLICY "Admin y Superadmin pueden ver todos los clientes"
ON public.clientes FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden insertar clientes"
ON public.clientes FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden actualizar clientes"
ON public.clientes FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Actualizar políticas de productos
DROP POLICY IF EXISTS "Admin puede ver todos los productos" ON public.productos;
DROP POLICY IF EXISTS "Admin puede insertar productos" ON public.productos;
DROP POLICY IF EXISTS "Admin puede actualizar productos" ON public.productos;
DROP POLICY IF EXISTS "Admin puede eliminar productos" ON public.productos;

CREATE POLICY "Admin y Superadmin pueden ver todos los productos"
ON public.productos FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden insertar productos"
ON public.productos FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden actualizar productos"
ON public.productos FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin y Superadmin pueden eliminar productos"
ON public.productos FOR DELETE
USING (public.is_admin(auth.uid()));

-- Actualizar políticas de pedidos
DROP POLICY IF EXISTS "Admin puede ver todos los pedidos" ON public.pedidos;

CREATE POLICY "Admin y Superadmin pueden ver todos los pedidos"
ON public.pedidos FOR SELECT
USING (public.is_admin(auth.uid()));

-- Actualizar políticas de items_pedido
DROP POLICY IF EXISTS "Admin puede ver todos los items de pedido" ON public.items_pedido;

CREATE POLICY "Admin y Superadmin pueden ver todos los items de pedido"
ON public.items_pedido FOR SELECT
USING (public.is_admin(auth.uid()));

-- Actualizar políticas de user_roles
DROP POLICY IF EXISTS "Admin puede ver todos los roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin puede insertar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin puede actualizar roles" ON public.user_roles;

CREATE POLICY "Superadmin puede ver todos los roles"
ON public.user_roles FOR SELECT
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin puede insertar roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin puede actualizar roles"
ON public.user_roles FOR UPDATE
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin puede eliminar roles"
ON public.user_roles FOR DELETE
USING (public.is_superadmin(auth.uid()));
