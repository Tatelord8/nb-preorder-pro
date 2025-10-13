-- Crear tabla de vendedores
CREATE TABLE public.vendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C', 'D')),
  vendedor_id UUID REFERENCES public.vendedores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de productos
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  precio_usd DECIMAL(10,2) NOT NULL,
  linea TEXT NOT NULL,
  categoria TEXT NOT NULL,
  genero TEXT NOT NULL CHECK (genero IN ('Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña')),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C', 'D')),
  game_plan BOOLEAN DEFAULT false,
  imagen_url TEXT,
  xfd TEXT,
  fecha_despacho DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de curvas predefinidas
CREATE TABLE public.curvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genero TEXT NOT NULL CHECK (genero IN ('Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña')),
  nombre TEXT NOT NULL,
  talles JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(genero, nombre)
);

-- Crear tabla de pedidos
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES public.vendedores(id) ON DELETE SET NULL,
  total_usd DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de items de pedido
CREATE TABLE public.items_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  curva_id UUID REFERENCES public.curvas(id) ON DELETE SET NULL,
  cantidad_curvas INTEGER NOT NULL CHECK (cantidad_curvas > 0),
  talles_cantidades JSONB NOT NULL,
  subtotal_usd DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;

-- Crear tabla de roles de usuario (admin)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cliente')),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role = 'admin'
  );
$$;

-- Función para obtener el cliente_id de un usuario
CREATE OR REPLACE FUNCTION public.get_cliente_id(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cliente_id FROM public.user_roles
  WHERE user_roles.user_id = get_cliente_id.user_id
  AND role = 'cliente'
  LIMIT 1;
$$;

-- Función para obtener el tier del cliente
CREATE OR REPLACE FUNCTION public.get_cliente_tier(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier FROM public.clientes
  WHERE id = public.get_cliente_id(user_id);
$$;

-- Políticas RLS para vendedores
CREATE POLICY "Admin puede ver todos los vendedores"
ON public.vendedores FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede insertar vendedores"
ON public.vendedores FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede actualizar vendedores"
ON public.vendedores FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Políticas RLS para clientes
CREATE POLICY "Admin puede ver todos los clientes"
ON public.clientes FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede insertar clientes"
ON public.clientes FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede actualizar clientes"
ON public.clientes FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Cliente puede ver su propio registro"
ON public.clientes FOR SELECT
USING (id = public.get_cliente_id(auth.uid()));

-- Políticas RLS para productos
CREATE POLICY "Admin puede ver todos los productos"
ON public.productos FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Cliente puede ver productos según su tier"
ON public.productos FOR SELECT
USING (tier = public.get_cliente_tier(auth.uid()));

CREATE POLICY "Admin puede insertar productos"
ON public.productos FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede actualizar productos"
ON public.productos FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede eliminar productos"
ON public.productos FOR DELETE
USING (public.is_admin(auth.uid()));

-- Políticas RLS para curvas
CREATE POLICY "Todos pueden ver curvas"
ON public.curvas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin puede insertar curvas"
ON public.curvas FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede actualizar curvas"
ON public.curvas FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Políticas RLS para pedidos
CREATE POLICY "Admin puede ver todos los pedidos"
ON public.pedidos FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Cliente puede ver sus propios pedidos"
ON public.pedidos FOR SELECT
USING (cliente_id = public.get_cliente_id(auth.uid()));

CREATE POLICY "Cliente puede insertar sus propios pedidos"
ON public.pedidos FOR INSERT
WITH CHECK (cliente_id = public.get_cliente_id(auth.uid()));

-- Políticas RLS para items_pedido
CREATE POLICY "Admin puede ver todos los items de pedido"
ON public.items_pedido FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Cliente puede ver items de sus propios pedidos"
ON public.items_pedido FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos
    WHERE cliente_id = public.get_cliente_id(auth.uid())
  )
);

CREATE POLICY "Cliente puede insertar items en sus propios pedidos"
ON public.items_pedido FOR INSERT
WITH CHECK (
  pedido_id IN (
    SELECT id FROM public.pedidos
    WHERE cliente_id = public.get_cliente_id(auth.uid())
  )
);

-- Políticas RLS para user_roles
CREATE POLICY "Admin puede ver todos los roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuario puede ver su propio rol"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin puede insertar roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin puede actualizar roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Insertar vendedores iniciales
INSERT INTO public.vendedores (nombre) VALUES
  ('Silvio Lencina'),
  ('Cesar Zarate'),
  ('Arturo Fernandez');

-- Insertar curvas predefinidas para Hombre
INSERT INTO public.curvas (genero, nombre, talles) VALUES
  ('Hombre', 'Curva 1', '{"XS": 1, "S": 2, "M": 3, "L": 3, "XL": 2, "XXL": 1}'::jsonb),
  ('Hombre', 'Curva 2', '{"XS": 2, "S": 3, "M": 4, "L": 4, "XL": 3, "XXL": 2}'::jsonb);

-- Insertar curvas predefinidas para Mujer
INSERT INTO public.curvas (genero, nombre, talles) VALUES
  ('Mujer', 'Curva 1', '{"XS": 1, "S": 2, "M": 3, "L": 3, "XL": 2, "XXL": 1}'::jsonb),
  ('Mujer', 'Curva 2', '{"XS": 2, "S": 3, "M": 4, "L": 4, "XL": 3, "XXL": 2}'::jsonb);

-- Insertar curvas predefinidas para Niño
INSERT INTO public.curvas (genero, nombre, talles) VALUES
  ('Niño', 'Curva 1', '{"4": 1, "6": 2, "8": 3, "10": 3, "12": 2, "14": 1}'::jsonb),
  ('Niño', 'Curva 2', '{"4": 2, "6": 3, "8": 4, "10": 4, "12": 3, "14": 2}'::jsonb);

-- Insertar curvas predefinidas para Niña
INSERT INTO public.curvas (genero, nombre, talles) VALUES
  ('Niña', 'Curva 1', '{"4": 1, "6": 2, "8": 3, "10": 3, "12": 2, "14": 1}'::jsonb),
  ('Niña', 'Curva 2', '{"4": 2, "6": 3, "8": 4, "10": 4, "12": 3, "14": 2}'::jsonb);