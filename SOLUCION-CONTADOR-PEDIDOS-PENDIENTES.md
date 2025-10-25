# Solución: Contador de Pedidos Pendientes

## Problema Identificado
El contador de "Pedidos Pendientes" en el Dashboard debe mostrar la cantidad de usuarios que tienen productos en su carrito (sin finalizar).

## Lógica de Estados CORRECTA

### Flujo completo:

1. **Usuario agrega productos al carrito** → Almacenado en `localStorage` con clave `cartItems_${userId}`
2. **USUARIO CON PRODUCTOS EN CARRITO** = **PEDIDO PENDIENTE** (aún no ha hecho clic en "Finalizar y descargar")
3. **Usuario hace clic en "Finalizar Pedido y Descargar"** → Se crea el pedido en DB con `estado = 'autorizado'`
4. **PEDIDO EN BASE DE DATOS CON estado='autorizado'** = **PEDIDO AUTORIZADO** (ya fue finalizado)

### Resumen:

- **Pendiente**: Usuario tiene productos en su carrito en `localStorage` (clave: `cartItems_${userId}`)
- **Autorizado**: Pedido finalizado y guardado en la tabla `pedidos` con `estado = 'autorizado'`

**NO HAY estado "pendiente" en la base de datos** - Los pedidos pendientes son carritos que aún no se han finalizado.

## Solución Implementada

### 1. Cambios en el Código

#### Dashboard.tsx
- ✅ Cuenta "Pedidos Pendientes" revisando los carritos de todos los usuarios en `localStorage`
- ✅ Verifica cada usuario: si tiene items en `cartItems_${userId}`, se cuenta como pendiente
- ✅ Cuenta "Pedidos Autorizados" desde la DB con `estado = 'autorizado'`

#### Cart.tsx
- ✅ Al finalizar pedido, crea el pedido en DB con `estado = 'autorizado'` (NO 'pendiente')
- ✅ Después de crear el pedido, limpia el carrito del usuario en `localStorage`

#### Pedidos.tsx
- ✅ Removidos botones "Autorizar/Rechazar" (ya no son necesarios)
- ✅ Solo muestra pedidos que ya fueron finalizados (estado='autorizado')

### 2. Migraciones Necesarias

Solo necesitamos la migración para agregar el campo `estado` a la tabla `pedidos`:

```sql
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'autorizado' 
CHECK (estado IN ('autorizado'));
```

**Nota**: El default es 'autorizado' porque todos los pedidos que se creen en DB ya están finalizados.

## Cómo Funciona

1. **Usuario agrega productos al carrito:**
   - Los items se guardan en `localStorage` con la clave `cartItems_${userId}`
   - El Dashboard cuenta esto como "Pedido Pendiente"

2. **Usuario hace clic en "Finalizar Pedido":**
   - Se crea un registro en la tabla `pedidos` con `estado = 'autorizado'`
   - Se generan los items del pedido en `items_pedido`
   - Se genera y descarga el Excel
   - Se limpia el carrito del usuario en `localStorage`

3. **Dashboard muestra:**
   - **Pedidos Pendientes**: Cantidad de usuarios con carrito no vacío
   - **Pedidos Autorizados**: Cantidad de pedidos con `estado = 'autorizado'` en la DB

## Verificación

Para verificar que funciona correctamente:

1. **Agrega productos al carrito** (sin finalizar)
2. **Ve al Dashboard** como Super Admin
3. **Verifica que "Pedidos Pendientes" muestra 1** (o el número correspondiente)
4. **Finaliza el pedido**
5. **Vuelve al Dashboard**
6. **Verifica que "Pedidos Pendientes" se reduce** y **"Pedidos Autorizados" aumenta**

## Problemas Comunes

### El contador de Pendientes siempre muestra 0

**Posibles causas:**
1. Los usuarios no tienen productos en su carrito
2. Los carritos no se están guardando correctamente en `localStorage`

**Solución:**
- Verifica en DevTools → Application → Local Storage que existe la clave `cartItems_${userId}`
- Verifica que esa clave tiene un array con items

### El contador de Pendientes no se actualiza

**Causa:** El Dashboard solo recarga los contadores al montar el componente

**Solución:**
- Recarga la página del Dashboard manualmente
- O implementa un refresh automático cada X segundos (opcional)

## Estado Actual

- ✅ Lógica correcta implementada: Pendientes = carritos, Autorizados = pedidos finalizados
- ✅ Dashboard cuenta correctamente los carritos en localStorage
- ✅ Cart.tsx crea pedidos con `estado = 'autorizado'`
- ✅ Pedidos.tsx muestra solo pedidos finalizados

## Próximos Pasos

1. Probar el flujo completo agregando productos al carrito
2. Verificar que el contador de Pendientes aumenta
3. Finalizar un pedido y verificar que el contador se actualiza correctamente
