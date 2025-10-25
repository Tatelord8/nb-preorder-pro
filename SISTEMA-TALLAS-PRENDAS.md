# Sistema de Tallas para Prendas

## Implementación Completada ✅

Se ha implementado el sistema de tallas específico para prendas según los requerimientos solicitados.

### Reglas de Negocio Implementadas

#### Prendas Masculinas (Mens/Hombre)
- **Rubro**: Prendas
- **Género**: Mens/Hombre
- **Tallas habilitadas**: S, M, L, XL, XXL

#### Prendas Femeninas (Womens/Mujer)
- **Rubro**: Prendas
- **Género**: Womens/Mujer
- **Tallas habilitadas**: XS, S, M, L, XL, XXL

### Archivos Modificados

1. **`src/utils/sizeGenerator.ts`**
   - Actualizada función `generateClothingSizes()` con las tallas específicas
   - Agregada función `validateClothingSizes()` para validación específica
   - Actualizada documentación con las nuevas reglas

2. **`src/utils/predefinedCurves.ts`**
   - Agregado campo `rubro` a la interfaz `PredefinedCurve`
   - Creadas curvas específicas para prendas masculinas y femeninas
   - Actualizadas todas las funciones para trabajar con rubro

3. **`src/pages/ProductDetail.tsx`**
   - Actualizadas las llamadas a funciones para incluir el parámetro rubro
   - Mejorada la lógica de carga de curvas predefinidas

### Curvas Predefinidas para Prendas

#### Mens - Prendas
- **Opción 1**: S(2), M(4), L(4), XL(3), XXL(2) - Total: 15 unidades
- **Opción 2**: S(1), M(3), L(3), XL(3), XXL(2) - Total: 12 unidades

#### Womens - Prendas
- **Opción 1**: XS(2), S(3), M(4), L(4), XL(3), XXL(2) - Total: 18 unidades
- **Opción 2**: XS(1), S(2), M(3), L(3), XL(3), XXL(3) - Total: 15 unidades

### Funciones Disponibles

```typescript
// Generar tallas para un producto
generateSizes({ rubro: 'Prendas', genero: 'Mens' }) // ['S', 'M', 'L', 'XL', 'XXL']

// Validar tallas específicas para prendas
validateClothingSizes('Prendas', 'Womens') // ['XS', 'S', 'M', 'L', 'XL', 'XXL']

// Obtener curvas por género y rubro
getCurvesForGender('Mens', 'Prendas')

// Aplicar curva a producto
applyCurveToProduct('Mens', 'Prendas', 1, 2) // Aplica curva opción 1 multiplicada por 2
```

### Compatibilidad

El sistema mantiene compatibilidad con:
- Calzados (todas las tallas existentes)
- Otros rubros (Accesorios, etc.)
- Géneros adicionales (Unisex, Niño, Niña, etc.)

### Próximos Pasos

El sistema está listo para usar. Los componentes del catálogo y detalle de producto ahora mostrarán las tallas correctas según el rubro y género del producto.

---

**Fecha de implementación**: $(date)
**Estado**: ✅ Completado
**Pruebas**: ✅ Sin errores de linting
