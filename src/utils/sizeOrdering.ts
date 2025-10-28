/**
 * Utilidad para ordenar tallas en el orden correcto
 * Basado en las especificaciones proporcionadas
 */

/**
 * Ordena las tallas según el orden específico para cada género
 */
export function sortSizesByOrder(sizes: string[], genero: string): string[] {
  // Definir el orden correcto para cada género
  const sizeOrders: Record<string, string[]> = {
    // Mens: 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14, 15
    'Mens': ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14', '15'],
    
    // Womens: 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10
    'Womens': ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    
    // Unisex: 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13
    'Unisex': ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
    
    // Preschool: 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 1, 1.5, 2, 2.5, 3
    'Preschool': ['10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'],
    
    // Infant: 5, 6, 7, 8, 9, 10
    'Infant': ['5', '6', '7', '8', '9', '10'],
    
    // Gradeschool: 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7
    'Gradeschool': ['3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7'],
    
    // Youth: 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 1, 1.5, 2, 2.5, 3
    'Youth': ['10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3']
  };

  const order = sizeOrders[genero] || [];
  
  // Filtrar solo las tallas que existen en el array de entrada
  const orderedSizes = order.filter(size => sizes.includes(size));
  
  // Agregar cualquier talla que no esté en el orden predefinido al final
  const remainingSizes = sizes.filter(size => !order.includes(size));
  
  return [...orderedSizes, ...remainingSizes];
}

/**
 * Ordena un objeto de cantidades por talla según el orden correcto
 */
export function sortQuantitiesBySizeOrder(
  quantities: Record<string, number>, 
  genero: string
): Array<{ talla: string; cantidad: number }> {
  const sortedSizes = sortSizesByOrder(Object.keys(quantities), genero);
  
  return sortedSizes.map(talla => ({
    talla,
    cantidad: quantities[talla] || 0
  }));
}

/**
 * Función auxiliar para ordenar tallas numéricamente cuando no hay orden específico
 */
export function sortSizesNumerically(sizes: string[]): string[] {
  return sizes.sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) && isNaN(numB)) {
      return a.localeCompare(b);
    }
    
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    
    return numA - numB;
  });
}
