-- =====================================================
-- MIGRACIÓN: Agregar columna look a productos
-- Fecha: 2026-05-13
-- Descripción: Permite agrupar SKUs en "looks" head-to-toe.
--   NULL = SKU independiente
--   1, 2, 3... = pertenece al look con ese número
-- =====================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS look integer NULL;

COMMENT ON COLUMN productos.look IS 'Agrupa SKUs en looks head-to-toe. NULL = independiente, mismo número = mismo look.';
