-- ============================================================================
-- MIGRACIÓN 1: Corregir schema de carritos_pendientes
-- ============================================================================
-- Problema: La tabla actual tiene UNA FILA POR PRODUCTO (normalizada)
-- Solución: Cambiar a UNA FILA POR USUARIO con items como JSONB array
-- ============================================================================

-- PASO 1: Backup de datos existentes
DO $$
BEGIN
  RAISE NOTICE '=== INICIANDO MIGRACIÓN DE CARRITOS_PENDIENTES ===';
  RAISE NOTICE 'Registros actuales: %', (SELECT COUNT(*) FROM carritos_pendientes);
END $$;

-- Crear tabla temporal con datos respaldados
-- IMPORTANTE: Usar nombres EXACTOS de las columnas actuales
CREATE TEMP TABLE carritos_backup AS
SELECT
  cliente_id,
  jsonb_agg(
    jsonb_build_object(
      'productoId', producto_id::text,          -- Columna: producto_id → JSON: productoId
      'curvaId', curva_id,                      -- Columna: curva_id → JSON: curvaId
      'cantidadCurvas', cantidad_curvas,        -- Columna: cantidad_curvas → JSON: cantidadCurvas
      'talles', talles,                         -- Columna: talles → JSON: talles
      'type', tipo,                             -- Columna: tipo → JSON: type
      'genero', genero,                         -- Columna: genero → JSON: genero
      'opcion', COALESCE(opcion, 1),           -- Columna: opcion → JSON: opcion
      'precio_usd', precio_usd                 -- Columna: precio_usd → JSON: precio_usd
    )
    ORDER BY created_at  -- Mantener orden de inserción
  ) as items,
  COUNT(*) as total_items,
  MIN(created_at) as created_at
FROM carritos_pendientes
GROUP BY cliente_id;

-- Mostrar backup
DO $$
BEGIN
  RAISE NOTICE 'Carritos respaldados: %', (SELECT COUNT(*) FROM carritos_backup);
  RAISE NOTICE 'Items totales respaldados: %', (SELECT SUM(total_items) FROM carritos_backup);
END $$;

-- PASO 2: Eliminar tabla antigua y dependencias
DROP TRIGGER IF EXISTS trigger_update_carritos_pendientes_updated_at ON carritos_pendientes CASCADE;
DROP FUNCTION IF EXISTS update_carritos_pendientes_updated_at() CASCADE;
DROP TABLE IF EXISTS carritos_pendientes CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Tabla antigua eliminada';
END $$;

-- PASO 3: Crear nueva tabla con schema correcto
CREATE TABLE carritos_pendientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_items INTEGER NOT NULL DEFAULT 0,
  total_unidades INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  version INTEGER NOT NULL DEFAULT 1,

  -- Un carrito por usuario
  UNIQUE(user_id)
);

DO $$
BEGIN
  RAISE NOTICE 'Nueva tabla creada';
END $$;

-- PASO 4: Crear índices
CREATE INDEX idx_carritos_pendientes_user_id ON carritos_pendientes(user_id);
CREATE INDEX idx_carritos_pendientes_cliente_id ON carritos_pendientes(cliente_id);
CREATE INDEX idx_carritos_pendientes_created_at ON carritos_pendientes(created_at);
CREATE INDEX idx_carritos_pendientes_expires_at ON carritos_pendientes(expires_at);

DO $$
BEGIN
  RAISE NOTICE 'Índices creados';
END $$;

-- PASO 5: Función para calcular total_unidades desde items JSONB
CREATE OR REPLACE FUNCTION calculate_total_unidades(items_json JSONB)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER := 0;
  item JSONB;
  talle_key TEXT;
  cantidad INTEGER;
BEGIN
  -- Si items es null o vacío, retornar 0
  IF items_json IS NULL OR jsonb_array_length(items_json) = 0 THEN
    RETURN 0;
  END IF;

  -- Iterar sobre cada item en el array
  FOR item IN SELECT * FROM jsonb_array_elements(items_json)
  LOOP
    -- Verificar que el item tenga el campo talles
    IF item ? 'talles' THEN
      -- Iterar sobre cada talle en el objeto talles del item
      FOR talle_key IN SELECT * FROM jsonb_object_keys(item->'talles')
      LOOP
        cantidad := (item->'talles'->talle_key)::INTEGER;
        total := total + COALESCE(cantidad, 0);
      END LOOP;
    END IF;
  END LOOP;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
  RAISE NOTICE 'Función calculate_total_unidades creada';
END $$;

-- PASO 6: Trigger para actualizar metadata automáticamente
CREATE OR REPLACE FUNCTION update_carritos_pendientes_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.total_items = jsonb_array_length(COALESCE(NEW.items, '[]'::jsonb));
  NEW.total_unidades = calculate_total_unidades(COALESCE(NEW.items, '[]'::jsonb));

  -- Incrementar versión en updates (no en inserts)
  IF TG_OP = 'UPDATE' THEN
    NEW.version = COALESCE(OLD.version, 0) + 1;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.version = COALESCE(NEW.version, 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_carritos_pendientes_metadata
  BEFORE INSERT OR UPDATE ON carritos_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION update_carritos_pendientes_metadata();

DO $$
BEGIN
  RAISE NOTICE 'Trigger creado';
END $$;

-- PASO 7: Habilitar RLS
ALTER TABLE carritos_pendientes ENABLE ROW LEVEL SECURITY;

-- PASO 8: Policies de seguridad
CREATE POLICY "Users can manage their own cart" ON carritos_pendientes
  FOR ALL USING (
    user_id = auth.uid() OR cliente_id = auth.uid()
  );

CREATE POLICY "Admins can view all carts" ON carritos_pendientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Superadmins can do everything" ON carritos_pendientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS creadas';
END $$;

-- PASO 9: Restaurar datos desde backup
INSERT INTO carritos_pendientes (user_id, cliente_id, items, created_at)
SELECT
  cliente_id as user_id,  -- Usar cliente_id como user_id inicialmente
  cliente_id,
  items,
  created_at
FROM carritos_backup
ON CONFLICT (user_id) DO NOTHING;  -- Por si hay duplicados

-- Mostrar resultado
DO $$
DECLARE
  restored_count INTEGER;
  total_items_restored INTEGER;
BEGIN
  SELECT COUNT(*), SUM(total_items)
  INTO restored_count, total_items_restored
  FROM carritos_pendientes;

  RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
  RAISE NOTICE 'Carritos restaurados: %', restored_count;
  RAISE NOTICE 'Items totales restaurados: %', total_items_restored;
END $$;

-- PASO 10: Función para limpiar carritos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
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

-- Comentarios
COMMENT ON TABLE carritos_pendientes IS 'Carritos de compras - Una fila por usuario con items como JSONB array';
COMMENT ON COLUMN carritos_pendientes.user_id IS 'ID del usuario autenticado (auth.users.id)';
COMMENT ON COLUMN carritos_pendientes.cliente_id IS 'ID del cliente (puede ser igual a user_id)';
COMMENT ON COLUMN carritos_pendientes.items IS 'Array JSONB de items en el carrito';
COMMENT ON COLUMN carritos_pendientes.total_items IS 'Cantidad de productos únicos (calculado automáticamente via trigger)';
COMMENT ON COLUMN carritos_pendientes.total_unidades IS 'Suma de unidades de todos los talles (calculado automáticamente via trigger)';
COMMENT ON COLUMN carritos_pendientes.version IS 'Versión para optimistic locking (se incrementa en cada update)';
COMMENT ON COLUMN carritos_pendientes.expires_at IS 'Fecha de expiración del carrito (30 días por defecto)';
