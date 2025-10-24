-- Corregir el tipo de campo XFD de TEXT a DATE para mejor manejo de fechas

-- Cambiar el tipo de xfd de TEXT a DATE
ALTER TABLE public.productos 
ALTER COLUMN xfd TYPE DATE USING xfd::DATE;

-- Crear índice para mejorar performance en consultas por fecha
CREATE INDEX IF NOT EXISTS idx_productos_xfd ON public.productos(xfd);

-- Comentario: El campo xfd ahora es de tipo DATE para mejor manejo de fechas
-- y consultas optimizadas por rango de fechas
