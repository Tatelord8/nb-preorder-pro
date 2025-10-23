# 📊 Especificación para Carga Masiva de Productos - Excel

## 🎯 Objetivo

Establecer los parámetros requeridos para la carga masiva de productos mediante planilla de Excel, permitiendo a los administradores y superadmins importar grandes volúmenes de productos de manera eficiente.

---

## 📋 Estructura de la Planilla Excel

### **Columnas Requeridas (Obligatorias)**

| Columna | Tipo | Descripción | Validación | Ejemplo |
|---------|------|-------------|------------|---------|
| **SKU** | Texto | Código único del producto | Único, no vacío, alfanumérico | `NB001`, `NIKE-AIR-001` |
| **Nombre** | Texto | Nombre del producto | No vacío, máximo 255 caracteres | `Air Max 270`, `Classic 574` |
| **Marca** | Texto | Marca del producto | Debe existir en tabla `marcas` | `Nike`, `Adidas`, `New Balance` |
| **Precio_USD** | Decimal | Precio en dólares | Mayor a 0, máximo 2 decimales | `120.50`, `89.99` |
| **Línea** | Texto | Línea del producto | No vacío | `Air Max`, `Classic`, `Ultraboost` |
| **Rubro** | Texto | Rubro del producto | Valores específicos | `Prendas`, `Calzados`, `Accesorios` |
| **Categoría** | Texto | Categoría del producto | No vacío | `Calzado`, `Ropa`, `Accesorios` |
| **Género** | Texto | Género del producto | Valores específicos | `Hombre`, `Mujer`, `Unisex`, `Niño`, `Niña` |
| **Tier** | Texto | Nivel de acceso | Valores específicos | `1`, `2`, `3`, `4` |

### **Columnas Opcionales**

| Columna | Tipo | Descripción | Validación | Ejemplo |
|---------|------|-------------|------------|---------|
| **Game_Plan** | Boolean | Producto especial Game Plan | `TRUE`/`FALSE` o `1`/`0` | `TRUE`, `1` |
| **Imagen_URL** | Texto | URL de la imagen del producto | URL válida | `https://example.com/image.jpg` |
| **XFD** | Texto | Fecha de disponibilidad en fábrica | Formato de fecha | `2024-03-15` |
| **Fecha_Despacho** | Fecha | Fecha estimada de despacho | Formato de fecha | `2024-04-01` |

---

## 📝 Ejemplo de Planilla Excel

```
| SKU        | Nombre           | Marca       | Precio_USD | Línea    | Rubro     | Categoría | Género | Tier | Game_Plan | Imagen_URL                    | XFD        | Fecha_Despacho |
|------------|------------------|-------------|------------|----------|-----------|-----------|--------|------|-----------|-------------------------------|------------|----------------|
| NB001      | Classic 574      | New Balance | 89.99      | Classic  | Calzados  | Deportivo | Unisex | 1    | FALSE     | https://nb.com/classic574.jpg | 2024-03-15 | 2024-04-01     |
| NIKE001    | Air Max 270      | Nike        | 150.00     | Air Max  | Calzados  | Running   | Hombre | 2    | TRUE      | https://nike.com/airmax270.jpg| 2024-03-20 | 2024-04-05     |
| ADIDAS001  | Ultraboost 22    | Adidas      | 180.00     | Ultraboost| Calzados  | Running   | Mujer  | 3    | FALSE     | https://adidas.com/ub22.jpg   | 2024-03-25 | 2024-04-10     |
```

---

## ✅ Validaciones de Datos

### **Validaciones por Columna**

1. **SKU**
   - ✅ No puede estar vacío
   - ✅ Debe ser único en el sistema
   - ✅ Solo caracteres alfanuméricos y guiones
   - ✅ Máximo 50 caracteres

2. **Nombre**
   - ✅ No puede estar vacío
   - ✅ Máximo 255 caracteres
   - ✅ No puede contener caracteres especiales peligrosos

3. **Marca**
   - ✅ Debe existir en la tabla `marcas`
   - ✅ La marca debe estar activa
   - ✅ Case-insensitive (Nike = nike = NIKE)

4. **Precio_USD**
   - ✅ Debe ser un número válido
   - ✅ Mayor a 0
   - ✅ Máximo 2 decimales
   - ✅ No puede exceder 999,999.99

5. **Línea**
   - ✅ No puede estar vacío
   - ✅ Máximo 100 caracteres

6. **Rubro**
   - ✅ Debe ser uno de: `Prendas`, `Calzados`, `Accesorios`
   - ✅ Case-insensitive

7. **Categoría**
   - ✅ No puede estar vacío
   - ✅ Máximo 100 caracteres

8. **Género**
   - ✅ Debe ser uno de: `Hombre`, `Mujer`, `Unisex`, `Niño`, `Niña`
   - ✅ Case-insensitive

