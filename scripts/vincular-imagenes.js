/**
 * Script para vincular imágenes de productos desde Supabase Storage
 * 
 * Este script:
 * 1. Lee todos los productos de la BD
 * 2. Por cada producto, construye la URL de la imagen basada en el SKU
 * 3. Verifica si la imagen existe en el bucket
 * 4. Actualiza el campo imagen_url en la tabla productos
 * 
 * Uso:
 * node scripts/vincular-imagenes.js
 * 
 * Opciones:
 * --modo=prueba    : Solo procesa los primeros 5 productos (default)
 * --modo=produccion: Procesa todos los productos
 * --dry-run        : Simula sin hacer cambios reales
 */

import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = 'https://nplonbsyfkxcffwyaoze.supabase.co';
const BUCKET_NAME = 'productos-imagenes';
const EXTENSIONES_SOPORTADAS = ['jpg', 'jpeg', 'png', 'webp'];

// Service Role Key - IMPORTANTE: Obtener de Supabase Dashboard > Settings > API
// NO COMMITEAR ESTE ARCHIVO CON LA KEY REAL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: Debes configurar SUPABASE_SERVICE_ROLE_KEY');
  console.error('Obtén tu Service Role Key de:');
  console.error('https://supabase.com/dashboard/project/nplonbsyfkxcffwyaoze/settings/api');
  console.error('\nEjecuta: set SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui (Windows)');
  console.error('o:      export SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui (Mac/Linux)');
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
const modo = args.find(arg => arg.startsWith('--modo='))?.split('=')[1] || 'prueba';
const isDryRun = args.includes('--dry-run');

console.log('🚀 Iniciando script de vinculación de imágenes...');
console.log(`📋 Modo: ${modo}`);
console.log(`🔍 Dry run: ${isDryRun ? 'SÍ (no se harán cambios)' : 'NO'}\n`);

/**
 * Verifica si una imagen existe en el bucket
 */
async function verificarImagenExiste(sku) {
  for (const ext of EXTENSIONES_SOPORTADAS) {
    const filename = `${sku}.${ext}`;
    
    try {
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 1,
          search: filename
        });
      
      if (data && data.length > 0) {
        return { existe: true, filename, extension: ext };
      }
    } catch (error) {
      // Continuar con la siguiente extensión
    }
  }
  
  return { existe: false, filename: null, extension: null };
}

/**
 * Construye la URL pública de la imagen
 */
function construirURL(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
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
 * Procesar productos
 */
async function procesarProductos() {
  // Obtener productos
  console.log('📦 Obteniendo productos de la base de datos...');
  
  let query = supabase
    .from('productos')
    .select('id, sku, nombre, imagen_url');
  
  if (modo === 'prueba') {
    query = query.limit(5);
  }
  
  const { data: productos, error: errorProductos } = await query;
  
  if (errorProductos) {
    console.error('❌ Error al obtener productos:', errorProductos.message);
    process.exit(1);
  }
  
  console.log(`✅ ${productos.length} productos obtenidos\n`);
  
  // Estadísticas
  const stats = {
    total: productos.length,
    actualizados: 0,
    sinImagen: 0,
    yaTenanImagen: 0,
    errores: 0
  };
  
  console.log('🔄 Procesando productos...\n');
  
  // Procesar cada producto
  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    const num = i + 1;
    
    console.log(`[${num}/${productos.length}] SKU: ${producto.sku} - ${producto.nombre}`);
    
    // Si ya tiene imagen, skip
    if (producto.imagen_url) {
      console.log('  ℹ️  Ya tiene imagen asignada');
      stats.yaTenanImagen++;
      continue;
    }
    
    // Verificar si existe imagen en storage
    const { existe, filename, extension } = await verificarImagenExiste(producto.sku);
    
    if (!existe) {
      console.log('  ⚠️  Imagen no encontrada en storage');
      stats.sinImagen++;
      continue;
    }
    
    // Construir URL
    const imagenUrl = construirURL(filename);
    console.log(`  📸 Imagen encontrada: ${filename}`);
    
    // Actualizar producto
    if (!isDryRun) {
      const { error } = await actualizarProducto(producto.id, imagenUrl);
      
      if (error) {
        console.log(`  ❌ Error al actualizar: ${error.message}`);
        stats.errores++;
        continue;
      }
    }
    
    console.log(`  ✅ ${isDryRun ? 'Sería actualizado' : 'Actualizado'} con: ${imagenUrl}`);
    stats.actualizados++;
  }
  
  // Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE EJECUCIÓN');
  console.log('='.repeat(60));
  console.log(`Total procesados:      ${stats.total}`);
  console.log(`✅ Actualizados:       ${stats.actualizados}`);
  console.log(`ℹ️  Ya tenían imagen:  ${stats.yaTenanImagen}`);
  console.log(`⚠️  Sin imagen:        ${stats.sinImagen}`);
  console.log(`❌ Errores:            ${stats.errores}`);
  console.log('='.repeat(60));
  
  if (isDryRun) {
    console.log('\n💡 Esto fue una simulación (--dry-run)');
    console.log('   Ejecuta sin --dry-run para aplicar los cambios');
  }
  
  if (modo === 'prueba') {
    console.log('\n💡 Modo prueba activo (solo primeros 5 productos)');
    console.log('   Usa --modo=produccion para procesar todos');
  }
}

// Ejecutar
procesarProductos()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

