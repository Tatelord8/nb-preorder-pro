-- Unificar jerarquía de Tiers a 4 niveles (0, 1, 2, 3)
-- Tier 0 = Más alto (Premium)
-- Tier 1 = Alto (Gold)
-- Tier 2 = Medio (Silver)
-- Tier 3 = Bajo (Bronze)

-- Actualizar CHECK constraint en tabla clientes para usar '0', '1', '2', '3'
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_tier_check;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_tier_check CHECK (tier IN ('0', '1', '2', '3'));

-- Actualizar CHECK constraint en tabla productos para usar '0', '1', '2', '3'
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_tier_check;
ALTER TABLE public.productos ADD CONSTRAINT productos_tier_check CHECK (tier IN ('0', '1', '2', '3'));

-- Convertir datos existentes si hay registros con 'A', 'B', 'C', 'D' o 'T1', 'T2', 'T3', 'T4'
-- A o T1 -> 0 (Premium)
UPDATE public.clientes SET tier = '0' WHERE tier IN ('A', 'T1');
UPDATE public.productos SET tier = '0' WHERE tier IN ('A', 'T1');

-- B o T2 -> 1 (Gold)
UPDATE public.clientes SET tier = '1' WHERE tier IN ('B', 'T2');
UPDATE public.productos SET tier = '1' WHERE tier IN ('B', 'T2');

-- C o T3 -> 2 (Silver)
UPDATE public.clientes SET tier = '2' WHERE tier IN ('C', 'T3');
UPDATE public.productos SET tier = '2' WHERE tier IN ('C', 'T3');

-- D o T4 -> 3 (Bronze)
UPDATE public.clientes SET tier = '3' WHERE tier IN ('D', 'T4');
UPDATE public.productos SET tier = '3' WHERE tier IN ('D', 'T4');

-- Agregar columnas a user_roles si no existen
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tier_id UUID;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS marca_id UUID;

-- Comentarios para documentar
COMMENT ON TABLE public.user_roles IS 'Tabla de roles de usuario con soporte para superadmin, admin y cliente';
COMMENT ON COLUMN public.user_roles.role IS 'Rol del usuario: superadmin (acceso total), admin (gestión de marca), cliente (comprador)';
COMMENT ON COLUMN public.user_roles.tier_id IS 'ID del tier del cliente (solo para clientes)';
COMMENT ON COLUMN public.user_roles.marca_id IS 'ID de la marca asignada (para admins)';
COMMENT ON COLUMN public.clientes.tier IS 'Tier del cliente: 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)';
COMMENT ON COLUMN public.productos.tier IS 'Tier del producto: 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)';
