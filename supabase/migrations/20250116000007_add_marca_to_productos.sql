-- Agregar marca_id a la tabla productos
ALTER TABLE public.productos 
ADD COLUMN marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL;

-- Actualizar políticas para incluir marca_id en productos
DROP POLICY IF EXISTS "Admin y Superadmin pueden ver todos los productos" ON public.productos;
DROP POLICY IF EXISTS "Admin y Superadmin pueden insertar productos" ON public.productos;
DROP POLICY IF EXISTS "Admin y Superadmin pueden actualizar productos" ON public.productos;
DROP POLICY IF EXISTS "Admin y Superadmin pueden eliminar productos" ON public.productos;

-- Políticas para Superadmin (acceso total)
CREATE POLICY "Superadmin puede ver todos los productos"
ON public.productos FOR SELECT
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin puede insertar productos"
ON public.productos FOR INSERT
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin puede actualizar productos"
ON public.productos FOR UPDATE
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin puede eliminar productos"
ON public.productos FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- Políticas para Admin (solo productos de su marca asignada)
CREATE POLICY "Admin puede ver productos de su marca"
ON public.productos FOR SELECT
USING (
  public.is_admin(auth.uid()) 
  AND marca_id IN (
    SELECT marca_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin puede insertar productos de su marca"
ON public.productos FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid()) 
  AND marca_id IN (
    SELECT marca_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin puede actualizar productos de su marca"
ON public.productos FOR UPDATE
USING (
  public.is_admin(auth.uid()) 
  AND marca_id IN (
    SELECT marca_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin puede eliminar productos de su marca"
ON public.productos FOR DELETE
USING (
  public.is_admin(auth.uid()) 
  AND marca_id IN (
    SELECT marca_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para Clientes (solo productos de su marca asignada)
CREATE POLICY "Cliente puede ver productos de su marca"
ON public.productos FOR SELECT
USING (
  public.is_client(auth.uid()) 
  AND marca_id IN (
    SELECT m.marca_id FROM public.user_roles ur
    JOIN public.clientes c ON ur.cliente_id = c.id
    JOIN public.marcas m ON c.marca_id = m.id
    WHERE ur.user_id = auth.uid() AND ur.role = 'cliente'
  )
);

-- Políticas para usuarios anónimos (solo productos activos)
CREATE POLICY "Usuarios anónimos pueden ver productos activos"
ON public.productos FOR SELECT
USING (
  auth.role() = 'anon'
  AND marca_id IN (SELECT id FROM public.marcas WHERE activa = true)
);
