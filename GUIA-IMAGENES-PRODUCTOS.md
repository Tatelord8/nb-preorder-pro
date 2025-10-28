# 📸 Guía: Sistema de Imágenes de Productos con Supabase Storage

Esta guía explica cómo configurar y usar el sistema de imágenes para productos.

---

## 🎯 Resumen del Sistema

- **Storage:** Supabase Storage (bucket: `productos-imagenes`)
- **Formato URLs:** `https://nplonbsyfkxcffwyaoze.supabase.co/storage/v1/object/public/productos-imagenes/[SKU].[ext]`
- **Extensiones soportadas:** jpg, jpeg, png, webp
- **Nombrado de archivos:** Deben coincidir exactamente con el SKU del producto

---

## ✅ FASE 1: Configuración Inicial (YA COMPLETADA)

### 1.1 Bucket creado
- ✅ Nombre: `productos-imagenes`
- ✅ Tipo: Público

### 1.2 Políticas configuradas
- ✅ Lectura pública (SELECT): Permite que cualquiera vea las imágenes
- ✅ Escritura autenticada (INSERT/UPDATE/DELETE): Solo usuarios autenticados pueden subir

---

## 📋 FASE 2: Preparar y Subir Imágenes

### Paso 1: Renombrar imágenes localmente

Tus imágenes deben nombrarse **exactamente** como el SKU del producto:

**Ejemplos correctos:**
```
M1080108.jpg
M108022G.png
M10804O2.jpg
M108078J.webp
```

**Importante:**
- El nombre debe coincidir 100% con el SKU en la base de datos
- Mayúsculas/minúsculas deben coincidir
- Extensiones válidas: `.jpg`, `.jpeg`, `.png`, `.webp`

### Paso 2: Subir al bucket de Supabase

#### Opción A: UI de Supabase (Recomendado para pruebas)

1. Ve a: https://supabase.com/dashboard/project/nplonbsyfkxcffwyaoze/storage/buckets/productos-imagenes
2. Arrastra y suelta las imágenes
3. Supabase las subirá automáticamente

#### Opción B: Subida masiva (Para 1305 imágenes)

1. Selecciona múltiples archivos (Ctrl+Click o Cmd+Click)
2. Arrastra al bucket
3. Espera a que todas se suban (verás progreso)

**Tip:** Puedes subir en lotes de 50-100 imágenes para mejor control

---

## 🚀 FASE 3: Vincular Imágenes con Productos

### Requisito previo: Obtener Service Role Key

1. Ve a: https://supabase.com/dashboard/project/nplonbsyfkxcffwyaoze/settings/api
2. Copia el **service_role key** (section "Project API keys")
3. ⚠️ **NUNCA** commitees esta key a Git

### Configurar la Service Role Key

**Windows (PowerShell):**
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

**Windows (CMD):**
```cmd
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Mac/Linux:**
```bash
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

### Ejecutar el script

#### Prueba con 5 productos (Recomendado primero)

```bash
node scripts/vincular-imagenes.js
```

o con simulación (no hace cambios):

```bash
node scripts/vincular-imagenes.js --dry-run
```

#### Producción (todos los productos)

```bash
node scripts/vincular-imagenes.js --modo=produccion
```

---

## 📊 Interpretando los Resultados

El script mostrará algo como:

```
🚀 Iniciando script de vinculación de imágenes...
📋 Modo: prueba
🔍 Dry run: NO

📦 Obteniendo productos de la base de datos...
✅ 5 productos obtenidos

🔄 Procesando productos...

[1/5] SKU: M1080108 - New Balance 1080
  📸 Imagen encontrada: M1080108.jpg
  ✅ Actualizado con: https://nplonbsyfkxcffwyaoze.supabase.co/storage/v1/object/public/productos-imagenes/M1080108.jpg

[2/5] SKU: M108022G - New Balance 1080
  ⚠️  Imagen no encontrada en storage

...

============================================================
📊 RESUMEN DE EJECUCIÓN
============================================================
Total procesados:      5
✅ Actualizados:       3
ℹ️  Ya tenían imagen:  0
⚠️  Sin imagen:        2
❌ Errores:            0
============================================================
```

