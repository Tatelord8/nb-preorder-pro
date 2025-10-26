import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verificarEnlacesVendedores() {
  console.log('🔍 Verificando enlaces entre usuarios, clientes y vendedores...\n');

  try {
    // 1. Verificar usuarios con roles
    console.log('👥 1. Usuarios con roles:');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        cliente_id,
        marca_id,
        nombre,
        tier_id
      `)
      .order('role');

    if (userRolesError) {
      console.error('❌ Error al obtener user_roles:', userRolesError);
      return;
    }

    if (!userRoles || userRoles.length === 0) {
      console.log('⚠️  No hay usuarios con roles en la base de datos');
    } else {
      console.log(`✅ ${userRoles.length} usuarios con roles encontrados:`);
      userRoles.forEach((userRole, index) => {
        console.log(`   ${index + 1}. User ID: ${userRole.user_id.slice(-8)}`);
        console.log(`      Rol: ${userRole.role}`);
        console.log(`      Cliente ID: ${userRole.cliente_id || 'N/A'}`);
        console.log(`      Marca ID: ${userRole.marca_id || 'N/A'}`);
        console.log(`      Nombre: ${userRole.nombre || 'N/A'}`);
        console.log(`      Tier ID: ${userRole.tier_id || 'N/A'}`);
        console.log('');
      });
    }

    // 2. Verificar vendedores
    console.log('👨‍💼 2. Vendedores en la tabla vendedores:');
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('id, nombre, email, created_at')
      .order('nombre');

    if (vendedoresError) {
      console.error('❌ Error al obtener vendedores:', vendedoresError);
    } else if (!vendedores || vendedores.length === 0) {
      console.log('⚠️  No hay vendedores en la tabla vendedores');
    } else {
      console.log(`✅ ${vendedores.length} vendedores encontrados:`);
      vendedores.forEach((vendedor, index) => {
        console.log(`   ${index + 1}. ${vendedor.nombre} (ID: ${vendedor.id})`);
        if (vendedor.email) console.log(`      Email: ${vendedor.email}`);
      });
    }

    // 3. Verificar clientes
    console.log('\n🏪 3. Clientes en la tabla clientes:');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nombre, tier, vendedor_id, marca_id, created_at')
      .order('nombre');

    if (clientesError) {
      console.error('❌ Error al obtener clientes:', clientesError);
    } else if (!clientes || clientes.length === 0) {
      console.log('⚠️  No hay clientes en la tabla clientes');
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

    // 4. Verificar pedidos
    console.log('📦 4. Pedidos en la tabla pedidos:');
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        id,
        cliente_id,
        vendedor_id,
        total_usd,
        estado,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (pedidosError) {
      console.error('❌ Error al obtener pedidos:', pedidosError);
    } else if (!pedidos || pedidos.length === 0) {
      console.log('⚠️  No hay pedidos en la tabla pedidos');
    } else {
      console.log(`✅ ${pedidos.length} pedidos encontrados:`);
      pedidos.forEach((pedido, index) => {
        console.log(`   ${index + 1}. Pedido ${pedido.id.slice(-8)}`);
        console.log(`      Cliente ID: ${pedido.cliente_id || 'N/A'}`);
        console.log(`      Vendedor ID: ${pedido.vendedor_id || 'N/A'}`);
        console.log(`      Estado: ${pedido.estado || 'N/A'}`);
        console.log(`      Total: $${pedido.total_usd}`);
        console.log(`      Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-ES')}`);
        console.log('');
      });
    }

    // 5. Análisis de enlaces
    console.log('🔗 5. Análisis de enlaces:');
    
    const usuariosClientes = userRoles?.filter(ur => ur.role === 'cliente') || [];
    const clientesConVendedor = clientes?.filter(c => c.vendedor_id) || [];
    const pedidosConVendedor = pedidos?.filter(p => p.vendedor_id) || [];

    console.log(`   - Usuarios con rol 'cliente': ${usuariosClientes.length}`);
    console.log(`   - Clientes con vendedor asignado: ${clientesConVendedor.length}`);
    console.log(`   - Pedidos con vendedor asignado: ${pedidosConVendedor.length}`);

    // 6. Verificar enlaces específicos
    console.log('\n🔍 6. Verificación de enlaces específicos:');
    
    if (usuariosClientes.length > 0 && clientes.length > 0) {
      console.log('   Verificando enlaces usuario-cliente:');
      usuariosClientes.forEach(userCliente => {
        const clienteEncontrado = clientes.find(c => c.id === userCliente.cliente_id);
        if (clienteEncontrado) {
          console.log(`   ✅ Usuario ${userCliente.user_id.slice(-8)} → Cliente ${clienteEncontrado.nombre}`);
          if (clienteEncontrado.vendedor_id) {
            const vendedorEncontrado = vendedores?.find(v => v.id === clienteEncontrado.vendedor_id);
            if (vendedorEncontrado) {
              console.log(`      ✅ Cliente ${clienteEncontrado.nombre} → Vendedor ${vendedorEncontrado.nombre}`);
            } else {
              console.log(`      ❌ Cliente ${clienteEncontrado.nombre} → Vendedor ID ${clienteEncontrado.vendedor_id} (NO ENCONTRADO)`);
            }
          } else {
            console.log(`      ⚠️  Cliente ${clienteEncontrado.nombre} → Sin vendedor asignado`);
          }
        } else {
          console.log(`   ❌ Usuario ${userCliente.user_id.slice(-8)} → Cliente ID ${userCliente.cliente_id} (NO ENCONTRADO)`);
        }
      });
    }

    // 7. Resumen de problemas
    console.log('\n📊 7. Resumen de problemas encontrados:');
    
    const problemas = [];
    
    if (usuariosClientes.length === 0) {
      problemas.push('No hay usuarios con rol cliente');
    }
    
    if (clientes.length === 0) {
      problemas.push('No hay clientes en la tabla clientes');
    }
    
    if (vendedores?.length === 0) {
      problemas.push('No hay vendedores en la tabla vendedores');
    }
    
    if (pedidos.length === 0) {
      problemas.push('No hay pedidos en la tabla pedidos');
    }

    if (problemas.length === 0) {
      console.log('   ✅ No se encontraron problemas críticos');
    } else {
      problemas.forEach((problema, index) => {
        console.log(`   ${index + 1}. ❌ ${problema}`);
      });
    }

    console.log('\n💡 Recomendaciones:');
    if (usuariosClientes.length > 0 && clientes.length === 0) {
      console.log('   - Los usuarios con rol cliente existen pero no hay clientes en la tabla clientes');
      console.log('   - Necesitas crear registros en la tabla clientes para estos usuarios');
    }
    
    if (clientes.length > 0 && vendedores?.length === 0) {
      console.log('   - Los clientes existen pero no hay vendedores en la tabla vendedores');
      console.log('   - Necesitas crear registros en la tabla vendedores');
    }
    
    if (pedidos.length === 0) {
      console.log('   - No hay pedidos para mostrar en el reporte');
      console.log('   - Necesitas crear pedidos de prueba para verificar el reporte');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verificarEnlacesVendedores();
