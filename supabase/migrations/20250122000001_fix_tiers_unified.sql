-- Unificar jerarquía de Tiers a 4 niveles (0, 1, 2, 3)
-- Tier 0 = Más alto (Premium)
-- Tier 1 = Alto (Gold)
-- Tier 2 = Medio (Silver)
-- Tier 3 = Bajo (Bronze)

-- Eliminar la tabla tiers existente si tiene estructura incorrecta
DROP TABLE IF EXISTS public.tiers CASCADE;

-- Crear tabla de tiers con la estructura correcta
CREATE TABLE public.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE CHECK (numero IN ('0', '1', '2', '3')),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar tiers con la jerarquía correcta
INSERT INTO public.tiers (numero, nombre, descripcion, orden) VALUES
  ('0', 'Premium', 'Tier más alto - Acceso completo', 0),
  ('1', 'Gold', 'Tier alto - Acceso amplio', 1),
  ('2', 'Silver', 'Tier medio - Acceso estándar', 2),
  ('3', 'Bronze', 'Tier bajo - Acceso básico', 3);

-- Actualizar CHECK constraint en tabla clientes para usar '0', '1', '2', '3'
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_tier_check;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_tier_check CHECK (tier IN ('0', '1', '2', '3'));

-- Actualizar CHECK constraint en tabla productos para usar '0', '1', '2', '3'
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_tier_check;
ALTER TABLE public.productos ADD CONSTRAINT productos_tier_check CHECK (tier IN ('0', '1', '2', '3'));

-- Convertir datos existentes si hay registros con valores antiguos
-- A o 1 (si era el antiguo tier 1 que significa básico) -> 3 (Bronze)
UPDATE public.clientes SET tier = '3' WHERE tier IN ('A', '1');
UPDATE public.productos SET tier = '3' WHERE tier IN ('A', '1');

-- B o 2 (si era el antiguo tier 2 que significa intermedio) -> 2 (Silver)
UPDATE public.clientes SET tier = '2' WHERE tier IN ('B', '2');
UPDATE public.productos SET tier = '2' WHERE tier IN ('B', '2');

-- C o 3 (si era el antiguo tier 3 que significa avanzado) -> 1 (Gold)
UPDATE public.clientes SET tier = '1' WHERE tier IN ('C', '3');
UPDATE public.productos SET tier = '1' WHERE tier IN ('C', '3');

-- D o 4 (si era el antiguo tier 4 que significa premium) -> 0 (Premium)
UPDATE public.clientes SET tier = '0' WHERE tier IN ('D', '4');
UPDATE public.productos SET tier = '0' WHERE tier IN ('D', '4');

-- Actualizar valores T1-T4 si existen
UPDATE public.clientes SET tier = '3' WHERE tier = 'T1';
UPDATE public.productos SET tier = '3' WHERE tier = 'T1';

UPDATE public.clientes SET tier = '2' WHERE tier = 'T2';
UPDATE public.productos SET tier = '2' WHERE tier = 'T2';

UPDATE public.clientes SET tier = '1' WHERE tier = 'T3';
UPDATE public.productos SET tier = '1' WHERE tier = 'T3';

UPDATE public.clientes SET tier = '0' WHERE tier = 'T4';
UPDATE public.productos SET tier = '0' WHERE tier = 'T4';

-- Agregar columnas a user_roles si no existen
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tier_id UUID;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS marca_id UUID;

-- Comentarios para documentar
COMMENT ON TABLE public.tiers IS 'Tabla de jerarquía de tiers de clientes (0=Premium, 1=Gold, 2=Silver, 3=Bronze)';
COMMENT ON COLUMN public.tiers.numero IS 'Identificador del tier: 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)';
COMMENT ON COLUMN public.tiers.orden IS 'Orden jerárquico: 0 = mayor nivel (Premium), 3 = menor nivel (Bronze)';
COMMENT ON TABLE public.user_roles IS 'Tabla de roles de usuario con soporte para superadmin, admin y cliente';
COMMENT ON COLUMN public.user_roles.role IS 'Rol del usuario: superadmin (acceso total), admin (gestión de marca), cliente (comprador)';
COMMENT ON COLUMN public.user_roles.tier_id IS 'ID del tier del cliente (solo para clientes)';
COMMENT ON COLUMN public.user_roles.marca_id IS 'ID de la marca asignada (para admins)';
COMMENT ON COLUMN public.clientes.tier IS 'Tier del cliente: 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)';
COMMENT ON COLUMN public.productos.tier IS 'Tier del producto: 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)';
