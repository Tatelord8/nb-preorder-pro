-- Agregar columnas work y silueta a la tabla productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS work boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS silueta text DEFAULT NULL;
