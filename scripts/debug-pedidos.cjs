const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oszmlmscckrbfnjrveet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98'
);

async function debugPedidos() {
  console.log('\n🔍 DEBUG: PROBLEMA AL CREAR PEDIDOS\n');
  console.log('='.repeat(70));

  try {
    // 1. Ver estructura de user_roles con role=cliente
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, nombre, role, cliente_id')
      .eq('role', 'cliente');

    if (rolesError) {
      console.error('❌ Error al obtener user_roles:', rolesError);
      return;
    }

    console.log('\n📋 USER_ROLES CON ROLE=CLIENTE:');
    console.log(`Total: ${userRoles.length}\n`);

    for (const userRole of userRoles) {
      console.log(`👤 ${userRole.nombre}`);
      console.log(`   user_id: ${userRole.user_id}`);
      console.log(`   cliente_id: ${userRole.cliente_id || 'NULL'}`);

      // Verificar si user_id existe en clientes
      const { data: clienteByUserId, error: e1 } = await supabase
        .from('clientes')
        .select('id, nombre')
        .eq('id', userRole.user_id)
        .maybeSingle();

      if (clienteByUserId) {
        console.log(`   ✅ user_id EXISTE en tabla clientes: ${clienteByUserId.nombre}`);
      } else {
        console.log(`   ❌ user_id NO EXISTE en tabla clientes`);
      }

      // Verificar si cliente_id existe en clientes (si tiene cliente_id)
      if (userRole.cliente_id) {
        const { data: clienteByClienteId } = await supabase
          .from('clientes')
          .select('id, nombre')
          .eq('id', userRole.cliente_id)
          .maybeSingle();

        if (clienteByClienteId) {
          console.log(`   ✅ cliente_id EXISTE en tabla clientes: ${clienteByClienteId.nombre}`);
        } else {
          console.log(`   ❌ cliente_id NO EXISTE en tabla clientes`);
        }
      }
      console.log('');
    }

    // 2. Ver todos los clientes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nombre, tier');

    console.log('\n📦 CLIENTES EN LA TABLA:');
    console.log(`Total: ${clientes?.length || 0}\n`);

    if (clientes && clientes.length > 0) {
      clientes.forEach((c, i) => {
        console.log(`${i + 1}. ${c.nombre} (ID: ${c.id}, Tier: ${c.tier})`);
      });
    }

    // 3. Intentar simular la inserción que falla
    console.log('\n\n🧪 SIMULANDO INSERCIÓN DE PEDIDO:\n');

    if (userRoles && userRoles.length > 0) {
      const testUser = userRoles[0];
      console.log(`Usando usuario de prueba: ${testUser.nombre}`);

      // Intentar con user_id (lo que hace Cart.tsx)
      const clienteIdForPedido = testUser.user_id;
      console.log(`cliente_id que se va a usar: ${clienteIdForPedido}`);

      // Verificar si existe
      const { data: clienteExists } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', clienteIdForPedido)
        .maybeSingle();

      if (!clienteExists) {
        console.log(`\n❌ PROBLEMA ENCONTRADO:`);
        console.log(`   El user_id "${clienteIdForPedido}" NO existe en la tabla clientes.`);
        console.log(`   La FK constraint "pedidos_cliente_id_fkey" va a fallar.`);
        console.log(`\n💡 SOLUCIÓN:`);
        console.log(`   Necesitas crear un registro en la tabla clientes con id="${clienteIdForPedido}"`);
        console.log(`   O usar un cliente_id diferente que sí exista.`);
      } else {
        console.log(`\n✅ El cliente_id existe, el pedido debería poder crearse.`);
      }
    }

    // 4. Revisar constraints de la tabla pedidos
    console.log('\n\n🔧 FOREIGN KEY CONSTRAINTS EN TABLA PEDIDOS:\n');

    const { data: constraints } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'pedidos';
      `
    }).catch(() => null);

    if (constraints) {
      constraints.forEach(c => {
        console.log(`📌 ${c.constraint_name}`);
        console.log(`   ${c.table_name}.${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name}`);
      });
    } else {
      console.log('No se pudo obtener información de constraints (requiere permisos)');
    }

  } catch (error) {
    console.error('\n❌ Error inesperado:', error);
  }

  console.log('\n' + '='.repeat(70));
}

debugPedidos();