### Significado de cada estado:

- ✅ **Actualizados:** Productos que ahora tienen imagen_url configurada
- ℹ️ **Ya tenían imagen:** Productos que ya tenían una URL (se saltean)
- ⚠️ **Sin imagen:** No se encontró archivo en storage con ese SKU
- ❌ **Errores:** Falló la actualización en la BD

---

## 🔍 Verificar que Funcionó

### En la aplicación:

1. Ve a `/catalog` en tu app
2. Los productos con imagen deberían mostrar la foto
3. Los productos sin imagen mostrarán el ícono placeholder

### En Supabase:

1. Ve a: https://supabase.com/dashboard/project/nplonbsyfkxcffwyaoze/editor
2. Abre la tabla `productos`
3. Verifica que la columna `imagen_url` tenga valores para los productos procesados

---

## 🐛 Solución de Problemas

### Error: "SUPABASE_SERVICE_ROLE_KEY no configurada"

**Solución:** Configura la variable de entorno antes de ejecutar el script (ver sección anterior)

### Error: "Imagen no encontrada en storage"

**Posibles causas:**
1. El archivo no está subido al bucket
2. El nombre del archivo no coincide exactamente con el SKU
3. La extensión no es soportada (solo jpg, jpeg, png, webp)

**Solución:**
1. Verifica que el archivo esté en: https://supabase.com/dashboard/project/nplonbsyfkxcffwyaoze/storage/buckets/productos-imagenes
2. Verifica que el nombre sea exacto (incluyendo mayúsculas/minúsculas)
3. Renombra el archivo si es necesario

### Las imágenes no se muestran en la app

**Posibles causas:**
1. Falta la política de lectura pública
2. El bucket no es público
3. La URL está mal formada

**Solución:**
1. Verifica las políticas en Storage > productos-imagenes > Policies
2. Verifica que el bucket sea público
3. Prueba la URL directamente en el navegador

---

## 📈 Escalando a 1305 Productos

### Checklist antes de procesar todo:

- [ ] Prueba exitosa con 5 productos
- [ ] Imágenes verificadas en el catálogo
- [ ] Todas las 1305 imágenes renombradas con SKUs
- [ ] Todas las imágenes subidas al bucket
- [ ] Service Role Key configurada

### Ejecutar procesamiento completo:

```bash
# Primero simulación para ver qué pasaría
node scripts/vincular-imagenes.js --modo=produccion --dry-run

# Si todo se ve bien, ejecutar de verdad
node scripts/vincular-imagenes.js --modo=produccion
```

### Tiempo estimado:

- **5 productos:** ~10 segundos
- **100 productos:** ~2 minutos
- **1305 productos:** ~15-20 minutos

---

## 🔐 Seguridad

### ⚠️ IMPORTANTE

- **NUNCA** commitees el Service Role Key a Git
- **NUNCA** expongas el Service Role Key en el frontend
- **SOLO** usa el Service Role Key en scripts backend/locales
- El archivo `.env` debe estar en `.gitignore`

---

## 💡 Tips y Mejores Prácticas

### Organización de imágenes:

1. Mantén un backup local de todas las imágenes
2. Usa nombres de archivo consistentes
3. Optimiza imágenes antes de subir (reduce tamaño sin perder calidad)

### Formato recomendado:

- **Formato:** JPG o WebP (mejor compresión)
- **Tamaño:** 800x800px a 1200x1200px
- **Peso:** < 500KB por imagen
- **Fondo:** Blanco o transparente (PNG)

### Herramientas útiles:

- **Renombrado masivo:** [Bulk Rename Utility](https://www.bulkrenameutility.co.uk/) (Windows)
- **Optimización:** [TinyPNG](https://tinypng.com/) o [Squoosh](https://squoosh.app/)
- **Redimensionado:** [IrfanView](https://www.irfanview.com/) (batch processing)

---

## 📞 Soporte

Si tienes problemas:

1. Verifica los logs del script (muestra errores detallados)
2. Revisa esta guía completa
3. Verifica la configuración de Supabase Storage

---

**Última actualización:** 2025-01-28

