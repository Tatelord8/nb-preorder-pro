-- Tabla para guardar snapshots de carritos
-- Permite recuperar carritos en caso de pérdida de datos
-- Se guardan snapshots automáticos cada 10, 20, 50, 100 items

CREATE TABLE carritos_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrito_id UUID REFERENCES carritos_pendientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL,
  items JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  total_unidades INTEGER NOT NULL,
  snapshot_reason TEXT NOT NULL CHECK (
    snapshot_reason IN ('manual', 'auto_10', 'auto_20', 'auto_50', 'auto_100', 'auto_periodic', 'before_checkout')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_carritos_snapshots_carrito_id ON carritos_snapshots(carrito_id);
CREATE INDEX idx_carritos_snapshots_user_id ON carritos_snapshots(user_id);
CREATE INDEX idx_carritos_snapshots_created_at ON carritos_snapshots(created_at);

-- RLS
ALTER TABLE carritos_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own snapshots" ON carritos_snapshots
  FOR SELECT USING (
    user_id = auth.uid() OR cliente_id = auth.uid()
  );

CREATE POLICY "System can insert snapshots" ON carritos_snapshots
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR cliente_id = auth.uid()
  );

CREATE POLICY "Admins can view all snapshots" ON carritos_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Función para crear snapshot automático
CREATE OR REPLACE FUNCTION create_cart_snapshot(
  p_carrito_id UUID,
  p_user_id UUID,
  p_cliente_id UUID,
  p_items JSONB,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_total_items INTEGER;
  v_total_unidades INTEGER;
BEGIN
  -- Calcular totales
  v_total_items := jsonb_array_length(p_items);
  v_total_unidades := calculate_total_unidades(p_items);

  -- Insertar snapshot
  INSERT INTO carritos_snapshots (
    carrito_id,
    user_id,
    cliente_id,
    items,
    total_items,
    total_unidades,
    snapshot_reason
  ) VALUES (
    p_carrito_id,
    p_user_id,
    p_cliente_id,
    p_items,
    v_total_items,
    v_total_unidades,
    p_reason
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para recuperar el último snapshot de un usuario
CREATE OR REPLACE FUNCTION get_latest_cart_snapshot(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  items JSONB,
  total_items INTEGER,
  total_unidades INTEGER,
  snapshot_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.items,
    cs.total_items,
    cs.total_unidades,
    cs.snapshot_reason,
    cs.created_at
  FROM carritos_snapshots cs
  WHERE cs.user_id = p_user_id
  ORDER BY cs.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar snapshots antiguos (mantener solo los últimos 50 por usuario)
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH snapshots_to_keep AS (
    SELECT id
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM carritos_snapshots
    ) ranked
    WHERE rn <= 50
  )
  DELETE FROM carritos_snapshots
  WHERE id NOT IN (SELECT id FROM snapshots_to_keep);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE carritos_snapshots IS 'Snapshots históricos de carritos para recuperación y auditoría';
COMMENT ON COLUMN carritos_snapshots.carrito_id IS 'Referencia al carrito original (puede ser NULL si el carrito fue eliminado)';
COMMENT ON COLUMN carritos_snapshots.snapshot_reason IS 'Razón del snapshot: manual, auto_10 (cada 10 items), auto_20, auto_50, auto_100, auto_periodic (cada 5 seg), before_checkout';
COMMENT ON FUNCTION create_cart_snapshot IS 'Crea un snapshot del estado actual del carrito';
COMMENT ON FUNCTION get_latest_cart_snapshot IS 'Obtiene el snapshot más reciente de un usuario';
COMMENT ON FUNCTION cleanup_old_snapshots IS 'Limpia snapshots antiguos manteniendo solo los 50 más recientes por usuario';
