# Aplicar Migración: Campo Estado en Tabla Pedidos

## Problema
El contador de "Pedidos Pendientes" muestra 0 porque la tabla `pedidos` no tiene el campo `estado`.

## Solución
Aplicar manualmente la migración en el dashboard de Supabase.

## Pasos

### 1. Acceder al Dashboard de Supabase
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: `nb-preorder-pro`

### 2. Ejecutar el SQL
1. Ve a la sección **SQL Editor** en el menú lateral
2. Clic en **New Query**
3. Copia y pega el siguiente SQL:

```sql
-- Agregar campo estado a la tabla pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'autorizado', 'rechazado'));

-- Actualizar pedidos existentes que no tengan estado a 'pendiente'
UPDATE public.pedidos SET estado = 'pendiente' WHERE estado IS NULL;
```

4. Haz clic en **Run** (o presiona Ctrl+Enter)

### 3. Verificar la Migración
1. Ve a la sección **Table Editor**
2. Abre la tabla `pedidos`
3. Verifica que ahora tiene una columna `estado` con valor `'pendiente'` para todos los pedidos

### 4. Probar el Dashboard
1. Recarga la página del Dashboard
2. El contador de "Pedidos Pendientes" ahora debería mostrar el número correcto de pedidos

## Nota
Si el dashboard sigue mostrando 0, verifica que:
1. Existen pedidos en la tabla `pedidos`
2. Los pedidos tienen `estado = 'pendiente'` o `estado IS NULL`
3. El usuario Superadmin tiene permisos para ver los pedidos
