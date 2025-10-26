-- =====================================================
-- MIGRACIÓN: Corrección de Inconsistencias de Schema
-- Fecha: 2025-10-26
-- Descripción: Corrige nombres de tablas, datos faltantes y estructura
-- =====================================================

-- =====================================================
-- 1. RENOMBRAR TABLAS PARA CONSISTENCIA CON CÓDIGO
-- =====================================================

-- 1.1 Renombrar 'curvas' a 'curvas_predefinidas'
ALTER TABLE IF EXISTS curvas RENAME TO curvas_predefinidas;

-- 1.2 Renombrar 'items_pedido' a 'pedidos_detalles'
ALTER TABLE IF EXISTS items_pedido RENAME TO pedidos_detalles;

-- 1.3 Actualizar foreign key constraints después del rename
-- Las FK se mantienen automáticamente, pero podemos verificarlas

-- =====================================================
-- 2. INSERTAR MARCA FALTANTE (New Balance)
-- =====================================================

-- Todos los productos apuntan a este marca_id que no existe en la tabla
INSERT INTO marcas (id, nombre, created_at)
VALUES (
  'e4508c9c-4b19-4790-b0ec-6e4712973ea3',
  'New Balance',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. INSERTAR VENDEDORES INICIALES
-- =====================================================

-- Estos vendedores estaban en la migración original pero no se insertaron
INSERT INTO vendedores (nombre, created_at)
VALUES
  ('Silvio Lencina', now()),
  ('Cesar Zarate', now()),
  ('Arturo Fernandez', now())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. INSERTAR CURVAS PREDEFINIDAS
-- =====================================================

-- Curvas para calzado Mens (tallas US)
INSERT INTO curvas_predefinidas (genero, nombre, talles, created_at)
VALUES
  ('Mens', 'Curva Estándar', '{"7": 1, "7.5": 1, "8": 2, "8.5": 2, "9": 3, "9.5": 3, "10": 3, "10.5": 2, "11": 2, "11.5": 1, "12": 1}'::jsonb, now()),
  ('Mens', 'Curva Amplia', '{"7": 2, "7.5": 2, "8": 3, "8.5": 3, "9": 4, "9.5": 4, "10": 4, "10.5": 3, "11": 3, "11.5": 2, "12": 2}'::jsonb, now())
ON CONFLICT (genero, nombre) DO NOTHING;

-- Curvas para calzado Womens (tallas US)
INSERT INTO curvas_predefinidas (genero, nombre, talles, created_at)
VALUES
  ('Womens', 'Curva Estándar', '{"5": 1, "5.5": 1, "6": 2, "6.5": 2, "7": 3, "7.5": 3, "8": 3, "8.5": 2, "9": 2, "9.5": 1, "10": 1}'::jsonb, now()),
  ('Womens', 'Curva Amplia', '{"5": 2, "5.5": 2, "6": 3, "6.5": 3, "7": 4, "7.5": 4, "8": 4, "8.5": 3, "9": 3, "9.5": 2, "10": 2}'::jsonb, now())
ON CONFLICT (genero, nombre) DO NOTHING;

-- Curvas para ropa Mens (tallas)
INSERT INTO curvas_predefinidas (genero, nombre, talles, created_at)
VALUES
  ('Mens', 'Curva Ropa Est\u00e1ndar', '{"XS": 1, "S": 2, "M": 3, "L": 3, "XL": 2, "XXL": 1}'::jsonb, now()),
  ('Mens', 'Curva Ropa Amplia', '{"XS": 2, "S": 3, "M": 4, "L": 4, "XL": 3, "XXL": 2}'::jsonb, now())
ON CONFLICT (genero, nombre) DO NOTHING;

-- Curvas para ropa Womens (tallas)
INSERT INTO curvas_predefinidas (genero, nombre, talles, created_at)
VALUES
  ('Womens', 'Curva Ropa Est\u00e1ndar', '{"XS": 1, "S": 2, "M": 3, "L": 3, "XL": 2, "XXL": 1}'::jsonb, now()),
  ('Womens', 'Curva Ropa Amplia', '{"XS": 2, "S": 3, "M": 4, "L": 4, "XL": 3, "XXL": 2}'::jsonb, now())
ON CONFLICT (genero, nombre) DO NOTHING;

-- =====================================================
-- 5. CREAR TABLA vendedores_users
-- =====================================================

-- Tabla para vincular usuarios de auth con vendedores
CREATE TABLE IF NOT EXISTS vendedores_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE vendedores_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. FUNCIONES HELPER PARA vendedores_users
-- =====================================================

-- Función para obtener el vendedor_id de un usuario
CREATE OR REPLACE FUNCTION public.get_vendedor_id(p_user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendedor_id FROM public.vendedores_users
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- Función para verificar si un usuario es vendedor
CREATE OR REPLACE FUNCTION public.is_vendedor(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendedores_users
    WHERE user_id = p_user_id
  );
$$;

-- =====================================================
-- 7. POLÍTICAS RLS PARA vendedores_users
-- =====================================================

-- Admin puede ver todos los vendedores_users
CREATE POLICY "Admin puede ver vendedores_users"
ON vendedores_users FOR SELECT
USING (public.is_admin(auth.uid()));

-- Vendedor puede ver su propio registro
CREATE POLICY "Vendedor puede ver su propio registro"
ON vendedores_users FOR SELECT
USING (user_id = auth.uid());

-- Admin puede insertar vendedores_users
CREATE POLICY "Admin puede insertar vendedores_users"
ON vendedores_users FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Admin puede actualizar vendedores_users
CREATE POLICY "Admin puede actualizar vendedores_users"
ON vendedores_users FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admin puede eliminar vendedores_users
CREATE POLICY "Admin puede eliminar vendedores_users"
ON vendedores_users FOR DELETE
USING (public.is_admin(auth.uid()));

-- =====================================================
-- 8. ACTUALIZAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Actualizar política de clientes para permitir que vendedores vean sus clientes
DROP POLICY IF EXISTS "Vendedor puede ver sus clientes" ON clientes;
CREATE POLICY "Vendedor puede ver sus clientes"
ON clientes FOR SELECT
USING (vendedor_id = public.get_vendedor_id(auth.uid()));

-- Actualizar política de pedidos para permitir que vendedores vean pedidos de sus clientes
DROP POLICY IF EXISTS "Vendedor puede ver pedidos de sus clientes" ON pedidos;
CREATE POLICY "Vendedor puede ver pedidos de sus clientes"
ON pedidos FOR SELECT
USING (
  vendedor_id = public.get_vendedor_id(auth.uid())
  OR cliente_id IN (
    SELECT id FROM clientes
    WHERE vendedor_id = public.get_vendedor_id(auth.uid())
  )
);

-- =====================================================
-- 9. VERIFICACIONES FINALES
-- =====================================================

-- Verificar que la tabla curvas_predefinidas existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'curvas_predefinidas'
  ) THEN
    RAISE EXCEPTION 'La tabla curvas_predefinidas no existe después de la migración';
  END IF;
END $$;

-- Verificar que la tabla pedidos_detalles existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'pedidos_detalles'
  ) THEN
    RAISE EXCEPTION 'La tabla pedidos_detalles no existe después de la migración';
  END IF;
END $$;

-- Verificar que la marca New Balance existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM marcas
    WHERE id = 'e4508c9c-4b19-4790-b0ec-6e4712973ea3'
  ) THEN
    RAISE EXCEPTION 'La marca New Balance no fue insertada correctamente';
  END IF;
END $$;

-- =====================================================
-- 10. COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE vendedores_users IS 'Vincula usuarios de autenticación con registros de vendedores';
COMMENT ON TABLE curvas_predefinidas IS 'Curvas de talles predefinidas para productos (renombrada desde curvas)';
COMMENT ON TABLE pedidos_detalles IS 'Detalles de productos en cada pedido (renombrada desde items_pedido)';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
