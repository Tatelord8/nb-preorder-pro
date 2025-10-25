-- Agregar campo estado a la tabla pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'autorizado', 'rechazado'));

-- Actualizar pedidos existentes que no tengan estado a 'pendiente'
UPDATE public.pedidos SET estado = 'pendiente' WHERE estado IS NULL;
