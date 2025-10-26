/**
 * Script de prueba de conexión a Supabase
 * Ejecutar con: node scripts/test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';

// Usar las credenciales del cliente hardcoded actual
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...\n');
  console.log('URL:', SUPABASE_URL);
  console.log('---\n');

  try {
    // Test 1: Verificar autenticación
    console.log('✅ Test 1: Verificando autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('⚠️  Sin sesión activa (normal si no hay usuario logueado)');
    } else {
      console.log('✅ Autenticación OK');
    }
    console.log('---\n');

    // Test 2: Contar productos
    console.log('📦 Test 2: Contando productos...');
    const { count: productosCount, error: productosError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });

    if (productosError) {
      console.log('❌ Error:', productosError.message);
    } else {
      console.log(`✅ Total de productos: ${productosCount}`);
    }
    console.log('---\n');

    // Test 3: Contar clientes
    console.log('👥 Test 3: Contando clientes...');
    const { count: clientesCount, error: clientesError } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    if (clientesError) {
      console.log('❌ Error:', clientesError.message);
    } else {
      console.log(`✅ Total de clientes: ${clientesCount}`);
    }
    console.log('---\n');

    // Test 4: Contar pedidos
    console.log('📋 Test 4: Contando pedidos...');
    const { count: pedidosCount, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });

    if (pedidosError) {
      console.log('❌ Error:', pedidosError.message);
    } else {
      console.log(`✅ Total de pedidos: ${pedidosCount}`);
    }
    console.log('---\n');

    // Test 5: Obtener muestra de productos
    console.log('📦 Test 5: Obteniendo muestra de productos...');
    const { data: productosSample, error: sampleError } = await supabase
      .from('productos')
      .select('id, sku, nombre, precio_usd, rubro, tier')
      .limit(3);

    if (sampleError) {
      console.log('❌ Error:', sampleError.message);
    } else {
      console.log(`✅ Productos de muestra (${productosSample.length}):`);
      productosSample.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.sku} - ${p.nombre} (USD $${p.precio_usd})`);
        console.log(`      Rubro: ${p.rubro}, Tier: ${p.tier}`);
      });
    }
    console.log('---\n');

    // Test 6: Obtener estructura de columnas
    console.log('📊 Test 6: Verificando estructura de tabla productos...');
    const { data: productosStructure, error: structureError } = await supabase
      .from('productos')
      .select('*')
      .limit(1);

    if (structureError) {
      console.log('❌ Error:', structureError.message);
    } else if (productosStructure && productosStructure[0]) {
      console.log('✅ Columnas disponibles:');
      console.log('   ', Object.keys(productosStructure[0]).join(', '));
    }
    console.log('---\n');

    // Test 7: Verificar marcas
    console.log('🏷️  Test 7: Contando marcas...');
    const { count: marcasCount, error: marcasError } = await supabase
      .from('marcas')
      .select('*', { count: 'exact', head: true });

    if (marcasError) {
      console.log('❌ Error:', marcasError.message);
    } else {
      console.log(`✅ Total de marcas: ${marcasCount}`);
    }
    console.log('---\n');

    // Test 8: Verificar vendedores
    console.log('👤 Test 8: Contando vendedores...');
    const { count: vendedoresCount, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('*', { count: 'exact', head: true });

    if (vendedoresError) {
      console.log('❌ Error:', vendedoresError.message);
    } else {
      console.log(`✅ Total de vendedores: ${vendedoresCount}`);
    }
    console.log('---\n');

    // Test 9: Verificar user_roles
    console.log('🔐 Test 9: Contando user_roles...');
    const { count: rolesCount, error: rolesError } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    if (rolesError) {
      console.log('❌ Error:', rolesError.message);
    } else {
      console.log(`✅ Total de user_roles: ${rolesCount}`);
    }
    console.log('---\n');

    // Test 10: Verificar tiers
    console.log('⭐ Test 10: Listando tiers...');
    const { data: tiers, error: tiersError } = await supabase
      .from('tiers')
      .select('*')
      .order('numero', { ascending: true });

    if (tiersError) {
      console.log('❌ Error:', tiersError.message);
    } else {
      console.log(`✅ Tiers disponibles (${tiers.length}):`);
      tiers.forEach(tier => {
        console.log(`   Tier ${tier.numero}: ${tier.nombre} - ${tier.descripcion || 'Sin descripción'}`);
      });
    }
    console.log('---\n');

    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('\n📊 RESUMEN:');
    console.log(`   - Productos: ${productosCount || 0}`);
    console.log(`   - Clientes: ${clientesCount || 0}`);
    console.log(`   - Pedidos: ${pedidosCount || 0}`);
    console.log(`   - Marcas: ${marcasCount || 0}`);
    console.log(`   - Vendedores: ${vendedoresCount || 0}`);
    console.log(`   - User Roles: ${rolesCount || 0}`);
    console.log(`   - Tiers: ${tiers?.length || 0}`);

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testConnection();
