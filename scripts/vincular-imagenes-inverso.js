/**
 * Script para vincular imágenes de productos desde Supabase Storage
 * MODO INVERSO: Busca las imágenes en el bucket y las vincula con productos
 * 
 * Este script:
 * 1. Lista todas las imágenes del bucket
 * 2. Por cada imagen, extrae el SKU del nombre del archivo
 * 3. Busca el producto con ese SKU en la BD
 * 4. Actualiza el campo imagen_url en la tabla productos
 * 
 * Uso:
 * node scripts/vincular-imagenes-inverso.js
 * 
 * Opciones:
 * --dry-run        : Simula sin hacer cambios reales
 */

import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = 'https://oszmlmscckrbfnjrveet.supabase.co';
const BUCKET_NAME = 'product-images';
const EXTENSIONES_SOPORTADAS = ['jpg', 'jpeg', 'png', 'webp'];

// Service Role Key - IMPORTANTE: Obtener de Supabase Dashboard > Settings > API
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: Debes configurar SUPABASE_SERVICE_ROLE_KEY');
  console.error('Obtén tu Service Role Key de:');
  console.error('https://supabase.com/dashboard/project/oszmlmscckrbfnjrveet/settings/api');
  console.error('\nEjecuta: $env:SUPABASE_SERVICE_ROLE_KEY="tu_key_aqui" (Windows PowerShell)');
  console.error('o:      export SUPABASE_SERVICE_ROLE_KEY="tu_key_aqui" (Mac/Linux)');
  process.exit(1);
}

// Inicializar Supabase con Service Role Key (bypass RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parsear argumentos
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log('🚀 Iniciando script de vinculación INVERSA de imágenes...');
console.log('📋 Modo: Buscar imágenes en bucket y vincular con productos');
console.log(`🔍 Dry run: ${isDryRun ? 'SÍ (no se harán cambios)' : 'NO'}\n`);

/**
 * Extrae el SKU del nombre del archivo
 */
function extraerSKU(filename) {
  // Remover la extensión
  const nombreSinExt = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return nombreSinExt;
}

/**
 * Construye la URL pública de la imagen
 */
function construirURL(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
}

/**
 * Busca un producto por SKU
 */
async function buscarProductoPorSKU(sku) {
  const { data, error } = await supabase
    .from('productos')
    .select('id, sku, nombre, imagen_url')
    .eq('sku', sku)
    .single();
  
  return { data, error };
}

/**
 * Actualiza la URL de imagen de un producto
 */
async function actualizarProducto(productoId, imagenUrl) {
  if (isDryRun) {
    return { error: null };
  }
  
  const { error } = await supabase
    .from('productos')
    .update({ imagen_url: imagenUrl })
    .eq('id', productoId);
  
  return { error };
}

/**
 * Procesar imágenes del bucket
 */
async function procesarImagenes() {
  // Listar todas las imágenes del bucket
  console.log('📦 Obteniendo imágenes del bucket...');
  
  const { data: archivos, error: errorBucket } = await supabase
    .storage
    .from(BUCKET_NAME)
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (errorBucket) {
    console.error('❌ Error al obtener archivos del bucket:', errorBucket.message);
    process.exit(1);
  }
  
  // Filtrar solo archivos con extensiones válidas
  const imagenes = archivos.filter(archivo => {
    const ext = archivo.name.split('.').pop()?.toLowerCase();
    return EXTENSIONES_SOPORTADAS.includes(ext || '');
  });
  
  console.log(`✅ ${imagenes.length} imágenes encontradas en el bucket\n`);
  
  if (imagenes.length === 0) {
    console.log('⚠️  No se encontraron imágenes en el bucket');
    console.log('   Sube imágenes al bucket primero');
    process.exit(0);
  }
  
  // Estadísticas
  const stats = {
    total: imagenes.length,
    vinculados: 0,
    yaTenanImagen: 0,
    productoNoEncontrado: 0,
    errores: 0
  };
  
  console.log('🔄 Procesando imágenes...\n');
  
  // Procesar cada imagen
  for (let i = 0; i < imagenes.length; i++) {
    const archivo = imagenes[i];
    const num = i + 1;
    const sku = extraerSKU(archivo.name);
    
    console.log(`[${num}/${imagenes.length}] Archivo: ${archivo.name} → SKU: ${sku}`);
    
    // Buscar producto por SKU
    const { data: producto, error: errorProducto } = await buscarProductoPorSKU(sku);
    
    if (errorProducto || !producto) {
      console.log('  ⚠️  Producto no encontrado en BD');
      stats.productoNoEncontrado++;
      continue;
    }
    
    console.log(`  📦 Producto encontrado: ${producto.nombre}`);
    
    // Verificar si ya tiene imagen
    if (producto.imagen_url) {
      console.log('  ℹ️  Ya tiene imagen asignada');
      stats.yaTenanImagen++;
      continue;
    }
    
    // Construir URL
    const imagenUrl = construirURL(archivo.name);
    
    // Actualizar producto
    if (!isDryRun) {
      const { error } = await actualizarProducto(producto.id, imagenUrl);
      
      if (error) {
        console.log(`  ❌ Error al actualizar: ${error.message}`);
        stats.errores++;
        continue;
      }
    }
    
    console.log(`  ✅ ${isDryRun ? 'Sería vinculado' : 'Vinculado'} con: ${imagenUrl}`);
    stats.vinculados++;
  }
  
  // Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE EJECUCIÓN');
  console.log('='.repeat(60));
  console.log(`Total imágenes procesadas: ${stats.total}`);
  console.log(`✅ Vinculados:             ${stats.vinculados}`);
  console.log(`ℹ️  Ya tenían imagen:      ${stats.yaTenanImagen}`);
  console.log(`⚠️  Producto no encontrado: ${stats.productoNoEncontrado}`);
  console.log(`❌ Errores:                ${stats.errores}`);
  console.log('='.repeat(60));
  
  if (isDryRun) {
    console.log('\n💡 Esto fue una simulación (--dry-run)');
    console.log('   Ejecuta sin --dry-run para aplicar los cambios');
  }
  
  if (stats.productoNoEncontrado > 0) {
    console.log('\n💡 Hay imágenes sin producto correspondiente');
    console.log('   Verifica que los nombres de archivo coincidan con los SKUs');
  }
}

// Ejecutar
procesarImagenes()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

