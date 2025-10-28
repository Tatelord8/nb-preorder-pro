# 🧪 Guía de Testing: Sistema UPSERT de Productos

Esta guía te ayudará a probar el nuevo sistema UPSERT que permite actualizar productos existentes o insertar nuevos sin perder datos históricos.

---

## 📋 Qué se implementó

### 1. Sistema UPSERT
- **Antes:** Solo INSERT → Error si el SKU ya existe
- **Ahora:** UPSERT → Actualiza si existe, inserta si es nuevo
- **Beneficio:** Puedes recargar todo tu CSV para actualizar precios y datos sin perder:
  - ✅ IDs de productos
  - ✅ Historial de pedidos
  - ✅ Carritos actuales
  - ✅ Imágenes vinculadas

### 2. Contador de Productos en Catálogo
- Muestra cantidad total de productos en el rubro
- Cuando buscas, muestra: "X de Y productos"

---

## 🧪 Testing del Sistema UPSERT

### Escenario 1: Actualizar precios de productos existentes

**Objetivo:** Verificar que los precios se actualizan sin perder datos

**Pasos:**

1. **Obtener SKUs actuales:**
   - Ve a módulo Productos
   - Anota 3-5 SKUs de productos existentes
   - Anota sus IDs actuales (importante para verificar después)
   - Ejemplo: `M1080108`, `G5202J2`, `BB480-002`

2. **Preparar CSV de actualización:**
   - Abre `plantilla-carga-productos.csv`
   - Pon los 3-5 SKUs que anotaste
   - **Cambia los precios** (ej: si era 125.50 → pon 130.00)
   - Puedes cambiar también: nombre, categoría, tier, etc.

3. **Ejecutar carga masiva:**
   - Ve a módulo Productos
   - Click en "Carga Masiva"
   - Sube tu CSV
   - Espera a que termine

4. **Verificar resultados:**
   - ✅ Debería decir: "X productos procesados exitosamente (actualizados o insertados)"
   - ✅ Los productos deben aparecer con los nuevos precios
   - ✅ Los IDs **NO deben cambiar** (verifica que sean los mismos que anotaste)
   - ✅ Las imágenes deben seguir ahí (si tenían)

---

### Escenario 2: Mix de productos nuevos y existentes

**Objetivo:** Verificar que actualiza existentes e inserta nuevos

**Pasos:**

1. **Preparar CSV con mix:**
   - 3 SKUs que ya existen (con precios actualizados)
   - 2 SKUs completamente nuevos
   - Total: 5 productos en el CSV

2. **Ejecutar carga:**
   - Sube el CSV
   - Espera resultado

3. **Verificar:**
   - ✅ Los 3 existentes deben actualizarse (mantener IDs)
   - ✅ Los 2 nuevos deben insertarse (con IDs nuevos)
   - ✅ Total de productos debe aumentar en 2

---

### Escenario 3: Verificar relaciones con pedidos

**Objetivo:** Asegurar que pedidos históricos no se pierden

**Pasos:**

1. **Identificar producto con pedidos:**
   - Ve a módulo Pedidos
   - Encuentra un pedido que tenga productos
   - Anota el SKU de un producto del pedido
   - Anota el ID del producto

2. **Actualizar ese producto:**
   - Prepara CSV con ese SKU
   - Cambia el precio
   - Sube el CSV

3. **Verificar relación:**
   - ✅ El producto debe actualizarse
   - ✅ El ID debe ser el mismo
   - ✅ Ve al pedido original → el producto debe seguir ahí
   - ✅ Los detalles del pedido no deben cambiar (mantiene el precio histórico)

---

### Escenario 4: Verificar carritos activos

**Objetivo:** Asegurar que carritos no se pierden

**Pasos:**

1. **Crear carrito con productos:**
   - Como usuario cliente, agrega 2-3 productos al carrito
   - Anota los SKUs

2. **Actualizar esos productos:**
   - Como superadmin, prepara CSV con esos SKUs
   - Cambia precios
   - Sube el CSV

