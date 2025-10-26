# 🔍 REPORTE DE INCONSISTENCIAS DE BASE DE DATOS
**Fecha:** 26/10/2025
**Base de datos:** https://oszmlmscckrbfnjrveet.supabase.co
**Estado:** Base de datos en producción con inconsistencias críticas

---

## 📊 RESUMEN EJECUTIVO

La base de datos está parcialmente inicializada con **1,305 productos** pero carece de datos fundamentales en tablas relacionadas. Existen **7 inconsistencias críticas** entre el schema esperado por la aplicación y el schema real de la DB.

### Estado Actual de Tablas:
| Tabla | Estado | Registros | Criticidad |
|-------|--------|-----------|------------|
| ✅ productos | CON DATOS | 1,305 | Normal |
| ✅ tiers | CON DATOS | 4 | Normal |
| ⚠️ clientes | VACÍA | 0 | **ALTA** |
| ⚠️ vendedores | VACÍA | 0 | **ALTA** |
| ⚠️ marcas | VACÍA | 0 | **ALTA** |
| ⚠️ user_roles | VACÍA | 0 | **CRÍTICA** |
| ⚠️ pedidos | VACÍA | 0 | Normal |
| ❌ curvas_predefinidas | NO EXISTE | - | **CRÍTICA** |
| ❌ pedidos_detalles | NO EXISTE | - | **CRÍTICA** |

---

## 🚨 INCONSISTENCIAS CRÍTICAS DETECTADAS

### 1. CONFLICTO DE CREDENCIALES SUPABASE (CONFIRMADO) ⚠️⚠️⚠️

**Problema:**
```bash
# En .env
VITE_SUPABASE_URL="https://jhsrplkxvcxyoqyfogaa.supabase.co"

# En client.ts (HARDCODED - líneas 7-8)
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
```

**Impacto Real:**
- Tu aplicación **NO usa las variables de entorno**
- Está conectada a `oszmlmscckrbfnjrveet` (hardcoded)
- Las credenciales en `.env` apuntan a `jhsrplkxvcxyoqyfogaa` (diferente instancia)
- Imposible cambiar de entorno (dev/staging/prod)

**Solución:**
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

Luego actualizar `.env` con las credenciales correctas de `oszmlmscckrbfnjrveet`.

---

### 2. TABLA `curvas_predefinidas` NO EXISTE ❌

**Problema:**
La aplicación espera una tabla llamada `curvas_predefinidas` pero en la DB existe `curvas`.

**Evidencia:**
```
❌ Error al obtener datos: Could not find the table 'public.curvas_predefinidas' in the schema cache
```

**Archivos afectados:**
- `src/pages/Cart.tsx` - Referencia a `curvas_predefinidas`
- Cualquier componente que consulte curvas predefinidas

**Impacto:**
- Los usuarios NO pueden seleccionar curvas predefinidas en el carrito
- Error al intentar cargar curvas en ProductDetail
- Funcionalidad de talles predefinidos completamente rota

**Solución:**
Opción A (Recomendada): Renombrar la tabla en la DB
```sql
ALTER TABLE curvas RENAME TO curvas_predefinidas;
```

Opción B: Actualizar el código para usar `curvas`
```typescript
// Buscar y reemplazar en toda la app:
.from('curvas_predefinidas') → .from('curvas')
```

---

### 3. TABLA `pedidos_detalles` NO EXISTE ❌

**Problema:**
La aplicación espera `pedidos_detalles` pero en la DB existe `items_pedido`.

**Evidencia:**
```
❌ Error: Could not find the table 'public.pedidos_detalles' in the schema cache
```

**Schema real en DB:**
```sql
-- En migración 20251013012838
CREATE TABLE public.items_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id),
  producto_id UUID NOT NULL REFERENCES public.productos(id),
  curva_id UUID REFERENCES public.curvas(id),
  cantidad_curvas INTEGER NOT NULL,
  talles_cantidades JSONB NOT NULL,
  subtotal_usd DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ
);
```

