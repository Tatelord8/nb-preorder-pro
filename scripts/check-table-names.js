/**
 * Script para verificar nombres exactos de tablas
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTableExists(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { exists: false, error: error.message, count: null };
    }

    return { exists: true, error: null, count };
  } catch (err) {
    return { exists: false, error: err.message, count: null };
  }
}

async function main() {
  console.log('🔍 VERIFICACIÓN DE NOMBRES DE TABLAS\n');

  const tablesToCheck = [
    { name: 'curvas', expectedName: 'curvas_predefinidas' },
    { name: 'curvas_predefinidas', expectedName: 'curvas' },
    { name: 'items_pedido', expectedName: 'pedidos_detalles' },
    { name: 'pedidos_detalles', expectedName: 'items_pedido' },
  ];

  for (const table of tablesToCheck) {
    const result = await checkTableExists(table.name);

    if (result.exists) {
      console.log(`✅ EXISTE: "${table.name}" (${result.count} registros)`);
      console.log(`   → La migración debería renombrar a "${table.expectedName}"`);
    } else {
      console.log(`❌ NO EXISTE: "${table.name}"`);
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  // Verificar datos críticos
  console.log('\n📊 VERIFICACIÓN DE DATOS CRÍTICOS:\n');

  // Verificar marcas
  const { count: marcasCount } = await supabase
    .from('marcas')
    .select('*', { count: 'exact', head: true });
  console.log(`📦 Marcas: ${marcasCount || 0} registros`);

  if (marcasCount === 0) {
    console.log('   ⚠️  La migración debe insertar marca "New Balance"');
  }

  // Verificar vendedores
  const { count: vendedoresCount } = await supabase
    .from('vendedores')
    .select('*', { count: 'exact', head: true });
  console.log(`👤 Vendedores: ${vendedoresCount || 0} registros`);

  if (vendedoresCount === 0) {
    console.log('   ⚠️  La migración debe insertar 3 vendedores');
  }

  // Verificar si existe tabla vendedores_users
  const vendedoresUsersResult = await checkTableExists('vendedores_users');
  if (vendedoresUsersResult.exists) {
    console.log(`✅ vendedores_users: EXISTE (${vendedoresUsersResult.count} registros)`);
  } else {
    console.log('❌ vendedores_users: NO EXISTE');
    console.log('   ⚠️  La migración debe crear esta tabla');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICACIÓN COMPLETADA');
}

main().catch(console.error);