3. **Verificar carrito:**
   - ✅ Vuelve a la sesión de cliente
   - ✅ El carrito debe seguir teniendo los productos
   - ✅ Los nuevos precios deben reflejarse

---

## 🎯 Testing del Contador de Productos

### Test 1: Sin búsqueda

**Pasos:**
1. Ve a Catálogo
2. Selecciona "Calzados"
3. Mira el header

**Resultado esperado:**
- ✅ Debe mostrar: "Calzados | X productos" (donde X es el total)
- ✅ El contador debe estar en un Badge gris

### Test 2: Con búsqueda

**Pasos:**
1. En el catálogo de Calzados
2. Escribe algo en el buscador (ej: "1080")
3. Mira el header

**Resultado esperado:**
- ✅ Debe mostrar: "Calzados | Y de X" (donde Y es filtrados, X es total)
- ✅ Ejemplo: "15 de 247"

### Test 3: Diferentes rubros

**Pasos:**
1. Prueba Calzados → anota el contador
2. Vuelve atrás
3. Prueba Prendas → anota el contador

**Resultado esperado:**
- ✅ Cada rubro debe mostrar su propio contador
- ✅ Los números deben ser diferentes
- ✅ Debe actualizarse al cambiar de rubro

---

## 🔍 Verificación en Base de Datos

Si quieres verificar técnicamente en Supabase:

### Verificar que IDs no cambian:

1. Antes de actualizar:
   ```sql
   SELECT id, sku, precio_usd FROM productos WHERE sku = 'M1080108';
   ```
   Anota el ID

2. Después de actualizar:
   ```sql
   SELECT id, sku, precio_usd FROM productos WHERE sku = 'M1080108';
   ```
   El ID debe ser el mismo, pero precio_usd diferente

### Verificar relaciones:

```sql
-- Ver items_pedido que apuntan al producto
SELECT * FROM items_pedido WHERE producto_id = '[ID_DEL_PRODUCTO]';
```

Deben seguir existiendo después del UPSERT.

---

## 📊 Checklist General

Marca cada item después de probarlo:

**Sistema UPSERT:**
- [ ] Actualiza productos existentes correctamente
- [ ] Mantiene los IDs originales
- [ ] Inserta productos nuevos cuando el SKU no existe
- [ ] Mensaje de feedback claro ("procesados (actualizados o insertados)")
- [ ] No pierde imágenes vinculadas
- [ ] No pierde relaciones con pedidos
- [ ] No pierde carritos activos

**Contador de Productos:**
- [ ] Muestra total de productos sin búsqueda
- [ ] Muestra "X de Y" con búsqueda activa
- [ ] Se actualiza al cambiar de rubro
- [ ] Responsive en móvil
- [ ] Badge bien estilizado

---

## 🐛 Qué hacer si algo falla

### Error: "duplicate key value violates unique constraint"
**Causa:** Intentando insertar SKU duplicado (no debería pasar con UPSERT)  
**Solución:** Verifica que el CSV no tenga SKUs duplicados dentro del mismo archivo

### Error: "null value in column"
**Causa:** Falta algún campo requerido en el CSV  
**Solución:** Verifica que todos los campos obligatorios estén llenos: SKU, Nombre, Precio_USD, Línea, Categoría, Género, Tier

### Contador muestra números incorrectos
**Causa:** Posible problema con filtro  
**Solución:** Refresca la página, limpia el buscador

---

## ✅ Resultado Esperado Final

Después de completar todos los tests:

1. ✅ Puedes actualizar productos masivamente sin perder datos
2. ✅ Puedes corregir precios sin afectar historial
3. ✅ Puedes agregar productos nuevos en el mismo CSV
4. ✅ El contador te da visibilidad de cuántos productos hay
5. ✅ La búsqueda muestra claramente productos filtrados vs total

---

**¡Listo para probar!** 🚀

Si encuentras algún problema, verifica los logs de la consola del navegador (F12) para más detalles.