9. **Tier**
   - ✅ Debe ser uno de: `1`, `2`, `3`, `4`
   - ✅ Puede ser número o texto

10. **Game_Plan**
   - ✅ Si está presente: `TRUE`, `FALSE`, `1`, `0`
   - ✅ Si está vacío: se asume `FALSE`

11. **Imagen_URL**
    - ✅ Si está presente: debe ser URL válida
    - ✅ Debe comenzar con `http://` o `https://`

12. **XFD**
    - ✅ Si está presente: formato de fecha válido
    - ✅ Formato recomendado: `YYYY-MM-DD`

13. **Fecha_Despacho**
    - ✅ Si está presente: formato de fecha válido
    - ✅ Debe ser posterior a la fecha actual

---

## 🔄 Proceso de Carga Masiva

### **Paso 1: Preparación del Archivo**
1. Descargar plantilla Excel desde el sistema
2. Completar datos siguiendo las validaciones
3. Verificar que no haya SKUs duplicados en el archivo
4. Guardar como archivo Excel (.xlsx)

### **Paso 2: Carga del Archivo**
1. Acceder a la sección "Gestión de Productos"
2. Seleccionar "Carga Masiva"
3. Subir archivo Excel
4. Seleccionar marca (si es admin) o dejar automático (si es superadmin)

### **Paso 3: Validación**
1. Sistema valida estructura del archivo
2. Sistema valida datos según reglas establecidas
3. Sistema muestra reporte de validación con errores (si los hay)
4. Usuario corrige errores y vuelve a cargar

### **Paso 4: Procesamiento**
1. Sistema procesa productos válidos
2. Sistema muestra reporte de productos cargados
3. Sistema muestra reporte de productos con errores
4. Sistema guarda log de la operación

---

## 📊 Reportes de Carga

### **Reporte de Validación**
- ✅ Total de filas procesadas
- ✅ Productos válidos encontrados
- ✅ Errores por fila (con número de fila)
- ✅ Advertencias (datos opcionales faltantes)

### **Reporte de Carga**
- ✅ Productos insertados exitosamente
- ✅ Productos actualizados (si SKU ya existía)
- ✅ Productos con errores (con detalles del error)
- ✅ Tiempo total de procesamiento

---

## 🚫 Limitaciones y Restricciones

### **Por Rol de Usuario**

**Superadmin:**
- ✅ Puede cargar productos de cualquier marca
- ✅ Puede crear marcas automáticamente si no existen
- ✅ Acceso a todos los reportes de carga

**Admin:**
- ✅ Solo puede cargar productos de su marca asignada
- ❌ No puede crear nuevas marcas
- ✅ Acceso solo a reportes de su marca

**Cliente:**
- ❌ No tiene acceso a carga masiva

### **Límites Técnicos**
- 📁 Tamaño máximo del archivo: 10MB
- 📊 Máximo de filas por carga: 5,000 productos
- ⏱️ Timeout de procesamiento: 5 minutos
- 🔄 Máximo 3 cargas simultáneas por usuario

---

## 🛠️ Implementación Técnica

### **Frontend (React)**
- Componente de carga de archivos
- Validación en tiempo real
- Progress bar durante procesamiento
- Reportes de resultados

### **Backend (Supabase)**
- Función SQL para procesamiento masivo
- Validaciones de datos
- Transacciones para consistencia
- Logs de auditoría

### **Validaciones SQL**
```sql
-- Función para validar datos de productos
CREATE OR REPLACE FUNCTION validate_product_data(
  p_sku TEXT,
  p_nombre TEXT,
  p_marca TEXT,
  p_precio DECIMAL,
  p_linea TEXT,
  p_rubro TEXT,
  p_categoria TEXT,
  p_genero TEXT,
  p_tier TEXT
) RETURNS TABLE(is_valid BOOLEAN, error_message TEXT);
```

---

## 📋 Checklist de Implementación

- [ ] Crear migración para agregar `marca_id` a tabla `productos`
- [ ] Crear migración para agregar `rubro` a tabla `productos`
- [ ] Implementar validaciones de datos (incluyendo rubro)
- [ ] Crear función SQL para carga masiva
- [ ] Desarrollar componente de carga de archivos
- [ ] Implementar reportes de validación y carga
- [ ] Crear plantilla Excel descargable
- [ ] Implementar logs de auditoría
- [ ] Crear documentación de usuario
- [ ] Realizar pruebas de carga masiva
- [ ] Implementar manejo de errores

---

## 🎯 Beneficios de la Carga Masiva

1. **Eficiencia**: Carga de miles de productos en minutos
2. **Precisión**: Validaciones automáticas previenen errores
3. **Trazabilidad**: Logs completos de todas las operaciones
4. **Flexibilidad**: Soporte para múltiples marcas y formatos
5. **Escalabilidad**: Procesamiento de grandes volúmenes de datos
