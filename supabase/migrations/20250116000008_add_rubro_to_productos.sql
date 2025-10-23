-- Agregar campo rubro a la tabla productos
ALTER TABLE public.productos 
ADD COLUMN rubro TEXT CHECK (rubro IN ('Prendas', 'Calzados', 'Accesorios'));

-- Actualizar productos existentes con rubro por defecto basado en categoría
UPDATE public.productos 
SET rubro = 'Calzados' 
WHERE categoria ILIKE '%calzado%' OR categoria ILIKE '%zapato%' OR categoria ILIKE '%zapatilla%';

UPDATE public.productos 
SET rubro = 'Prendas' 
WHERE categoria ILIKE '%ropa%' OR categoria ILIKE '%camiseta%' OR categoria ILIKE '%pantalon%' OR categoria ILIKE '%hoodie%';

UPDATE public.productos 
SET rubro = 'Accesorios' 
WHERE categoria ILIKE '%accesorio%' OR categoria ILIKE '%mochila%' OR categoria ILIKE '%gorra%' OR categoria ILIKE '%bolso%';

-- Establecer rubro como NOT NULL después de actualizar datos existentes
ALTER TABLE public.productos 
ALTER COLUMN rubro SET NOT NULL;

-- Crear índice para mejorar performance en consultas por rubro
CREATE INDEX idx_productos_rubro ON public.productos(rubro);

-- Actualizar políticas RLS para incluir filtros por rubro si es necesario
-- (Las políticas existentes ya cubren el acceso por marca, esto es adicional)

-- Política para clientes: pueden ver productos de su rubro asignado (si se implementa en el futuro)
-- CREATE POLICY "Cliente puede ver productos de su rubro asignado"
-- ON public.productos FOR SELECT
-- USING (
--   public.is_client(auth.uid()) 
--   AND rubro IN (
--     SELECT rubro_asignado FROM public.clientes 
--     WHERE id IN (
--       SELECT cliente_id FROM public.user_roles 
--       WHERE user_id = auth.uid() AND role = 'cliente'
--     )
--   )
-- );
