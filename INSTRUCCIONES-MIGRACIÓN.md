# 📋 INSTRUCCIONES PARA APLICAR MIGRACIÓN

## ⚠️ IMPORTANTE: Leer antes de ejecutar

Esta migración corregirá todas las inconsistencias críticas de la base de datos detectadas en la auditoría.

### Cambios que se aplicarán:
1. ✅ Renombrar tabla `curvas` → `curvas_predefinidas`
2. ✅ Renombrar tabla `items_pedido` → `pedidos_detalles`
3. ✅ Insertar marca "New Balance" (faltante)
4. ✅ Insertar 3 vendedores iniciales
5. ✅ Insertar 8 curvas predefinidas
6. ✅ Crear tabla `vendedores_users` (nueva)
7. ✅ Crear funciones helper y políticas RLS

---

## 🚀 PASOS PARA APLICAR LA MIGRACIÓN

### Opción 1: Desde Supabase Dashboard (RECOMENDADO)

1. **Ir a Supabase Dashboard:**
   - Abrir https://supabase.com
   - Iniciar sesión
   - Seleccionar proyecto: `oszmlmscckrbfnjrveet`

2. **Ir al SQL Editor:**
   - En el menú lateral, hacer clic en "SQL Editor"
   - Hacer clic en "+ New query"

3. **Copiar y pegar el contenido de la migración:**
   - Abrir el archivo: `supabase/migrations/20251026173139_fix_schema_inconsistencies.sql`
   - Copiar TODO el contenido
   - Pegarlo en el SQL Editor

4. **Ejecutar la migración:**
   - Hacer clic en el botón "Run" (⏵) o presionar Ctrl+Enter
   - Esperar a que termine (puede tardar 10-15 segundos)

5. **Verificar que no hay errores:**
   - Si todo sale bien, verás mensajes de éxito
   - Si hay algún error, cópialo y compártelo conmigo

6. **Verificar los cambios:**
   - Ir a "Table Editor" en el menú lateral
   - Confirmar que existe la tabla `curvas_predefinidas`
   - Confirmar que existe la tabla `pedidos_detalles`
   - Confirmar que existe la tabla `vendedores_users`

---

### Opción 2: Usando CLI de Supabase (Avanzado)

Si tienes Supabase CLI instalado:

```bash
# Navegar al directorio del proyecto
cd C:\Users\COMERCIAL 5\Desktop\nb-preorder-pro

# Aplicar la migración
supabase db push
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Después de aplicar la migración, ejecutar el script de verificación:

```bash
node scripts/analyze-db-structure.js
```

### Resultados esperados:

```
✅ productos:              1,305 registros
✅ tiers:                  4 registros
✅ marcas:                 1 registro (New Balance)
✅ vendedores:             3 registros
✅ curvas_predefinidas:    8 registros
✅ vendedores_users:       0 registros (normal por ahora)
⚠️  clientes:              0 registros (normal)
⚠️  pedidos:               0 registros (normal)
⚠️  pedidos_detalles:      0 registros (normal)
⚠️  user_roles:            0 registros (necesitas crear admin)
```

---

## 🔐 CREAR SUPERADMIN (Después de la migración)

Una vez aplicada la migración, necesitas crear al menos un usuario admin:

1. **Obtener tu UUID de usuario:**
   - Ir a Supabase Dashboard → Authentication → Users
   - Copiar el UUID de tu usuario (columna "User UID")

2. **Crear el registro de admin:**
   - Ir a SQL Editor
   - Ejecutar:

```sql
-- Reemplaza 'TU_USER_UUID_AQUI' con tu UUID real
INSERT INTO user_roles (user_id, role)
VALUES ('TU_USER_UUID_AQUI', 'admin');
```

3. **Verificar:**
   - Ir a Table Editor → user_roles
   - Confirmar que tu registro aparece con role = 'admin'

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Error: "relation curvas does not exist"
**Solución:** La tabla `curvas` no existe. Esto está bien si ya se aplicó la migración antes. Comentar las líneas 11-12 del SQL.

### Error: "relation items_pedido does not exist"
**Solución:** La tabla `items_pedido` no existe. Esto está bien. Comentar las líneas 14-15 del SQL.

### Error: "duplicate key value violates unique constraint"
**Solución:** Los datos ya existen. Esto es seguro de ignorar, el `ON CONFLICT DO NOTHING` se encarga.

### Error: "permission denied"
**Solución:** Tu usuario no tiene permisos de admin en Supabase. Ve a Dashboard → Settings → Database → Connection string y ejecuta desde ahí.

---

## 📊 SIGUIENTE PASO

Después de aplicar la migración exitosamente:

1. Reiniciar el servidor de desarrollo:
```bash
npm run dev
```

2. Confirmarme que la migración se aplicó correctamente y continuaremos con la **FASE 2: Consolidación de localStorage**

---

## 🆘 ¿NECESITAS AYUDA?

Si encuentras algún error:
1. Copia el mensaje de error completo
2. Toma una captura de pantalla si es posible
3. Compártelo conmigo y te ayudaré a resolverlo

---

**Última actualización:** 26/10/2025
