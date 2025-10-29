-- Tabla para pedidos en borrador
-- Permite guardar pedidos parciales y continuarlos más tarde
-- Auto-guardado cada 20 items para prevenir pérdida de datos

CREATE TABLE pedidos_borradores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL,
  items JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  total_unidades INTEGER NOT NULL,
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Para guardar estado adicional (selecciones, preferencias, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Índice para encontrar borradores activos del usuario
  CONSTRAINT uq_user_active_draft UNIQUE(user_id, cliente_id)
);

-- Índices
CREATE INDEX idx_pedidos_borradores_user_id ON pedidos_borradores(user_id);
CREATE INDEX idx_pedidos_borradores_cliente_id ON pedidos_borradores(cliente_id);
CREATE INDEX idx_pedidos_borradores_created_at ON pedidos_borradores(created_at);
CREATE INDEX idx_pedidos_borradores_expires_at ON pedidos_borradores(expires_at);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_pedidos_borradores_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.total_items = jsonb_array_length(COALESCE(NEW.items, '[]'::jsonb));
  NEW.total_unidades = calculate_total_unidades(COALESCE(NEW.items, '[]'::jsonb));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pedidos_borradores_metadata
  BEFORE INSERT OR UPDATE ON pedidos_borradores
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_borradores_metadata();

-- RLS
ALTER TABLE pedidos_borradores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own drafts" ON pedidos_borradores
  FOR ALL USING (
    user_id = auth.uid() OR cliente_id = auth.uid()
  );

CREATE POLICY "Admins can view all drafts" ON pedidos_borradores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Función para guardar o actualizar borrador
CREATE OR REPLACE FUNCTION save_draft_order(
  p_user_id UUID,
  p_cliente_id UUID,
  p_items JSONB,
  p_notas TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_draft_id UUID;
BEGIN
  -- Insertar o actualizar borrador
  INSERT INTO pedidos_borradores (
    user_id,
    cliente_id,
    items,
    notas,
    metadata
  ) VALUES (
    p_user_id,
    p_cliente_id,
    p_items,
    p_notas,
    p_metadata
  )
  ON CONFLICT (user_id, cliente_id)
  DO UPDATE SET
    items = EXCLUDED.items,
    notas = EXCLUDED.notas,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_draft_id;

  RETURN v_draft_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener borrador activo de un usuario
CREATE OR REPLACE FUNCTION get_active_draft(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  items JSONB,
  total_items INTEGER,
  total_unidades INTEGER,
  notas TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pb.id,
    pb.items,
    pb.total_items,
    pb.total_unidades,
    pb.notas,
    pb.metadata,
    pb.created_at,
    pb.updated_at
  FROM pedidos_borradores pb
  WHERE pb.user_id = p_user_id
    AND pb.expires_at > NOW()
  ORDER BY pb.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para convertir borrador en pedido real
CREATE OR REPLACE FUNCTION convert_draft_to_order(p_draft_id UUID)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_draft_record RECORD;
BEGIN
  -- Obtener datos del borrador
  SELECT * INTO v_draft_record
  FROM pedidos_borradores
  WHERE id = p_draft_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft order not found';
  END IF;

  -- Aquí se integrará con la creación de pedido real
  -- Por ahora solo retornamos el ID del borrador
  -- En producción, esto debería crear el pedido y los items_pedido

  -- Eliminar el borrador después de convertirlo
  DELETE FROM pedidos_borradores
  WHERE id = p_draft_id;

  RETURN v_draft_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar borradores expirados
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM pedidos_borradores
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE pedidos_borradores IS 'Pedidos en borrador para guardar trabajo en progreso y prevenir pérdida de datos';
COMMENT ON COLUMN pedidos_borradores.items IS 'Array JSONB de items en el pedido borrador';
COMMENT ON COLUMN pedidos_borradores.metadata IS 'Metadata adicional (preferencias, estado de UI, etc.)';
COMMENT ON COLUMN pedidos_borradores.expires_at IS 'Fecha de expiración del borrador (7 días por defecto)';
COMMENT ON FUNCTION save_draft_order IS 'Guarda o actualiza un pedido borrador para un usuario';
COMMENT ON FUNCTION get_active_draft IS 'Obtiene el borrador activo más reciente de un usuario';
COMMENT ON FUNCTION convert_draft_to_order IS 'Convierte un borrador en un pedido real';
COMMENT ON FUNCTION cleanup_expired_drafts IS 'Limpia borradores expirados (ejecutar periódicamente)';
