-- Corregir subgenero NULL en productos Calzados existentes
-- Ejecutar en Supabase SQL Editor

-- 1. Calzados Mens → subgenero = 'Mens' (tallas 7-12)
UPDATE productos
SET subgenero = 'Mens'
WHERE rubro = 'Calzados'
  AND genero = 'Mens'
  AND subgenero IS NULL;

-- 2. Calzados Womens → subgenero = 'Womens' (tallas 6-10)
UPDATE productos
SET subgenero = 'Womens'
WHERE rubro = 'Calzados'
  AND genero = 'Womens'
  AND subgenero IS NULL;

-- 3. Verificar resultado
SELECT genero, subgenero, COUNT(*) as cantidad
FROM productos
WHERE rubro = 'Calzados'
GROUP BY genero, subgenero
ORDER BY genero, subgenero;
