-- Migración para poblar la base de datos con datos de ejemplo
-- Esta migración inserta datos directamente usando SQL

-- Insertar vendedores
INSERT INTO public.vendedores (nombre, email) VALUES
  ('Silvio Lencina', 'silvio@newbalance.com'),
  ('María González', 'maria@newbalance.com'),
  ('Carlos Rodríguez', 'carlos@newbalance.com'),
  ('Ana Martínez', 'ana@newbalance.com')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar marcas adicionales (si no existen)
INSERT INTO public.marcas (nombre, descripcion, activa, color_primario, color_secundario) VALUES
  ('Nike', 'Just Do It', true, '#000000', '#FFFFFF'),
  ('Adidas', 'Impossible is Nothing', true, '#000000', '#FFFFFF'),
  ('New Balance', 'Fearlessly Independent', true, '#000000', '#FFFFFF')
ON CONFLICT (nombre) DO NOTHING;

-- Obtener IDs de vendedores y marcas para usar en clientes
-- Crear clientes con vendedores asignados
INSERT INTO public.clientes (nombre, tier, vendedor_id, marca_id) VALUES
  ('Este shop', 'A', (SELECT id FROM public.vendedores WHERE nombre = 'Silvio Lencina' LIMIT 1), (SELECT id FROM public.marcas WHERE nombre = 'Nike' LIMIT 1)),
  ('Deportes Central', 'B', (SELECT id FROM public.vendedores WHERE nombre = 'María González' LIMIT 1), (SELECT id FROM public.marcas WHERE nombre = 'Adidas' LIMIT 1)),
  ('Sport Max', 'C', (SELECT id FROM public.vendedores WHERE nombre = 'Carlos Rodríguez' LIMIT 1), (SELECT id FROM public.marcas WHERE nombre = 'New Balance' LIMIT 1)),
  ('Athletic Store', 'D', (SELECT id FROM public.vendedores WHERE nombre = 'Ana Martínez' LIMIT 1), (SELECT id FROM public.marcas WHERE nombre = 'Nike' LIMIT 1))
ON CONFLICT (nombre) DO NOTHING;

-- Insertar productos
INSERT INTO public.productos (sku, nombre, precio_usd, linea, categoria, genero, tier, rubro, marca_id, game_plan, xfd, fecha_despacho) VALUES
  -- Nike
  ('NK001', 'Air Max 270', 150.00, 'Air Max', 'Running', 'Hombre', 'A', 'Calzados', (SELECT id FROM public.marcas WHERE nombre = 'Nike' LIMIT 1), false, '2025-02-15', '2025-03-01'),
  ('NK002', 'Air Force 1', 90.00, 'Air Force', 'Lifestyle', 'Unisex', 'B', 'Calzados', (SELECT id FROM public.marcas WHERE nombre = 'Nike' LIMIT 1), true, '2025-02-20', '2025-03-05'),
  -- Adidas
  ('AD001', 'Ultraboost 22', 180.00, 'Ultraboost', 'Running', 'Mujer', 'A', 'Calzados', (SELECT id FROM public.marcas WHERE nombre = 'Adidas' LIMIT 1), false, '2025-02-25', '2025-03-10'),
  ('AD002', 'Stan Smith', 80.00, 'Originals', 'Lifestyle', 'Unisex', 'C', 'Calzados', (SELECT id FROM public.marcas WHERE nombre = 'Adidas' LIMIT 1), false, '2025-03-01', '2025-03-15'),
  -- New Balance
  ('NB001', '990v5', 185.00, '990', 'Running', 'Hombre', 'A', 'Calzados', (SELECT id FROM public.marcas WHERE nombre = 'New Balance' LIMIT 1), true, '2025-03-05', '2025-03-20'),
  ('NB002', '327', 100.00, '327', 'Lifestyle', 'Unisex', 'B', 'Calzados', (SELECT id FROM public.marcas WHERE nombre = 'New Balance' LIMIT 1), false, '2025-03-10', '2025-03-25')
ON CONFLICT (sku) DO NOTHING;

-- Crear pedidos de ejemplo
INSERT INTO public.pedidos (cliente_id, vendedor_id, total_usd, estado) VALUES
  ((SELECT id FROM public.clientes WHERE nombre = 'Este shop' LIMIT 1), (SELECT id FROM public.vendedores WHERE nombre = 'Silvio Lencina' LIMIT 1), 5472.00, 'autorizado'),
  ((SELECT id FROM public.clientes WHERE nombre = 'Este shop' LIMIT 1), (SELECT id FROM public.vendedores WHERE nombre = 'Silvio Lencina' LIMIT 1), 2736.00, 'autorizado')
ON CONFLICT DO NOTHING;

-- Crear items de pedido
INSERT INTO public.items_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal_usd) VALUES
  -- Pedido 1
  ((SELECT id FROM public.pedidos WHERE total_usd = 5472.00 LIMIT 1), (SELECT id FROM public.productos WHERE sku = 'NK001' LIMIT 1), 24, 150.00, 3600.00),
  ((SELECT id FROM public.pedidos WHERE total_usd = 5472.00 LIMIT 1), (SELECT id FROM public.productos WHERE sku = 'NK002' LIMIT 1), 24, 90.00, 2160.00),
  -- Pedido 2
  ((SELECT id FROM public.pedidos WHERE total_usd = 2736.00 LIMIT 1), (SELECT id FROM public.productos WHERE sku = 'AD001' LIMIT 1), 24, 180.00, 4320.00)
ON CONFLICT DO NOTHING;
