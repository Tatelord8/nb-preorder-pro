import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verificarDatosVendedores() {
  console.log('🔍 Verificando datos de vendedores...\n');

  try {
    // 1. Verificar vendedores existentes
    console.log('📋 1. Vendedores en la base de datos:');
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('id, nombre, email, created_at')
      .order('created_at');

    if (vendedoresError) {
      console.error('❌ Error al obtener vendedores:', vendedoresError);
      return;
    }

    if (!vendedores || vendedores.length === 0) {
      console.log('⚠️  No hay vendedores en la base de datos');
    } else {
      vendedores.forEach((vendedor, index) => {
        console.log(`   ${index + 1}. ${vendedor.nombre} (ID: ${vendedor.id})`);
        if (vendedor.email) console.log(`      Email: ${vendedor.email}`);
      });
    }

    // 2. Verificar clientes y sus vendedores asignados
    console.log('\n👥 2. Clientes y sus vendedores asignados:');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select(`
        id, 
        nombre, 
        tier, 
        vendedor_id
      `)
      .order('nombre');

    if (clientesError) {
      console.error('❌ Error al obtener clientes:', clientesError);
      return;
    }

    if (!clientes || clientes.length === 0) {
      console.log('⚠️  No hay clientes en la base de datos');
    } else {
      clientes.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ${cliente.nombre} (Tier: ${cliente.tier})`);
        if (cliente.vendedor_id) {
          console.log(`      Vendedor ID: ${cliente.vendedor_id}`);
        } else {
          console.log(`      ⚠️  Sin vendedor asignado`);
        }
      });
    }

    // 3. Verificar pedidos y sus vendedores
    console.log('\n📦 3. Pedidos y sus vendedores:');
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
      return;
    }

    if (!pedidos || pedidos.length === 0) {
      console.log('⚠️  No hay pedidos en la base de datos');
    } else {
      console.log(`   Total de pedidos: ${pedidos.length}`);
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

    // 4. Verificar pedidos finalizados específicamente
    console.log('✅ 4. Pedidos finalizados (autorizado/completado):');
    const pedidosFinalizados = pedidos?.filter(p => 
      p.estado === 'autorizado' || p.estado === 'completado'
    ) || [];

    if (pedidosFinalizados.length === 0) {
      console.log('⚠️  No hay pedidos finalizados');
    } else {
      console.log(`   Total de pedidos finalizados: ${pedidosFinalizados.length}`);
      pedidosFinalizados.forEach((pedido, index) => {
        console.log(`   ${index + 1}. Pedido ${pedido.id.slice(-8)}`);
        console.log(`      Cliente ID: ${pedido.cliente_id || 'N/A'}`);
        console.log(`      Vendedor ID: ${pedido.vendedor_id || 'N/A'}`);
        console.log(`      Estado: ${pedido.estado}`);
        console.log(`      Total: $${pedido.total_usd}`);
        console.log('');
      });
    }

    // 5. Resumen de problemas encontrados
    console.log('📊 5. Resumen de problemas:');
    const clientesSinVendedor = clientes?.filter(c => !c.vendedor_id).length || 0;
    const pedidosSinVendedor = pedidos?.filter(p => !p.vendedor_id).length || 0;
    const pedidosFinalizadosSinVendedor = pedidosFinalizados.filter(p => !p.vendedor_id).length;

    console.log(`   - Clientes sin vendedor asignado: ${clientesSinVendedor}`);
    console.log(`   - Pedidos sin vendedor: ${pedidosSinVendedor}`);
    console.log(`   - Pedidos finalizados sin vendedor: ${pedidosFinalizadosSinVendedor}`);

    if (clientesSinVendedor > 0) {
      console.log('\n💡 Recomendación: Asignar vendedores a los clientes que no tienen uno asignado');
    }

    if (pedidosFinalizadosSinVendedor > 0) {
      console.log('\n💡 Recomendación: Los pedidos finalizados sin vendedor no mostrarán información de vendedor en el reporte');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verificarDatosVendedores();
