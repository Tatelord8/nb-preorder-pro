/**
 * Script de prueba para verificar la generación de tallas
 * Este archivo puede ser eliminado después de las pruebas
 */

import { generateSizes, getSizeInfo, type ProductSizeInfo } from './sizeGenerator';

// Casos de prueba según las reglas especificadas
const testCases: Array<{ product: ProductSizeInfo; expectedSizes: string[]; description: string }> = [
  // Calzados Mens
  {
    product: { rubro: 'Calzados', genero: 'Mens' },
    expectedSizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
    description: 'Calzados Mens - tallas 7-13'
  },
  
  // Calzados Womens
  {
    product: { rubro: 'Calzados', genero: 'Womens' },
    expectedSizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    description: 'Calzados Womens - tallas 6-10'
  },
  
  // Calzados Unisex
  {
    product: { rubro: 'Calzados', genero: 'Unisex' },
    expectedSizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
    description: 'Calzados Unisex - tallas 4-13'
  },
  
  // Prendas Mens
  {
    product: { rubro: 'Prendas', genero: 'Mens' },
    expectedSizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    description: 'Prendas Mens - tallas de ropa'
  },
  
  // Prendas Womens
  {
    product: { rubro: 'Prendas', genero: 'Womens' },
    expectedSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description: 'Prendas Womens - tallas de ropa'
  },
  
  // Prendas Unisex
  {
    product: { rubro: 'Prendas', genero: 'Unisex' },
    expectedSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description: 'Prendas Unisex - tallas de ropa'
  },
  
  // Casos con variaciones de género
  {
    product: { rubro: 'Calzados', genero: 'Hombre' },
    expectedSizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
    description: 'Calzados Hombre (variación de Mens)'
  },
  
  {
    product: { rubro: 'Calzados', genero: 'Mujer' },
    expectedSizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    description: 'Calzados Mujer (variación de Womens)'
  },
  
  // Casos con rubro en minúsculas
  {
    product: { rubro: 'calzados', genero: 'mens' },
    expectedSizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'],
    description: 'Calzados mens (minúsculas)'
  },
  
  // Casos con géneros de niños - Calzados
  {
    product: { rubro: 'Calzados', genero: 'Preschool' },
    expectedSizes: ['10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'],
    description: 'Calzados Preschool - tallas específicas'
  },
  
  {
    product: { rubro: 'Calzados', genero: 'Infant' },
    expectedSizes: ['5', '6', '7', '8', '9', '10'],
    description: 'Calzados Infant - tallas específicas'
  },
  
  {
    product: { rubro: 'Calzados', genero: 'Gradeschool' },
    expectedSizes: ['3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7'],
    description: 'Calzados Gradeschool - tallas específicas'
  },
  
  {
    product: { rubro: 'Calzados', genero: 'Youth' },
    expectedSizes: ['10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'],
    description: 'Calzados Youth - tallas específicas'
  },
  
  // Casos con géneros de niños - Prendas
  {
    product: { rubro: 'Prendas', genero: 'Preschool' },
    expectedSizes: ['2T', '3T', '4T', '5T', 'XS', 'S', 'M', 'L'],
    description: 'Prendas Preschool - tallas de ropa'
  },
  
  {
    product: { rubro: 'Prendas', genero: 'Infant' },
    expectedSizes: ['2T', '3T', '4T', '5T', 'XS', 'S', 'M', 'L'],
    description: 'Prendas Infant - tallas de ropa'
  },
  
  {
    product: { rubro: 'Prendas', genero: 'Gradeschool' },
    expectedSizes: ['2T', '3T', '4T', '5T', 'XS', 'S', 'M', 'L'],
    description: 'Prendas Gradeschool - tallas de ropa'
  },
  
  {
    product: { rubro: 'Prendas', genero: 'Youth' },
    expectedSizes: ['2T', '3T', '4T', '5T', 'XS', 'S', 'M', 'L'],
    description: 'Prendas Youth - tallas de ropa'
  }
];

export function runSizeGeneratorTests(): void {
  console.log('🧪 Iniciando pruebas del generador de tallas...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    const { product, expectedSizes, description } = testCase;
    const actualSizes = generateSizes(product);
    const sizeInfo = getSizeInfo(product);
    
    const isCorrect = JSON.stringify(actualSizes) === JSON.stringify(expectedSizes);
    
    console.log(`Test ${index + 1}: ${description}`);
    console.log(`  Producto: ${product.rubro} - ${product.genero}`);
    console.log(`  Esperado: [${expectedSizes.join(', ')}]`);
    console.log(`  Obtenido: [${actualSizes.join(', ')}]`);
    console.log(`  Tipo: ${sizeInfo.type}`);
    console.log(`  Descripción: ${sizeInfo.description}`);
    console.log(`  ✅ ${isCorrect ? 'PASÓ' : '❌ FALLÓ'}\n`);
    
    if (isCorrect) passedTests++;
  });
  
  console.log(`📊 Resultados: ${passedTests}/${totalTests} pruebas pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todas las pruebas pasaron! El generador de tallas funciona correctamente.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisar la implementación.');
  }
}

// Función para probar casos específicos
export function testSpecificCase(rubro: string, genero: string): void {
  const product: ProductSizeInfo = { rubro, genero };
  const sizes = generateSizes(product);
  const sizeInfo = getSizeInfo(product);
  
  console.log(`\n🔍 Prueba específica: ${rubro} - ${genero}`);
  console.log(`Tallas generadas: [${sizes.join(', ')}]`);
  console.log(`Tipo: ${sizeInfo.type}`);
  console.log(`Descripción: ${sizeInfo.description}`);
}
