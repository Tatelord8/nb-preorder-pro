-- Corregir campos de la tabla productos para que coincidan con el frontend

-- Primero, verificar si la columna marca_id existe, si no la agregamos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' AND column_name = 'marca_id') THEN
        ALTER TABLE public.productos 
        ADD COLUMN marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Verificar si la columna rubro existe, si no la agregamos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos' AND column_name = 'rubro') THEN
        ALTER TABLE public.productos 
        ADD COLUMN rubro TEXT CHECK (rubro IN ('Prendas', 'Calzados', 'Accesorios'));
    END IF;
END $$;

-- Actualizar el constraint del tier para usar números en lugar de letras
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

-- Asegurar que las columnas xfd y fecha_despacho existan con los tipos correctos
DO $$ 
BEGIN
    -- Verificar y corregir el tipo de xfd
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'productos' AND column_name = 'xfd' AND data_type = 'text') THEN
        -- xfd puede ser TEXT (fecha como string) o DATE
        -- Lo dejamos como TEXT para flexibilidad
    END IF;
    
    -- Verificar y corregir el tipo de fecha_despacho
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'productos' AND column_name = 'fecha_despacho' AND data_type = 'date') THEN
        -- fecha_despacho debe ser DATE, está correcto
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'productos' AND column_name = 'fecha_despacho') THEN
        -- Si no existe, la creamos
        ALTER TABLE public.productos 
        ADD COLUMN fecha_despacho DATE;
    END IF;
END $$;

-- Actualizar políticas RLS para incluir marca_id si es necesario
-- Las políticas existentes ya deberían funcionar, pero las verificamos

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON public.productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_rubro ON public.productos(rubro);
CREATE INDEX IF NOT EXISTS idx_productos_tier ON public.productos(tier);

-- Verificar que las políticas RLS estén actualizadas
-- Las políticas existentes deberían seguir funcionando
