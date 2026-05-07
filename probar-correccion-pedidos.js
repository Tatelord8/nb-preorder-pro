// Script para probar la corrección de pedidos confirmados
console.log("🧪 PRUEBA DE CORRECCIÓN DE PEDIDOS CONFIRMADOS");
console.log("=============================================");

window.probarCorreccionPedidos = async () => {
  try {
    console.log("🔍 Iniciando prueba de corrección...");

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

    // Obtener user_roles
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("user_id, role, cliente_id, nombre")
      .eq("user_id", session.user.id)
      .single();

    console.log("✅ User Role:", userRole);

    // Obtener cliente_id correcto (como en la corrección)
    const clienteId = userRole?.cliente_id || session.user.id;
    console.log(`✅ Cliente ID calculado: ${clienteId}`);

    // Simular la consulta corregida del hook usePedidos
    console.log("\n🔍 Simulando consulta corregida de usePedidos...");
    const { data: pedidosCorregidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .eq("cliente_id", clienteId)  // Filtro corregido
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    if (pedidosError) {
      console.log("❌ Error en consulta corregida:", pedidosError);
      return;
    }

    console.log(`✅ Pedidos encontrados con filtro corregido: ${pedidosCorregidos.length}`);
    
    if (pedidosCorregidos.length > 0) {
      console.log("📋 Pedidos encontrados:");
      pedidosCorregidos.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, Estado: ${pedido.estado}, Total: $${pedido.total_usd}`);
      });
    }

    // Comparar con la consulta anterior (sin filtro de cliente_id)
    console.log("\n🔍 Comparando con consulta anterior (sin filtro)...");
    const { data: pedidosSinFiltro } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    console.log(`✅ Pedidos sin filtro de cliente: ${pedidosSinFiltro.length}`);

    // Diagnóstico de la corrección
    console.log("\n🔍 DIAGNÓSTICO DE LA CORRECCIÓN:");
    console.log("===============================");
    
    if (pedidosCorregidos.length > pedidosSinFiltro.filter(p => p.cliente_id === session.user.id).length) {
      console.log("✅ CORRECCIÓN EXITOSA: Se encontraron más pedidos con el filtro corregido");
    } else if (pedidosCorregidos.length === pedidosSinFiltro.filter(p => p.cliente_id === session.user.id).length) {
      console.log("✅ CORRECCIÓN EXITOSA: Se encontraron los mismos pedidos (correcto)");
    } else {
      console.log("⚠️ Verificar la corrección: Menos pedidos con el filtro corregido");
    }

    // Verificar que los pedidos tienen el cliente_id correcto
    const pedidosConClienteIdCorrecto = pedidosCorregidos.filter(p => p.cliente_id === clienteId);
    console.log(`✅ Pedidos con cliente_id correcto: ${pedidosConClienteIdCorrecto.length}/${pedidosCorregidos.length}`);

    console.log("\n🎯 RESULTADO ESPERADO:");
    console.log("=====================");
    console.log("1. Los pedidos confirmados ahora aparecerán en la pestaña 'Mis Pedidos'");
    console.log("2. El contador mostrará el número correcto de pedidos");
    console.log("3. El cliente podrá ver el detalle de sus pedidos confirmados");

    if (pedidosCorregidos.length > 0) {
      console.log("\n🎉 ¡CORRECCIÓN EXITOSA! Los pedidos confirmados deberían aparecer ahora.");
    } else {
      console.log("\n⚠️ No hay pedidos confirmados para este usuario aún.");
      console.log("   Esto es normal si el usuario no ha hecho pedidos o no han sido autorizados.");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarCorreccionPedidos() - Prueba la corrección de pedidos confirmados");
console.log("\n💡 Ejecuta: probarCorreccionPedidos()");











