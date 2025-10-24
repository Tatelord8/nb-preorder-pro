-- Corregir políticas RLS y estructura de la tabla productos

-- Asegurar que la tabla productos tenga todos los campos necesarios
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL;

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS rubro TEXT CHECK (rubro IN ('Prendas', 'Calzados', 'Accesorios'));

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS xfd TEXT;

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

-- Eliminar políticas RLS existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Admin puede ver todos los productos" ON public.productos;
DROP POLICY IF EXISTS "Cliente puede ver productos según su tier" ON public.productos;
DROP POLICY IF EXISTS "Clientes pueden ver todos los productos" ON public.productos;
DROP POLICY IF EXISTS "Admin puede insertar productos" ON public.productos;
DROP POLICY IF EXISTS "Admin puede actualizar productos" ON public.productos;
DROP POLICY IF EXISTS "Admin puede eliminar productos" ON public.productos;

-- Crear políticas RLS simplificadas que funcionen
CREATE POLICY "Superadmin full access to products"
ON public.productos FOR ALL
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Admin can manage their assigned brand products"
ON public.productos FOR ALL
USING (
  public.is_admin(auth.uid()) AND (marca_id IN (SELECT marca_id FROM public.user_roles WHERE user_id = auth.uid()))
)
WITH CHECK (
  public.is_admin(auth.uid()) AND (marca_id IN (SELECT marca_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Client can view products based on their tier and assigned brand"
ON public.productos FOR SELECT
USING (
  public.is_client(auth.uid()) AND (tier = (SELECT t.numero FROM public.user_roles ur JOIN public.tiers t ON ur.tier_id = t.id WHERE ur.user_id = auth.uid()))
  AND (marca_id IN (SELECT marca_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Anonymous can view all products"
ON public.productos FOR SELECT
USING (true);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_productos_marca_id ON public.productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_rubro ON public.productos(rubro);
CREATE INDEX IF NOT EXISTS idx_productos_tier ON public.productos(tier);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos(nombre);
