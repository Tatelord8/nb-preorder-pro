/**
 * Script de prueba para verificar que las terceras curvas se cargan correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el archivo de curvas predefinidas
const curvesPath = path.join(__dirname, 'src', 'utils', 'predefinedCurves.ts');
const curvesContent = fs.readFileSync(curvesPath, 'utf8');

console.log('=== VERIFICACIÓN DE TERCERAS CURVAS ===\n');

// Verificar que existen las terceras curvas para cada género en calzados
const genders = ['Mens', 'Womens', 'Preschool', 'Infant', 'Gradeschool', 'Youth', 'Unisex'];

genders.forEach(gender => {
  console.log(`\n--- ${gender} Calzados ---`);
  
  // Buscar las tres opciones para este género
  for (let opcion = 1; opcion <= 3; opcion++) {
    const pattern = new RegExp(`${gender}.*Calzados.*Opción ${opcion}.*Total: (\\d+)`, 'g');
    const match = pattern.exec(curvesContent);
    
    if (match) {
      console.log(`✓ Opción ${opcion}: ${match[1]} unidades`);
    } else {
      console.log(`✗ Opción ${opcion}: NO ENCONTRADA`);
    }
  }
});

console.log('\n=== RESUMEN ===');
console.log('Verifica que todas las opciones 1, 2 y 3 estén presentes para cada género en Calzados.');
console.log('Si alguna está marcada como "NO ENCONTRADA", revisa el archivo predefinedCurves.ts');
