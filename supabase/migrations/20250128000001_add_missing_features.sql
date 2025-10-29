-- ============================================================================
-- MIGRACIÓN SIMPLIFICADA: Agregar funcionalidades faltantes
-- ============================================================================
-- La tabla carritos_pendientes ya existe con el schema correcto
-- Solo agregamos: version column, funciones y triggers mejorados
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== AGREGANDO FUNCIONALIDADES FALTANTES ===';
END $$;

-- PASO 1: Agregar columna version si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carritos_pendientes'
    AND column_name = 'version'
  ) THEN
    ALTER TABLE carritos_pendientes
    ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
    RAISE NOTICE 'Columna version agregada';
  ELSE
    RAISE NOTICE 'Columna version ya existe';
  END IF;
END $$;

-- PASO 2: Función para calcular total_unidades desde items JSONB
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

-- PASO 3: Trigger mejorado para actualizar metadata automáticamente
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

-- Eliminar trigger viejo si existe
DROP TRIGGER IF EXISTS trigger_update_carritos_pendientes_updated_at ON carritos_pendientes;
DROP TRIGGER IF EXISTS trigger_update_carritos_pendientes_metadata ON carritos_pendientes;

-- Crear nuevo trigger
CREATE TRIGGER trigger_update_carritos_pendientes_metadata
  BEFORE INSERT OR UPDATE ON carritos_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION update_carritos_pendientes_metadata();

DO $$
BEGIN
  RAISE NOTICE 'Trigger mejorado creado';
END $$;

-- PASO 4: Función para limpiar carritos expirados
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

DO $$
BEGIN
  RAISE NOTICE 'Función cleanup_expired_carts creada';
END $$;

-- PASO 5: Actualizar totales en registros existentes
UPDATE carritos_pendientes
SET
  total_items = jsonb_array_length(items),
  total_unidades = calculate_total_unidades(items),
  version = COALESCE(version, 1)
WHERE total_items IS NULL OR total_unidades IS NULL OR version IS NULL;

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Registros actualizados: %', updated_count;
END $$;

-- PASO 6: Comentarios
COMMENT ON COLUMN carritos_pendientes.version IS 'Versión para optimistic locking (se incrementa en cada update)';
COMMENT ON FUNCTION calculate_total_unidades(JSONB) IS 'Calcula el total de unidades sumando todos los talles de todos los items';
COMMENT ON FUNCTION cleanup_expired_carts() IS 'Elimina carritos expirados y retorna la cantidad eliminada';

DO $$
BEGIN
  RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
END $$;
