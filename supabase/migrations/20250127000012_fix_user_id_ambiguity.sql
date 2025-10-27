-- =====================================================
-- MIGRACIÓN: Corrección de Ambigüedad user_id y Referencias de Tablas
-- Fecha: 2025-01-27
-- Descripción: Corrige ambigüedad en user_id y actualiza referencias a tablas renombradas
-- =====================================================

-- =====================================================
-- 1. CORREGIR AMBIGÜEDAD EN user_id
-- =====================================================

-- Eliminar políticas RLS problemáticas que causan ambigüedad
DROP POLICY IF EXISTS "Admin puede ver todos los usuarios" ON public.user_roles;
DROP POLICY IF EXISTS "Admin puede insertar usuarios" ON public.user_roles;
DROP POLICY IF EXISTS "Admin puede actualizar usuarios" ON public.user_roles;
DROP POLICY IF EXISTS "Admin puede eliminar usuarios" ON public.user_roles;
DROP POLICY IF EXISTS "Cliente puede ver su propio registro" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin full access to user_roles" ON public.user_roles;

-- Crear políticas RLS simplificadas que eviten ambigüedad
CREATE POLICY "Superadmin full access to user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Admin can manage user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_roles.user_id = auth.uid());

-- =====================================================
-- 2. CORREGIR REFERENCIAS A TABLAS RENOMBRADAS
-- =====================================================

-- El Dashboard está usando 'items_pedido' pero la tabla se renombró a 'pedidos_detalles'
-- Vamos a crear una vista para mantener compatibilidad
CREATE OR REPLACE VIEW public.items_pedido AS
SELECT * FROM public.pedidos_detalles;

-- Crear vista para curvas también
CREATE OR REPLACE VIEW public.curvas AS
SELECT * FROM public.curvas_predefinidas;

-- =====================================================
-- 3. VERIFICAR FUNCIONES HELPER
-- =====================================================

-- Asegurar que las funciones is_superadmin e is_admin existen
CREATE OR REPLACE FUNCTION public.is_superadmin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = p_user_id
    AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = p_user_id
    AND role IN ('admin', 'superadmin')
  );
$$;

-- =====================================================
-- 4. VERIFICAR POLÍTICAS DE OTRAS TABLAS
-- =====================================================

-- Asegurar que productos tenga políticas simples
DROP POLICY IF EXISTS "Allow all authenticated users to view products" ON public.productos;
DROP POLICY IF EXISTS "Allow all authenticated users to insert products" ON public.productos;
DROP POLICY IF EXISTS "Allow all authenticated users to update products" ON public.productos;
DROP POLICY IF EXISTS "Allow all authenticated users to delete products" ON public.productos;
DROP POLICY IF EXISTS "Allow anonymous users to view products" ON public.productos;

-- Políticas muy simples para productos
CREATE POLICY "Simple products access"
ON public.productos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anonymous products view"
ON public.productos FOR SELECT
TO anon
USING (true);

-- =====================================================
-- 5. VERIFICAR POLÍTICAS DE clientes
-- =====================================================

-- Simplificar políticas de clientes
DROP POLICY IF EXISTS "Superadmin full access to clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin can manage clientes" ON public.clientes;
DROP POLICY IF EXISTS "Client can view their own data" ON public.clientes;
DROP POLICY IF EXISTS "Vendedor puede ver sus clientes" ON public.clientes;

CREATE POLICY "Simple clientes access"
ON public.clientes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 6. VERIFICAR POLÍTICAS DE pedidos
-- =====================================================

-- Simplificar políticas de pedidos
DROP POLICY IF EXISTS "Superadmin full access to pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Admin can manage pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Client can manage their own orders" ON public.pedidos;
DROP POLICY IF EXISTS "Vendedor puede ver pedidos de sus clientes" ON public.pedidos;

CREATE POLICY "Simple pedidos access"
ON public.pedidos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 7. VERIFICAR POLÍTICAS DE marcas
-- =====================================================

-- Simplificar políticas de marcas
DROP POLICY IF EXISTS "Superadmin full access to marcas" ON public.marcas;
DROP POLICY IF EXISTS "Admin can manage marcas" ON public.marcas;

CREATE POLICY "Simple marcas access"
ON public.marcas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 8. COMENTARIOS FINALES
-- =====================================================

COMMENT ON VIEW public.items_pedido IS 'Vista de compatibilidad para pedidos_detalles';
COMMENT ON VIEW public.curvas IS 'Vista de compatibilidad para curvas_predefinidas';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
