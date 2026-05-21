/**
 * Utilidad para generar tallas automáticamente basada en género y rubro del producto
 * 
 * Reglas de negocio:
 * - Si el producto es "Calzado" y "Mens": tallas 7-13 (con medias)
 * - Si el producto es "Calzado" y "Womens": tallas 6-10
 * - Si el producto es "Calzado" y "Unisex": tallas 4-12 (con medias)
 * - Si el producto es "Prendas" y "Mens": S, M, L, XL, XXL
 * - Si el producto es "Prendas" y "Womens": XS, S, M, L, XL, XXL
 * - Para otros rubros: tallas estándar de ropa
 */

export interface ProductSizeInfo {
  rubro: string;
  genero: string;
  marca?: string;
  work?: boolean | null;
  silueta?: string | null;
}

export type SizeType = 'shoes' | 'clothing';

/**
 * Genera las tallas disponibles para un producto basado en su rubro y género
 */
export function generateSizes(product: ProductSizeInfo): string[] {
  const { rubro, genero, marca } = product;

  // Normalizar valores para comparación
  const normalizedRubro = rubro?.toLowerCase().trim();
  const normalizedGenero = genero?.toLowerCase().trim();
  const normalizedMarca = marca?.toLowerCase().trim();

  // Solo aplicar reglas de calzado si el rubro es "Calzados"
  if (normalizedRubro === 'calzados' || normalizedRubro === 'calzado') {
    // CAT Womens: tallas 5 a 9 con medios puntos
    if (normalizedMarca === 'cat' && (normalizedGenero === 'womens' || normalizedGenero === 'mujer')) {
      return ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'];
    }
    return generateShoeSizes(normalizedGenero);
  }

  // Accesorios: talla única
  if (normalizedRubro === 'accesorios') {
    return ['Unic'];
  }

  // CAT prendas: tallas según silueta, work y género
  if (normalizedMarca === 'cat' && (normalizedRubro === 'prendas')) {
    const normalizedSilueta = product.silueta?.toLowerCase().trim();

    if (normalizedSilueta === 'pant') {
      if (normalizedGenero === 'mens' || normalizedGenero === 'hombre') {
        return ['28', '30', '32', '34', '36', '38', '40', '42'];
      }
      if (normalizedGenero === 'womens' || normalizedGenero === 'mujer') {
        return ['24', '26', '28', '30', '32'];
      }
    }

    if (normalizedSilueta === 'top') {
      if (normalizedGenero === 'mens' || normalizedGenero === 'hombre') {
        if (product.work === true) {
          return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
        }
        if (product.work === false) {
          return ['S', 'M', 'L', 'XL', '2XL'];
        }
      }
      if (normalizedGenero === 'womens' || normalizedGenero === 'mujer') {
        return ['XS', 'S', 'M', 'L', 'XL'];
      }
    }

    // CAT prendas sin silueta definida (comportamiento anterior)
    if (normalizedGenero === 'mens' || normalizedGenero === 'hombre') {
      return ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    }
  }

  // Para otros rubros (Prendas), usar tallas de ropa
  return generateClothingSizes(normalizedGenero);
}

/**
 * Genera tallas de calzado según el género
 */
function generateShoeSizes(genero: string): string[] {
  switch (genero) {
    case 'mens':
    case 'hombre':
      return [
        '7', '7.5', '8', '8.5', '9', '9.5', 
        '10', '10.5', '11', '11.5', '12', '13', '14', '15'
      ];
    
    case 'womens':
    case 'mujer':
      return [
        '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'
      ];
    
    case 'unisex':
      return [
        '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5',
        '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'
      ];
    
    case 'preschool':
      // Preschool calzados: 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 1, 1.5, 2, 2.5, 3
      return [
        '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'
      ];
    
    case 'infant':
      // Infant calzados: 5, 6, 7, 8, 9, 10
      return [
        '5', '6', '7', '8', '9', '10'
      ];
    
    case 'gradeschool':
      // Gradeschool calzados: 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7
      return [
        '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7'
      ];
    
    case 'youth':
      // Youth calzados: 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 1, 1.5, 2, 2.5, 3
      return [
        '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'
      ];
    
    default:
      // Si no se reconoce el género, usar tallas unisex
      return [
        '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5',
        '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'
      ];
  }
}

/**
 * Genera tallas de ropa según el género
 * Para prendas específicamente:
 * - Mens: S, M, L, XL, XXL
 * - Womens: XS, S, M, L, XL, XXL
 */
function generateClothingSizes(genero: string): string[] {
  switch (genero) {
    case 'mens':
    case 'hombre':
      // Tallas específicas para prendas masculinas
      return ['S', 'M', 'L', 'XL', 'XXL'];
    
    case 'womens':
    case 'mujer':
      // Tallas específicas para prendas femeninas
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    case 'unisex':
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    case 'preschool':
    case 'gradeschool':
    case 'infant':
    case 'youth':
      return ['2T', '3T', '4T', '5T', 'XS', 'S', 'M', 'L'];
    
    default:
      // Si no se reconoce el género, usar tallas unisex
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }
}

/**
 * Determina el tipo de talla (calzado o ropa) basado en el rubro
 */
export function getSizeType(rubro: string): SizeType {
  const normalizedRubro = rubro?.toLowerCase().trim();
  return (normalizedRubro === 'calzados' || normalizedRubro === 'calzado') ? 'shoes' : 'clothing';
}

/**
 * Valida si una talla es válida para un producto específico
 */
export function isValidSize(product: ProductSizeInfo, size: string): boolean {
  const availableSizes = generateSizes(product);
  return availableSizes.includes(size);
}

/**
 * Obtiene información sobre las tallas disponibles para mostrar en la UI
 */
export function getSizeInfo(product: ProductSizeInfo): {
  sizes: string[];
  type: SizeType;
  description: string;
} {
  const sizes = generateSizes(product);
  const type = getSizeType(product.rubro);
  
  let description = '';
  if (type === 'shoes') {
    description = `Tallas de calzado ${product.genero}`;
  } else {
    description = `Tallas de ropa ${product.genero}`;
  }
  
  return {
    sizes,
    type,
    description
  };
}

/**
 * Valida las tallas específicas para prendas según género
 * Reglas de negocio:
 * - Prendas Mens: S, M, L, XL, XXL
 * - Prendas Womens: XS, S, M, L, XL, XXL
 */
export function validateClothingSizes(rubro: string, genero: string): string[] {
  const normalizedRubro = rubro?.toLowerCase().trim();
  const normalizedGenero = genero?.toLowerCase().trim();
  
  // Solo aplicar validación específica si es prendas
  if (normalizedRubro === 'prendas') {
    switch (normalizedGenero) {
      case 'mens':
      case 'hombre':
        return ['S', 'M', 'L', 'XL', 'XXL'];
      
      case 'womens':
      case 'mujer':
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      
      default:
        // Para otros géneros en prendas, usar tallas estándar
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }
  }
  
  // Para otros rubros, usar la función general
  return generateSizes({ rubro, genero });
}
