/**
 * Script para verificar estructura detallada de tablas duplicadas
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getTableStructure(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return { columns: null, error: error.message };
    }

    if (data && data.length > 0) {
      return { columns: Object.keys(data[0]), error: null };
    } else {
      // Tabla vacía, intentar obtener estructura de otra forma
      return { columns: [], error: null };
    }
  } catch (err) {
    return { columns: null, error: err.message };
  }
}

async function main() {
  console.log('🔍 VERIFICACIÓN DETALLADA DE TABLAS DUPLICADAS\n');
  console.log('='.repeat(70) + '\n');

  // Verificar curvas vs curvas_predefinidas
  console.log('📋 CURVAS vs CURVAS_PREDEFINIDAS:\n');

  const curvas = await getTableStructure('curvas');
  const curvasPred = await getTableStructure('curvas_predefinidas');

  console.log('Tabla "curvas":');
  if (curvas.error) {
    console.log(`   ❌ Error: ${curvas.error}`);
  } else {
    console.log(`   ✅ Columnas: ${curvas.columns?.join(', ') || 'Vacía, no hay datos para ver estructura'}`);
  }

  console.log('\nTabla "curvas_predefinidas":');
  if (curvasPred.error) {
    console.log(`   ❌ Error: ${curvasPred.error}`);
  } else {
    console.log(`   ✅ Columnas: ${curvasPred.columns?.join(', ') || 'Vacía, no hay datos para ver estructura'}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Verificar items_pedido vs pedidos_detalles
  console.log('📋 ITEMS_PEDIDO vs PEDIDOS_DETALLES:\n');

  const itemsPedido = await getTableStructure('items_pedido');
  const pedidosDetalles = await getTableStructure('pedidos_detalles');

  console.log('Tabla "items_pedido":');
  if (itemsPedido.error) {
    console.log(`   ❌ Error: ${itemsPedido.error}`);
  } else {
    console.log(`   ✅ Columnas: ${itemsPedido.columns?.join(', ') || 'Vacía, no hay datos para ver estructura'}`);
  }

  console.log('\nTabla "pedidos_detalles":');
  if (pedidosDetalles.error) {
    console.log(`   ❌ Error: ${pedidosDetalles.error}`);
  } else {
    console.log(`   ✅ Columnas: ${pedidosDetalles.columns?.join(', ') || 'Vacía, no hay datos para ver estructura'}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Contar registros
  console.log('📊 CONTEO DE REGISTROS:\n');

  const tables = ['curvas', 'curvas_predefinidas', 'items_pedido', 'pedidos_detalles', 'vendedores_users'];

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    console.log(`   ${table.padEnd(25)} ${count ?? 0} registros`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // RECOMENDACIÓN
  console.log('💡 RECOMENDACIÓN:\n');

  if (curvasPred.error && !curvas.error) {
    console.log('   ✅ Usar tabla "curvas" (la otra tiene errores)');
    console.log('   ⚠️  NO aplicar renombrado en la migración');
  } else if (curvas.error && !curvasPred.error) {
    console.log('   ✅ Usar tabla "curvas_predefinidas" (la otra tiene errores)');
    console.log('   ⚠️  Eliminar tabla "curvas" duplicada');
  } else {
    console.log('   ⚠️  Ambas tablas existen sin errores');
    console.log('   📋 Verificar manualmente en Supabase Dashboard cuál usar');
  }

  console.log('');

  if (pedidosDetalles.error && !itemsPedido.error) {
    console.log('   ✅ Usar tabla "items_pedido" (la otra tiene errores)');
    console.log('   ⚠️  NO aplicar renombrado en la migración');
  } else if (itemsPedido.error && !pedidosDetalles.error) {
    console.log('   ✅ Usar tabla "pedidos_detalles" (la otra tiene errores)');
    console.log('   ⚠️  Eliminar tabla "items_pedido" duplicada');
  } else {
    console.log('   ⚠️  Ambas tablas de pedidos existen sin errores');
    console.log('   📋 Verificar manualmente en Supabase Dashboard cuál usar');
  }

  console.log('\n✅ VERIFICACIÓN COMPLETADA');
}

main().catch(console.error);
