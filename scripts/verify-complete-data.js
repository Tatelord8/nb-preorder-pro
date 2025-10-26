import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verificarDatosCompletos() {
  console.log('🔍 Verificación completa de datos y enlaces...\n');

  try {
    // 1. Verificar usando la función get_users_with_roles
    console.log('👥 1. Usuarios con roles (usando función del sistema):');
    const { data: usersWithRoles, error: usersError } = await supabase
      .rpc('get_users_with_roles');

    if (usersError) {
      console.error('❌ Error al obtener usuarios con roles:', usersError);
    } else if (!usersWithRoles || usersWithRoles.length === 0) {
      console.log('⚠️  No hay usuarios con roles');
    } else {
      console.log(`✅ ${usersWithRoles.length} usuarios con roles encontrados:`);
      usersWithRoles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Nombre: ${user.nombre}`);
        console.log(`      Rol: ${user.role}`);
        console.log(`      Cliente ID: ${user.cliente_id || 'N/A'}`);
        console.log(`      Marca ID: ${user.marca_id || 'N/A'}`);
        console.log(`      Tier ID: ${user.tier_id || 'N/A'}`);
        console.log(`      Tier Nombre: ${user.tier_nombre || 'N/A'}`);
        console.log('');
      });
    }

    // 2. Verificar vendedores directamente
    console.log('👨‍💼 2. Vendedores:');
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('*');

    if (vendedoresError) {
      console.error('❌ Error al obtener vendedores:', vendedoresError);
    } else if (!vendedores || vendedores.length === 0) {
      console.log('⚠️  No hay vendedores');
    } else {
      console.log(`✅ ${vendedores.length} vendedores encontrados:`);
      vendedores.forEach((vendedor, index) => {
        console.log(`   ${index + 1}. ${vendedor.nombre} (ID: ${vendedor.id})`);
        if (vendedor.email) console.log(`      Email: ${vendedor.email}`);
      });
    }

    // 3. Verificar clientes directamente
    console.log('\n🏪 3. Clientes:');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*');

    if (clientesError) {
      console.error('❌ Error al obtener clientes:', clientesError);
    } else if (!clientes || clientes.length === 0) {
      console.log('⚠️  No hay clientes');
    } else {
      console.log(`✅ ${clientes.length} clientes encontrados:`);
      clientes.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ${cliente.nombre} (Tier: ${cliente.tier})`);
        console.log(`      ID: ${cliente.id}`);
        console.log(`      Vendedor ID: ${cliente.vendedor_id || 'N/A'}`);
        console.log(`      Marca ID: ${cliente.marca_id || 'N/A'}`);
        console.log('');
      });
    }

    // 4. Verificar pedidos directamente
    console.log('📦 4. Pedidos:');
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes(nombre, tier),
        vendedores(nombre)
      `);

    if (pedidosError) {
      console.error('❌ Error al obtener pedidos:', pedidosError);
    } else if (!pedidos || pedidos.length === 0) {
      console.log('⚠️  No hay pedidos');
    } else {
      console.log(`✅ ${pedidos.length} pedidos encontrados:`);
      pedidos.forEach((pedido, index) => {
        console.log(`   ${index + 1}. Pedido ${pedido.id.slice(-8)}`);
        console.log(`      Cliente: ${pedido.clientes?.nombre || 'N/A'}`);
        console.log(`      Vendedor: ${pedido.vendedores?.nombre || 'N/A'}`);
        console.log(`      Estado: ${pedido.estado || 'N/A'}`);
        console.log(`      Total: $${pedido.total_usd}`);
        console.log(`      Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-ES')}`);
        console.log('');
      });
    }

    // 5. Análisis de enlaces basado en los datos reales
    console.log('🔗 5. Análisis de enlaces:');
    
    if (usersWithRoles && usersWithRoles.length > 0) {
      const usuariosClientes = usersWithRoles.filter(u => u.role === 'cliente');
      console.log(`   - Usuarios con rol 'cliente': ${usuariosClientes.length}`);
      
      if (usuariosClientes.length > 0) {
        console.log('   - Detalles de usuarios cliente:');
        usuariosClientes.forEach(user => {
          console.log(`     • ${user.email} (${user.nombre})`);
          console.log(`       Cliente ID: ${user.cliente_id || 'N/A'}`);
          console.log(`       Tier: ${user.tier_nombre || 'N/A'}`);
        });
      }
    }

    if (clientes && clientes.length > 0) {
      const clientesConVendedor = clientes.filter(c => c.vendedor_id);
      console.log(`   - Clientes con vendedor asignado: ${clientesConVendedor.length}`);
      
      if (clientesConVendedor.length > 0) {
        console.log('   - Detalles de clientes con vendedor:');
        clientesConVendedor.forEach(cliente => {
          const vendedor = vendedores?.find(v => v.id === cliente.vendedor_id);
          console.log(`     • ${cliente.nombre} → ${vendedor?.nombre || 'Vendedor no encontrado'}`);
        });
      }
    }

    if (pedidos && pedidos.length > 0) {
      const pedidosConVendedor = pedidos.filter(p => p.vendedor_id);
      console.log(`   - Pedidos con vendedor asignado: ${pedidosConVendedor.length}`);
    }

    // 6. Verificar si hay datos pero no se muestran en el reporte
    console.log('\n🔍 6. Verificación específica para el reporte:');
    
    if (pedidos && pedidos.length > 0) {
      const pedidosFinalizados = pedidos.filter(p => 
        p.estado === 'autorizado' || p.estado === 'completado'
      );
      
      console.log(`   - Pedidos finalizados: ${pedidosFinalizados.length}`);
      
      if (pedidosFinalizados.length > 0) {
        console.log('   - Detalles de pedidos finalizados:');
        pedidosFinalizados.forEach(pedido => {
          console.log(`     • Pedido ${pedido.id.slice(-8)}`);
          console.log(`       Cliente: ${pedido.clientes?.nombre || 'N/A'}`);
          console.log(`       Vendedor: ${pedido.vendedores?.nombre || 'N/A'}`);
          console.log(`       Estado: ${pedido.estado}`);
          console.log(`       Total: $${pedido.total_usd}`);
        });
      }
    }

    // 7. Resumen final
    console.log('\n📊 7. Resumen final:');
    
    const tieneUsuarios = usersWithRoles && usersWithRoles.length > 0;
    const tieneVendedores = vendedores && vendedores.length > 0;
    const tieneClientes = clientes && clientes.length > 0;
    const tienePedidos = pedidos && pedidos.length > 0;
    
    console.log(`   - Usuarios con roles: ${tieneUsuarios ? '✅' : '❌'}`);
    console.log(`   - Vendedores: ${tieneVendedores ? '✅' : '❌'}`);
    console.log(`   - Clientes: ${tieneClientes ? '✅' : '❌'}`);
    console.log(`   - Pedidos: ${tienePedidos ? '✅' : '❌'}`);
    
    if (tieneUsuarios && tieneVendedores && tieneClientes && tienePedidos) {
      console.log('\n🎉 ¡Todos los datos están presentes!');
      console.log('   El reporte debería mostrar correctamente los vendedores.');
    } else {
      console.log('\n⚠️  Faltan algunos datos para que el reporte funcione completamente.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verificarDatosCompletos();
