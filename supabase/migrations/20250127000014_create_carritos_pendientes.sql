-- Crear tabla carritos_pendientes para persistir carritos entre sesiones
CREATE TABLE IF NOT EXISTS carritos_pendientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  curva_id TEXT,
  cantidad_curvas INTEGER NOT NULL DEFAULT 1,
  talles JSONB NOT NULL DEFAULT '{}',
  tipo TEXT NOT NULL DEFAULT 'predefined' CHECK (tipo IN ('predefined', 'custom')),
  genero TEXT,
  opcion INTEGER DEFAULT 1,
  precio_usd DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados del mismo producto por cliente
  UNIQUE(cliente_id, producto_id, curva_id, tipo, opcion)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_cliente_id ON carritos_pendientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_producto_id ON carritos_pendientes(producto_id);
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_created_at ON carritos_pendientes(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_carritos_pendientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_carritos_pendientes_updated_at ON carritos_pendientes;
CREATE TRIGGER trigger_update_carritos_pendientes_updated_at
  BEFORE UPDATE ON carritos_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION update_carritos_pendientes_updated_at();

-- RLS Policies
ALTER TABLE carritos_pendientes ENABLE ROW LEVEL SECURITY;

-- Policy: Los clientes pueden ver y gestionar sus propios carritos
CREATE POLICY "Clients can manage their own cart" ON carritos_pendientes
  FOR ALL USING (
    cliente_id = auth.uid()
  );

-- Policy: Los admins pueden ver todos los carritos
CREATE POLICY "Admins can view all carts" ON carritos_pendientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Policy: Los superadmins pueden hacer todo
CREATE POLICY "Superadmins can do everything" ON carritos_pendientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Comentarios
COMMENT ON TABLE carritos_pendientes IS 'Carritos pendientes de los clientes para persistir entre sesiones';
COMMENT ON COLUMN carritos_pendientes.cliente_id IS 'ID del cliente propietario del carrito';
COMMENT ON COLUMN carritos_pendientes.producto_id IS 'ID del producto en el carrito';
COMMENT ON COLUMN carritos_pendientes.curva_id IS 'ID de la curva predefinida o custom';
COMMENT ON COLUMN carritos_pendientes.cantidad_curvas IS 'Cantidad de curvas seleccionadas';
COMMENT ON COLUMN carritos_pendientes.talles IS 'JSON con las cantidades por talle: {"S": 1, "M": 2, "L": 1}';
COMMENT ON COLUMN carritos_pendientes.tipo IS 'Tipo de curva: predefined o custom';
COMMENT ON COLUMN carritos_pendientes.genero IS 'Género del producto';
COMMENT ON COLUMN carritos_pendientes.opcion IS 'Opción de la curva (1, 2, 3, etc.)';
COMMENT ON COLUMN carritos_pendientes.precio_usd IS 'Precio en USD del producto';




