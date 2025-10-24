-- Asegurar que todos los campos necesarios existan en la tabla productos

-- Agregar marca_id si no existe
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL;

-- Agregar rubro si no existe
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS rubro TEXT CHECK (rubro IN ('Prendas', 'Calzados', 'Accesorios'));

-- Asegurar que xfd existe (ya debería existir como TEXT)
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS xfd TEXT;

-- Asegurar que fecha_despacho existe como DATE
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS fecha_despacho DATE;

-- Corregir el constraint del tier para usar números
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_tier_check;
ALTER TABLE public.productos ADD CONSTRAINT productos_tier_check 
CHECK (tier IN ('1', '2', '3', '4'));

-- Actualizar productos existentes que tengan tier en formato de letras
UPDATE public.productos 
SET tier = CASE 
    WHEN tier = 'A' THEN '1'
    WHEN tier = 'B' THEN '2' 
    WHEN tier = 'C' THEN '3'
    WHEN tier = 'D' THEN '4'
    ELSE tier
END
WHERE tier IN ('A', 'B', 'C', 'D');

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON public.productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_rubro ON public.productos(rubro);
CREATE INDEX IF NOT EXISTS idx_productos_tier ON public.productos(tier);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos(sku);
