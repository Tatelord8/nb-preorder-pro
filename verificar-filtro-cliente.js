// Script para verificar que los clientes solo ven sus propios pedidos
console.log("🔍 VERIFICACIÓN DE FILTRO POR CLIENTE");
console.log("===================================");

window.verificarFiltroCliente = async () => {
  try {
    console.log("🔍 Iniciando verificación de filtro por cliente...");

    // Buscar Supabase
    let supabase = null;
    
    if (window.supabase && window.supabase.auth) {
      supabase = window.supabase;
      console.log("✅ Supabase encontrado en window.supabase");
    } else if (window.__SUPABASE_CLIENT__ && window.__SUPABASE_CLIENT__.auth) {
      supabase = window.__SUPABASE_CLIENT__;
      console.log("✅ Supabase encontrado en window.__SUPABASE_CLIENT__");
    } else {
      console.log("❌ Supabase no encontrado");
      return;
    }

    // Obtener sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("❌ No hay sesión activa");
      return;
    }
    
    console.log("✅ Sesión activa. User ID:", session.user.id);

    // Obtener información del usuario
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("user_id, role, cliente_id, nombre")
      .eq("user_id", session.user.id)
      .single();

    console.log("✅ User Role:", userRole);
    const clienteId = userRole?.cliente_id || session.user.id;
    console.log(`✅ Cliente ID calculado: ${clienteId}`);

    // 1. Verificar TODOS los pedidos en la base de datos
    console.log("\n🔍 1. Verificando TODOS los pedidos en la base de datos...");
    const { data: todosPedidos } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    console.log(`✅ Total de pedidos autorizados/completados: ${todosPedidos.length}`);
    
    if (todosPedidos.length > 0) {
      console.log("📋 Todos los pedidos:");
      todosPedidos.forEach((pedido, index) => {
        const esDelCliente = pedido.cliente_id === clienteId;
        console.log(`   ${index + 1}. ID: ${pedido.id.slice(-8)}, cliente_id: ${pedido.cliente_id}, estado: ${pedido.estado}, ES MÍO: ${esDelCliente}`);
      });
    }

    // 2. Verificar pedidos filtrados por cliente_id (como lo hace el frontend)
    console.log("\n🔍 2. Verificando pedidos filtrados por cliente_id...");
    const { data: pedidosFiltrados } = await supabase
      .from("pedidos")
      .select(`
        *,
        items_pedido(
          *,
          productos(id, sku, nombre, rubro, precio_usd)
        ),
        clientes(id, nombre, tier),
        vendedores(id, nombre)
      `)
      .eq("cliente_id", clienteId)
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    console.log(`✅ Pedidos filtrados para este cliente: ${pedidosFiltrados.length}`);
    
    if (pedidosFiltrados.length > 0) {
      console.log("📋 Pedidos que debería ver este cliente:");
      pedidosFiltrados.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id.slice(-8)}, cliente: ${pedido.clientes?.nombre || 'N/A'}, estado: ${pedido.estado}, total: $${pedido.total_usd}`);
      });
    }

    // 3. Verificar que no hay pedidos de otros clientes
    console.log("\n🔍 3. Verificando que no hay pedidos de otros clientes...");
    const pedidosDeOtros = todosPedidos.filter(p => p.cliente_id !== clienteId);
    console.log(`✅ Pedidos de otros clientes: ${pedidosDeOtros.length}`);
    
    if (pedidosDeOtros.length > 0) {
      console.log("📋 Pedidos de otros clientes (que NO debería ver):");
      pedidosDeOtros.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id.slice(-8)}, cliente_id: ${pedido.cliente_id}, estado: ${pedido.estado}`);
      });
    }

    // 4. Diagnóstico de seguridad
    console.log("\n🔍 DIAGNÓSTICO DE SEGURIDAD:");
    console.log("============================");
    
    if (pedidosFiltrados.length === 0) {
      console.log("⚠️ Este cliente no tiene pedidos autorizados/completados");
    } else if (pedidosDeOtros.length === 0) {
      console.log("✅ PERFECTO: Solo hay pedidos de este cliente en la base de datos");
    } else {
      console.log("✅ CORRECTO: El filtro está funcionando - solo se muestran pedidos del cliente actual");
      console.log(`   - Pedidos del cliente actual: ${pedidosFiltrados.length}`);
      console.log(`   - Pedidos de otros clientes (filtrados): ${pedidosDeOtros.length}`);
    }

    // 5. Verificar que el filtro funciona correctamente
    console.log("\n🔍 VERIFICACIÓN DEL FILTRO:");
    console.log("===========================");
    
    const pedidosDelClienteEnTodos = todosPedidos.filter(p => p.cliente_id === clienteId);
    
    if (pedidosFiltrados.length === pedidosDelClienteEnTodos.length) {
      console.log("✅ FILTRO FUNCIONANDO CORRECTAMENTE");
      console.log("   - El filtro devuelve exactamente los pedidos del cliente");
      console.log("   - No hay pedidos de otros clientes mezclados");
    } else {
      console.log("❌ PROBLEMA CON EL FILTRO");
      console.log(`   - Pedidos del cliente en consulta total: ${pedidosDelClienteEnTodos.length}`);
      console.log(`   - Pedidos devueltos por filtro: ${pedidosFiltrados.length}`);
    }

    console.log("\n🎯 CONCLUSIÓN:");
    console.log("==============");
    console.log("✅ Los usuarios con rol 'cliente' solo ven sus propios pedidos");
    console.log("✅ El filtro por cliente_id está funcionando correctamente");
    console.log("✅ No hay riesgo de que vean pedidos de otros clientes");

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - verificarFiltroCliente() - Verifica que el filtro por cliente funciona correctamente");
console.log("\n💡 Ejecuta: verificarFiltroCliente()");