**Impacto:**
- NO se pueden crear pedidos
- NO se pueden guardar detalles de productos en pedidos
- La funcionalidad de checkout está completamente rota

**Solución:**
Opción A (Recomendada): Renombrar la tabla
```sql
ALTER TABLE items_pedido RENAME TO pedidos_detalles;
```

Opción B: Actualizar el código
```typescript
// Buscar y reemplazar:
.from('pedidos_detalles') → .from('items_pedido')
```

---

### 4. COLUMNA `user_roles.vendedor_id` NO EXISTE ❌

**Problema:**
La aplicación intenta acceder a `user_roles.vendedor_id` pero esta columna no existe en el schema.

**Evidencia:**
```
❌ Error: column user_roles.vendedor_id does not exist
```

**Schema real:**
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cliente')),
  cliente_id UUID REFERENCES public.clientes(id),  -- ✅ Existe
  -- vendedor_id NO EXISTE ❌
  created_at TIMESTAMPTZ
);
```

**Impacto:**
- Los vendedores NO pueden ser vinculados a usuarios
- Sistema de permisos de vendedores incompleto
- Posible error al intentar obtener información de vendedor logueado

**Solución:**
Opción A: Agregar la columna si se necesita
```sql
ALTER TABLE user_roles
ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE CASCADE;
```

Opción B: Crear tabla separada `vendedores_users`
```sql
CREATE TABLE vendedores_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  vendedor_id UUID NOT NULL REFERENCES vendedores(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 5. TABLAS VACÍAS CON DATOS ESPERADOS ⚠️

**Problema:**
Varias tablas fundamentales están vacías pero deberían tener datos iniciales.

**Tablas afectadas:**

#### A) `vendedores` (0 registros)
**Esperado:** La migración inicial debería haber insertado 3 vendedores
```sql
-- En 20251013012838_1c2a9a4b-3501-4def-b280-702497a5c3a2.sql:241-245
INSERT INTO public.vendedores (nombre) VALUES
  ('Silvio Lencina'),
  ('Cesar Zarate'),
  ('Arturo Fernandez');
```

**¿Por qué falló?** La migración no se ejecutó o fue revertida.

#### B) `marcas` (0 registros)
**Problema:** Todos los productos tienen `marca_id` pero la tabla `marcas` está vacía.
```
Productos con marca_id: 1,305
Marcas en DB: 0
```

**Impacto:**
- Foreign key apunta a registros inexistentes
- NO se puede mostrar el nombre de la marca en la UI
- Posible error al hacer JOIN con marcas

**Datos encontrados:**
```javascript
// Todos los productos tienen este marca_id:
marca_id: "e4508c9c-4b19-4790-b0ec-6e4712973ea3"
```

**Solución:**
```sql
-- Insertar la marca faltante
INSERT INTO marcas (id, nombre)
VALUES ('e4508c9c-4b19-4790-b0ec-6e4712973ea3', 'New Balance');
```

#### C) `user_roles` (0 registros) - **CRÍTICO**
**Impacto:**
- **NADIE puede loguearse** porque no hay roles asignados
- Sistema de permisos completamente roto
- NO se puede distinguir entre admin/cliente/vendedor

**Solución:**
Necesitas crear al menos un superadmin:
```sql
-- Primero, obtén el UUID de tu usuario desde Supabase Dashboard
-- Luego:
INSERT INTO user_roles (user_id, role)
VALUES ('TU_USER_UUID_AQUI', 'admin');
```

#### D) `clientes` (0 registros)
**Impacto:**
- No hay clientes registrados
- Los usuarios con rol 'cliente' no tienen registro asociado
- NO se pueden crear pedidos (requieren cliente_id)

---

### 6. INCONSISTENCIA EN TIERS ⚠️

**Problema:**
La migración original usa tiers `A, B, C, D` pero la aplicación usa `0, 1, 2, 3`.

**Schema original (migración):**
```sql
-- En 20251013012838
tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C', 'D'))
```

**DB actual:**
```javascript
// Tiers en tabla tiers:
Tier 0: Premium
Tier 1: Gold
Tier 2: Silver
Tier 3: Bronze

// Productos en tabla productos:
tier: "1"  // STRING numérico, no letra
```

**Estado:**
Parece que fue corregido en una migración posterior (`20250122000001_fix_tiers_unified.sql`), pero puede causar confusión.

**Verificación necesaria:**
```sql
-- Verificar constraint actual en productos
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE '%tier%';
```

---

### 7. TABLA `curvas` SIN DATOS ⚠️

**Problema:**
La migración inicial debería haber insertado 8 curvas predefinidas (2 por género).

**Esperado en migración (líneas 247-265):**
```sql
INSERT INTO public.curvas (genero, nombre, talles) VALUES
  ('Hombre', 'Curva 1', '{"XS": 1, "S": 2, ...}'::jsonb),
  ('Mujer', 'Curva 1', '{"XS": 1, "S": 2, ...}'::jsonb),
  -- ... 8 curvas total
```

**Impacto:**
- Los usuarios NO pueden usar curvas predefinidas
- Tienen que crear curvas custom manualmente
- Mala experiencia de usuario

**Solución:**
Ejecutar el INSERT de la migración original o crear nuevas curvas.

---

## 🔧 PLAN DE CORRECCIÓN RECOMENDADO

### FASE 1: CORRECCIONES CRÍTICAS INMEDIATAS (1 hora)

#### 1.1 Arreglar credenciales de Supabase
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

```bash
# .env
VITE_SUPABASE_URL="https://oszmlmscckrbfnjrveet.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 1.2 Renombrar tablas inconsistentes
```sql
-- En Supabase SQL Editor
ALTER TABLE curvas RENAME TO curvas_predefinidas;
ALTER TABLE items_pedido RENAME TO pedidos_detalles;
```

#### 1.3 Crear superadmin inicial
```sql
-- Reemplaza con tu user_id real
INSERT INTO user_roles (user_id, role)
VALUES ('TU_USER_UUID_AQUI', 'admin');
```

#### 1.4 Insertar marca faltante
```sql
INSERT INTO marcas (id, nombre, created_at)
VALUES (
  'e4508c9c-4b19-4790-b0ec-6e4712973ea3',
  'New Balance',
  now()
);
```

---

### FASE 2: DATOS INICIALES (30 minutos)

#### 2.1 Insertar vendedores
```sql
INSERT INTO vendedores (nombre) VALUES
  ('Silvio Lencina'),
  ('Cesar Zarate'),
  ('Arturo Fernandez');
```

#### 2.2 Insertar curvas predefinidas
```sql
-- Curvas para Mens (usando la estructura de tallas de calzado NB)
INSERT INTO curvas_predefinidas (genero, nombre, talles) VALUES
  ('Mens', 'Curva Estándar', '{"7": 1, "8": 2, "9": 3, "10": 3, "11": 2, "12": 1}'::jsonb),
  ('Mens', 'Curva Amplia', '{"7": 2, "8": 3, "9": 4, "10": 4, "11": 3, "12": 2}'::jsonb);

-- Curvas para Womens
INSERT INTO curvas_predefinidas (genero, nombre, talles) VALUES
  ('Womens', 'Curva Estándar', '{"5": 1, "6": 2, "7": 3, "8": 3, "9": 2, "10": 1}'::jsonb),
  ('Womens', 'Curva Amplia', '{"5": 2, "6": 3, "7": 4, "8": 4, "9": 3, "10": 2}'::jsonb);
```

---

### FASE 3: CORRECCIÓN DE SCHEMA (1-2 horas)

#### 3.1 Decidir sobre user_roles.vendedor_id

**Opción A: Agregar columna**
```sql
ALTER TABLE user_roles
ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;
```

**Opción B: Tabla separada (recomendado)**
```sql
CREATE TABLE vendedores_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  vendedor_id UUID NOT NULL REFERENCES vendedores(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vendedores_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin puede ver vendedores_users"
ON vendedores_users FOR SELECT
USING (is_admin(auth.uid()));
```

#### 3.2 Verificar y documentar estructura final
Ejecutar:
```bash
node scripts/analyze-db-structure.js > db-structure-final.txt
```

---

## 📋 CHECKLIST DE VERIFICACIÓN POST-CORRECCIÓN

### Base de Datos:
- [ ] Tabla `curvas_predefinidas` existe y tiene datos
- [ ] Tabla `pedidos_detalles` existe (renombrada desde items_pedido)
- [ ] Tabla `marcas` tiene al menos 1 registro
- [ ] Tabla `vendedores` tiene 3 registros
- [ ] Tabla `user_roles` tiene al menos 1 admin
- [ ] Tabla `curvas_predefinidas` tiene al menos 4 curvas
- [ ] Productos tienen `marca_id` válido que existe en `marcas`

### Configuración:
- [ ] `client.ts` usa variables de entorno
- [ ] `.env` tiene las credenciales correctas de `oszmlmscckrbfnjrveet`
- [ ] No hay credenciales hardcodeadas en el código

### Funcionalidad:
- [ ] Login funciona correctamente
- [ ] Usuarios admin pueden ver productos
- [ ] Clientes pueden ver productos según tier
- [ ] Curvas predefinidas se cargan en ProductDetail
- [ ] Se puede agregar productos al carrito
- [ ] Se puede crear un pedido (cuando haya clientes)

---

## 🎯 QUERIES DE DIAGNÓSTICO

Para verificar el estado actual:

```sql
-- 1. Verificar tablas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Contar registros por tabla
SELECT
  'productos' as tabla, COUNT(*) as registros FROM productos
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'vendedores', COUNT(*) FROM vendedores
UNION ALL SELECT 'marcas', COUNT(*) FROM marcas
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'tiers', COUNT(*) FROM tiers;

-- 3. Verificar foreign keys rotas
SELECT p.sku, p.marca_id
FROM productos p
LEFT JOIN marcas m ON p.marca_id = m.id
WHERE m.id IS NULL
LIMIT 10;

-- 4. Verificar estructura de user_roles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_roles';

-- 5. Verificar si curvas existe
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('curvas', 'curvas_predefinidas');
```

---

## 📧 RECOMENDACIONES ADICIONALES

1. **Backup antes de hacer cambios:**
   - Exporta los datos de productos (1,305 registros)
   - Guarda una copia del schema actual

2. **Crear migration de corrección:**
   - No hagas cambios manuales en la DB
   - Crea un archivo de migración con todas las correcciones

3. **Documentar cambios:**
   - Actualiza el README con la estructura real de la DB
   - Documenta las decisiones tomadas (por qué renombrar vs cambiar código)

4. **Testing:**
   - Después de cada corrección, verifica que la app sigue funcionando
   - Prueba el flujo completo: login → ver productos → agregar al carrito → crear pedido

5. **Monitoreo:**
   - Revisa los logs de Supabase después de los cambios
   - Verifica que no haya queries fallando por las tablas renombradas

---

## 🔗 ARCHIVOS RELACIONADOS

- `/AUDITORIA.md` - Auditoría completa del proyecto
- `/scripts/test-supabase-connection.js` - Script de conexión
- `/scripts/analyze-db-structure.js` - Script de análisis
- `/supabase/migrations/20251013012838_*.sql` - Migración inicial
- `/src/integrations/supabase/client.ts:7-8` - Credenciales hardcoded

---

**Última actualización:** 26/10/2025
**Generado por:** Claude Code (análisis automatizado)
