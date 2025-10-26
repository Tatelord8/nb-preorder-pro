/**
 * Script de análisis detallado de estructura de base de datos
 * Ejecutar con: node scripts/analyze-db-structure.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeTableStructure(tableName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 TABLA: ${tableName.toUpperCase()}`);
  console.log('='.repeat(70));

  try {
    // Get count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Error al acceder a la tabla: ${countError.message}`);
      return null;
    }

    console.log(`📊 Total de registros: ${count}`);

    // Get sample data to analyze structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Error al obtener datos: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      console.log(`\n📝 Estructura de columnas (${Object.keys(data[0]).length} columnas):`);

      const sampleRecord = data[0];
      Object.entries(sampleRecord).forEach(([key, value]) => {
        const type = typeof value;
        const isNull = value === null;
        const displayValue = isNull ? 'NULL' :
                           type === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` :
                           type === 'object' ? JSON.stringify(value).substring(0, 50) :
                           value;

        console.log(`   • ${key.padEnd(25)} [${type.padEnd(8)}] = ${displayValue}`);
      });

      if (count > 0) {
        console.log(`\n📌 Muestra de registros (primeros ${data.length}):`);
        data.forEach((record, index) => {
          console.log(`\n   Registro ${index + 1}:`);
          // Show only key fields
          const keyFields = ['id', 'sku', 'nombre', 'name', 'email', 'tier', 'estado', 'numero'];
          Object.entries(record)
            .filter(([key]) => keyFields.includes(key))
            .forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
        });
      }
    } else {
      console.log('⚠️  La tabla está vacía');
    }

    return { tableName, count, structure: data?.[0] ? Object.keys(data[0]) : [] };

  } catch (error) {
    console.error(`❌ Error inesperado en ${tableName}:`, error.message);
    return null;
  }
}

async function checkRelationships() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('🔗 ANÁLISIS DE RELACIONES');
  console.log('='.repeat(70));

  // Check productos relationships
  console.log('\n1️⃣ PRODUCTOS → MARCAS (marca_id)');
  const { data: productosWithMarcas, error: e1 } = await supabase
    .from('productos')
    .select('id, sku, marca_id')
    .not('marca_id', 'is', null)
    .limit(5);

  if (e1) {
    console.log('   ❌ Error:', e1.message);
  } else {
    console.log(`   ✅ Encontrados ${productosWithMarcas.length} productos con marca_id`);
    if (productosWithMarcas.length > 0) {
      console.log('   Muestras:', productosWithMarcas.map(p => `${p.sku} (marca_id: ${p.marca_id})`).join(', '));
    }
  }

  // Check clientes relationships
  console.log('\n2️⃣ CLIENTES → VENDEDORES (vendedor_id)');
  const { data: clientesWithVendedores, error: e2 } = await supabase
    .from('clientes')
    .select('id, nombre, vendedor_id')
    .not('vendedor_id', 'is', null)
    .limit(5);

  if (e2) {
    console.log('   ❌ Error:', e2.message);
  } else {
    console.log(`   ✅ Encontrados ${clientesWithVendedores?.length || 0} clientes con vendedor_id`);
  }

  // Check pedidos relationships
  console.log('\n3️⃣ PEDIDOS → CLIENTES (cliente_id)');
  const { data: pedidosWithClientes, error: e3 } = await supabase
    .from('pedidos')
    .select('id, cliente_id, estado')
    .not('cliente_id', 'is', null)
    .limit(5);

  if (e3) {
    console.log('   ❌ Error:', e3.message);
  } else {
    console.log(`   ✅ Encontrados ${pedidosWithClientes?.length || 0} pedidos con cliente_id`);
  }

  // Check user_roles relationships
  console.log('\n4️⃣ USER_ROLES → VENDEDORES (vendedor_id)');
  const { data: rolesWithVendedores, error: e4 } = await supabase
    .from('user_roles')
    .select('user_id, role, vendedor_id')
    .not('vendedor_id', 'is', null)
    .limit(5);

  if (e4) {
    console.log('   ❌ Error:', e4.message);
  } else {
    console.log(`   ✅ Encontrados ${rolesWithVendedores?.length || 0} roles con vendedor_id`);
  }
}

async function checkCurvasPredefinidas() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('📏 ANÁLISIS DE CURVAS PREDEFINIDAS');
  console.log('='.repeat(70));

  const { data, error } = await supabase
    .from('curvas_predefinidas')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Error:', error.message);
  } else if (data && data.length > 0) {
    console.log(`✅ Total de curvas: ${data.length} (mostrando primeras 5)`);
    data.forEach((curva, index) => {
      console.log(`\n   Curva ${index + 1}:`);
      console.log(`      ID: ${curva.id}`);
      console.log(`      Nombre: ${curva.nombre || 'Sin nombre'}`);
      console.log(`      Producto ID: ${curva.producto_id || 'N/A'}`);
      if (curva.talles) {
        console.log(`      Talles: ${JSON.stringify(curva.talles)}`);
      }
    });
  } else {
    console.log('⚠️  No hay curvas predefinidas');
  }
}

async function main() {
  console.log('🚀 ANÁLISIS DETALLADO DE ESTRUCTURA DE BASE DE DATOS');
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🌐 URL:', SUPABASE_URL);

  const tables = [
    'productos',
    'clientes',
    'pedidos',
    'pedidos_detalles',
    'vendedores',
    'marcas',
    'user_roles',
    'tiers',
    'curvas_predefinidas'
  ];

  const results = [];

  for (const table of tables) {
    const result = await analyzeTableStructure(table);
    if (result) {
      results.push(result);
    }
  }

  // Additional analysis
  await checkRelationships();
  await checkCurvasPredefinidas();

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 RESUMEN GENERAL');
  console.log('='.repeat(70));

  results.forEach(result => {
    const status = result.count === 0 ? '⚠️  VACÍA' : '✅ CON DATOS';
    console.log(`   ${result.tableName.padEnd(25)} ${status.padEnd(15)} ${result.count} registros`);
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log('🎯 INCONSISTENCIAS DETECTADAS:');
  console.log('='.repeat(70));

  const emptyTables = results.filter(r => r.count === 0);
  if (emptyTables.length > 0) {
    console.log('\n⚠️  Tablas vacías que deberían tener datos:');
    emptyTables.forEach(t => {
      if (!['pedidos', 'pedidos_detalles'].includes(t.tableName)) {
        console.log(`   • ${t.tableName}`);
      }
    });
  }

  console.log('\n✅ ANÁLISIS COMPLETADO');
}

main().catch(console.error);
