-- Migración para corregir la estructura de carritos_pendientes
-- Esta migración asegura que la tabla tenga la estructura correcta para el nuevo sistema de carritos

-- 1. Agregar campos faltantes si no existen
ALTER TABLE carritos_pendientes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS total_items INTEGER,
ADD COLUMN IF NOT EXISTS total_unidades INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_user_id ON carritos_pendientes(user_id);
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_expires_at ON carritos_pendientes(expires_at);

-- 3. Actualizar políticas RLS para incluir user_id
DROP POLICY IF EXISTS "Clients can manage their own cart" ON carritos_pendientes;
DROP POLICY IF EXISTS "Admins can view all carts" ON carritos_pendientes;
DROP POLICY IF EXISTS "Superadmins can do everything" ON carritos_pendientes;

-- Policy: Los clientes pueden ver y gestionar sus propios carritos (por user_id)
CREATE POLICY "Clients can manage their own cart by user_id" ON carritos_pendientes
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Policy: Los clientes también pueden gestionar por cliente_id (compatibilidad)
CREATE POLICY "Clients can manage their own cart by cliente_id" ON carritos_pendientes
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

-- 4. Agregar comentarios para documentar la nueva estructura
COMMENT ON COLUMN carritos_pendientes.user_id IS 'ID del usuario propietario del carrito (nuevo sistema)';
COMMENT ON COLUMN carritos_pendientes.items IS 'JSON con todos los items del carrito: [{"productoId": "uuid", "talles": {"S": 1, "M": 2}, ...}]';
COMMENT ON COLUMN carritos_pendientes.total_items IS 'Total de productos únicos en el carrito';
COMMENT ON COLUMN carritos_pendientes.total_unidades IS 'Total de unidades (suma de todas las cantidades)';
COMMENT ON COLUMN carritos_pendientes.expires_at IS 'Fecha de expiración del carrito (30 días por defecto)';

-- 5. Función para limpiar carritos expirados
CREATE OR REPLACE FUNCTION limpiar_carritos_expirados()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM carritos_pendientes 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para establecer expires_at automáticamente
CREATE OR REPLACE FUNCTION set_cart_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se especifica expires_at, establecer 30 días desde ahora
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_set_cart_expires_at ON carritos_pendientes;
CREATE TRIGGER trigger_set_cart_expires_at
  BEFORE INSERT ON carritos_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION set_cart_expires_at();

-- 7. Migrar datos existentes si los hay (del formato antiguo al nuevo)
-- Esto convierte registros individuales en un solo registro por usuario
DO $$
DECLARE
  cart_record RECORD;
  user_items JSONB;
  total_items_count INTEGER;
  total_unidades_count INTEGER;
BEGIN
  -- Solo ejecutar si hay datos en el formato antiguo
  IF EXISTS (SELECT 1 FROM carritos_pendientes WHERE user_id IS NULL LIMIT 1) THEN
    
    -- Agrupar por cliente_id y crear registros consolidados
    FOR cart_record IN 
      SELECT 
        cliente_id,
        jsonb_agg(
          jsonb_build_object(
            'productoId', producto_id,
            'curvaId', curva_id,
            'cantidadCurvas', cantidad_curvas,
            'talles', talles,
            'tipo', tipo,
            'genero', genero,
            'opcion', opcion,
            'precioUsd', precio_usd
          )
        ) as items_aggregated,
        COUNT(*) as total_items,
        SUM(
          (SELECT SUM(value::INTEGER) FROM jsonb_each_text(talles))
        ) as total_unidades
      FROM carritos_pendientes 
      WHERE user_id IS NULL
      GROUP BY cliente_id
    LOOP
      
      -- Crear nuevo registro consolidado
      INSERT INTO carritos_pendientes (
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        expires_at,
        created_at,
        updated_at
      ) VALUES (
        cart_record.cliente_id, -- Usar cliente_id como user_id temporalmente
        cart_record.cliente_id,
        cart_record.items_aggregated,
        cart_record.total_items,
        cart_record.total_unidades,
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
      )
      ON CONFLICT (cliente_id) DO UPDATE SET
        items = EXCLUDED.items,
        total_items = EXCLUDED.total_items,
        total_unidades = EXCLUDED.total_unidades,
        updated_at = NOW();
      
    END LOOP;
    
    -- Eliminar registros antiguos
    DELETE FROM carritos_pendientes WHERE user_id IS NULL;
    
    RAISE NOTICE 'Migración de carritos completada: % registros consolidados', cart_record.cliente_id;
  END IF;
END $$;


