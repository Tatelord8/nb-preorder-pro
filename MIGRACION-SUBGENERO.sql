-- Migración: Agregar columna subgenero a la tabla productos
-- Aplicar en Supabase SQL Editor
-- Solo se usa para productos con Rubro = Calzados y Género = Unisex

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS subgenero TEXT DEFAULT NULL;

-- Comentario en la columna para referencia
COMMENT ON COLUMN productos.subgenero IS 'Subgénero para calzados Unisex: Womens (tallas 4-8) o Mens (tallas 7-12). Nulo para todos los demás rubros/géneros.';
