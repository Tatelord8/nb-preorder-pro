const { createClient } = require('@supabase/supabase-js');

// Credenciales desde .env
const supabase = createClient(
  'https://oszmlmscckrbfnjrveet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98'
);

async function checkVendedores() {
  console.log('\n📊 DIAGNÓSTICO DE VENDEDORES\n');
  console.log('='.repeat(60));

  try {
    // 1. Ver todos los vendedores
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('*');

    if (vendedoresError) {
      console.error('❌ Error al obtener vendedores:', vendedoresError);
    } else {
      console.log('\n✅ VENDEDORES EN LA BASE DE DATOS:');
      console.log(`Total: ${vendedores.length}`);
      vendedores.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.nombre}`);
        console.log(`   ID: ${v.id}`);
        console.log(`   User ID: ${v.user_id || 'No vinculado'}`);
      });
    }

    // 2. Ver todos los clientes con vendedor asignado
    const { data: clientesConVendedor, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nombre, vendedor_id')
      .not('vendedor_id', 'is', null);

    if (clientesError) {
      console.error('❌ Error al obtener clientes:', clientesError);
    } else {
      console.log('\n\n✅ CLIENTES CON VENDEDOR ASIGNADO:');
      console.log(`Total: ${clientesConVendedor.length}`);

      for (const cliente of clientesConVendedor) {
        console.log(`\n- ${cliente.nombre}`);
        console.log(`  Cliente ID: ${cliente.id}`);
        console.log(`  Vendedor ID asignado: ${cliente.vendedor_id}`);

        // Buscar el nombre del vendedor
        const vendedor = vendedores.find(v => v.id === cliente.vendedor_id);
        if (vendedor) {
          console.log(`  ✅ Vendedor encontrado: ${vendedor.nombre}`);
        } else {
          console.log(`  ❌ PROBLEMA: No se encontró vendedor con ID ${cliente.vendedor_id}`);
        }
      }
    }

    // 3. Verificar estructura de la query que usa Cart.tsx
    console.log('\n\n🔍 PROBANDO QUERY DE CART.TSX:\n');

    if (clientesConVendedor && clientesConVendedor.length > 0) {
      const primerCliente = clientesConVendedor[0];
      console.log(`Probando con cliente: ${primerCliente.nombre} (ID: ${primerCliente.id})`);

      // Simular la query de Cart.tsx
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id, nombre, tier, vendedor_id")
        .eq("id", primerCliente.id)
        .single();

      console.log('\n1. Cliente obtenido:', JSON.stringify(cliente, null, 2));

      if (cliente?.vendedor_id) {
        const { data: vendedor } = await supabase
          .from("vendedores")
          .select("nombre")
          .eq("id", cliente.vendedor_id)
          .single();

        console.log('\n2. Vendedor obtenido:', JSON.stringify(vendedor, null, 2));

        if (vendedor) {
          const clienteData = { ...cliente, vendedores: vendedor };
          console.log('\n3. Estructura final:', JSON.stringify(clienteData, null, 2));
          console.log(`\n✅ El vendedor debería aparecer como: ${clienteData.vendedores.nombre}`);
        } else {
          console.log('\n❌ PROBLEMA: No se pudo obtener el vendedor');
        }
      }
    }

    // 4. Verificar user_roles vinculados
    console.log('\n\n📋 USER_ROLES VINCULADOS A CLIENTES CON VENDEDOR:\n');

    if (clientesConVendedor && clientesConVendedor.length > 0) {
      for (const cliente of clientesConVendedor.slice(0, 3)) {  // Solo primeros 3
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('user_id, role, nombre')
          .eq('user_id', cliente.id)
          .single();

        if (userRole) {
          console.log(`\n✅ ${cliente.nombre}`);
          console.log(`   User ID: ${userRole.user_id}`);
          console.log(`   Role: ${userRole.role}`);
          console.log(`   Vendedor asignado ID: ${cliente.vendedor_id}`);
        } else {
          console.log(`\n⚠️  ${cliente.nombre} - No tiene user_role vinculado`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error inesperado:', error);
  }

  console.log('\n' + '='.repeat(60));
}

checkVendedores();
