// Script de diagnóstico completo para pedidos confirmados
console.log("🔍 DIAGNÓSTICO COMPLETO DE PEDIDOS CONFIRMADOS");
console.log("==============================================");

window.diagnosticarPedidosCompleto = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico completo...");

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

    // 1. Verificar user_roles
    console.log("\n🔍 1. Verificando user_roles...");
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, role, cliente_id, nombre")
      .eq("user_id", session.user.id)
      .single();

    if (roleError) {
      console.log("❌ Error obteniendo user_roles:", roleError);
      return;
    }

    console.log("✅ User Role:", userRole);
    const clienteId = userRole?.cliente_id || session.user.id;
    console.log(`✅ Cliente ID calculado: ${clienteId}`);

    // 2. Verificar si existe cliente en la tabla clientes
    console.log("\n🔍 2. Verificando tabla clientes...");
    const { data: clienteData, error: clienteError } = await supabase
      .from("clientes")
      .select("id, nombre, tier, vendedor_id")
      .eq("id", clienteId)
      .single();

    if (clienteError) {
      console.log("❌ Error obteniendo cliente:", clienteError);
      console.log("   Esto puede indicar que el cliente_id no existe en la tabla clientes");
    } else {
      console.log("✅ Cliente encontrado:", clienteData);
    }

    // 3. Verificar TODOS los pedidos en la base de datos
    console.log("\n🔍 3. Verificando TODOS los pedidos en la base de datos...");
    const { data: todosPedidos, error: todosError } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .order("created_at", { ascending: false });

    if (todosError) {
      console.log("❌ Error obteniendo todos los pedidos:", todosError);
      return;
    }

    console.log(`✅ Total de pedidos en la base de datos: ${todosPedidos.length}`);
    
    if (todosPedidos.length > 0) {
      console.log("📋 Primeros 5 pedidos:");
      todosPedidos.slice(0, 5).forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, cliente_id: ${pedido.cliente_id}, estado: ${pedido.estado}, total: $${pedido.total_usd}`);
      });
    }

    // 4. Verificar pedidos por estado
    console.log("\n🔍 4. Verificando pedidos por estado...");
    const estados = ['pendiente', 'autorizado', 'completado', 'cancelado'];
    
    for (const estado of estados) {
      const { data: pedidosEstado } = await supabase
        .from("pedidos")
        .select("id, cliente_id, estado, total_usd")
        .eq("estado", estado);
      
      console.log(`   - ${estado}: ${pedidosEstado.length} pedidos`);
    }

    // 5. Verificar pedidos autorizados/completados específicamente
    console.log("\n🔍 5. Verificando pedidos autorizados/completados...");
    const { data: pedidosConfirmados } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    console.log(`✅ Pedidos autorizados/completados: ${pedidosConfirmados.length}`);
    
    if (pedidosConfirmados.length > 0) {
      console.log("📋 Pedidos confirmados:");
      pedidosConfirmados.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, cliente_id: ${pedido.cliente_id}, estado: ${pedido.estado}, total: $${pedido.total_usd}`);
      });
    }

    // 6. Verificar pedidos para este cliente específico
    console.log("\n🔍 6. Verificando pedidos para este cliente...");
    
    // Por user_id
    const { data: pedidosUserId } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd")
      .eq("cliente_id", session.user.id)
      .in("estado", ["autorizado", "completado"]);

    console.log(`✅ Pedidos por user_id (${session.user.id}): ${pedidosUserId.length}`);

    // Por cliente_id
    if (userRole.cliente_id) {
      const { data: pedidosClienteId } = await supabase
        .from("pedidos")
        .select("id, cliente_id, estado, total_usd")
        .eq("cliente_id", userRole.cliente_id)
        .in("estado", ["autorizado", "completado"]);

      console.log(`✅ Pedidos por cliente_id (${userRole.cliente_id}): ${pedidosClienteId.length}`);
    }

    // 7. Verificar items_pedido
    console.log("\n🔍 7. Verificando items_pedido...");
    const { data: itemsPedido } = await supabase
      .from("items_pedido")
      .select("id, pedido_id, producto_id, cantidad, subtotal_usd")
      .limit(5);

    console.log(`✅ Items de pedido encontrados: ${itemsPedido.length}`);
    if (itemsPedido.length > 0) {
      console.log("📋 Primeros items:");
      itemsPedido.forEach((item, index) => {
        console.log(`   ${index + 1}. Pedido ID: ${item.pedido_id}, Producto: ${item.producto_id}, Cantidad: ${item.cantidad}`);
      });
    }

    // 8. Diagnóstico final
    console.log("\n🔍 DIAGNÓSTICO FINAL:");
    console.log("=====================");
    
    if (todosPedidos.length === 0) {
      console.log("❌ PROBLEMA: No hay pedidos en la base de datos");
      console.log("💡 SOLUCIÓN: Crear algunos pedidos de prueba");
    } else if (pedidosConfirmados.length === 0) {
      console.log("❌ PROBLEMA: No hay pedidos autorizados/completados");
      console.log("💡 SOLUCIÓN: Autorizar algunos pedidos pendientes");
    } else if (pedidosUserId.length === 0 && pedidosClienteId.length === 0) {
      console.log("❌ PROBLEMA: No hay pedidos para este cliente específico");
      console.log("💡 SOLUCIÓN: Verificar que los pedidos tengan el cliente_id correcto");
    } else {
      console.log("✅ Los pedidos existen, el problema puede estar en el frontend");
    }

    console.log("\n🎯 PRÓXIMOS PASOS:");
    console.log("==================");
    console.log("1. Si no hay pedidos: Crear pedidos de prueba");
    console.log("2. Si no hay pedidos confirmados: Autorizar pedidos pendientes");
    console.log("3. Si hay pedidos pero no aparecen: Verificar el filtro en Pedidos.tsx");

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarPedidosCompleto() - Diagnóstico completo de pedidos");
console.log("\n💡 Ejecuta: diagnosticarPedidosCompleto()");






