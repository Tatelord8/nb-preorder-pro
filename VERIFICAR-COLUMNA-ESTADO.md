# Verificar si la columna `estado` existe en la tabla `pedidos`

## Método 1: Verificar en el Dashboard de Supabase (Recomendado)

### Paso 1: Acceder al Dashboard
1. Ve a https://supabase.com/dashboard
2. Inicia sesión
3. Selecciona tu proyecto: `nb-preorder-pro`

### Paso 2: Ir al Table Editor
1. En el menú lateral, haz clic en **"Table Editor"** (o "Editor de Tablas")
2. Busca la tabla **"pedidos"**
3. Haz clic en ella para abrirla

### Paso 3: Verificar las columnas
La tabla debería mostrar las siguientes columnas:
- `id`
- `cliente_id`
- `vendedor_id`
- `total_usd`
- `created_at`
- `updated_at`
- **`estado`** ← Esta columna debe existir

### Resultado:
- ✅ **Si ves la columna `estado`**: La migración ya está aplicada
- ❌ **Si NO ves la columna `estado`**: Necesitas aplicar la migración

---

## Método 2: Ejecutar SQL en SQL Editor

### Paso 1: Acceder al SQL Editor
1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New Query"**

### Paso 2: Ejecutar esta consulta
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pedidos'
  AND column_name = 'estado';
```

### Paso 3: Ver el resultado
- ✅ **Si aparece una fila con información**: La columna existe
- ❌ **Si NO aparece ninguna fila**: La columna NO existe

---

## Método 3: Intentar una consulta simple

### Ejecuta esta query en SQL Editor:
```sql
SELECT id, estado 
FROM pedidos 
LIMIT 5;
```

### Resultado:
- ✅ **Si funciona sin error**: La columna existe
- ❌ **Si aparece error "column 'estado' does not exist"**: La columna NO existe

---

## Si la columna NO existe

Ejecuta esta SQL para crearla:

```sql
-- Agregar campo estado a la tabla pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' 
CHECK (estado IN ('pendiente', 'autorizado', 'rechazado'));

-- Actualizar pedidos existentes que no tengan estado a 'pendiente'
UPDATE public.pedidos 
SET estado = 'pendiente' 
WHERE estado IS NULL;
```

---

## Verificar que funcionó

Después de ejecutar la migración, ejecuta esta query para verificar:

```sql
SELECT 
  estado,
  COUNT(*) as cantidad
FROM pedidos
GROUP BY estado;
```

Deberías ver algo como:
```
estado      | cantidad
------------|----------
pendiente   | 3
autorizado  | 0
rechazado   | 0
```
