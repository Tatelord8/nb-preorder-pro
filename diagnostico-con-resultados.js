// Script de diagnóstico con resultados forzados
console.log("🔍 DIAGNÓSTICO CON RESULTADOS FORZADOS");
console.log("=====================================");

async function diagnosticarConResultados() {
  try {
    console.log("🔍 Iniciando diagnóstico...");

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

    // Obtener pedidos por user_id
    const { data: pedidosUserId } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd")
      .eq("cliente_id", session.user.id)
      .in("estado", ["autorizado", "completado"]);

    console.log(`✅ Pedidos por user_id: ${pedidosUserId.length}`);

    // Obtener pedidos por cliente_id
    let pedidosClienteId = [];
    if (userRole.cliente_id) {
      const { data } = await supabase
        .from("pedidos")
        .select("id, cliente_id, estado, total_usd")
        .eq("cliente_id", userRole.cliente_id)
        .in("estado", ["autorizado", "completado"]);
      
      pedidosClienteId = data || [];
      console.log(`✅ Pedidos por cliente_id: ${pedidosClienteId.length}`);
    }

    // Diagnóstico detallado
    console.log("\n🔍 DIAGNÓSTICO DETALLADO:");
    console.log("=========================");
    console.log(`User ID: ${session.user.id}`);
    console.log(`Cliente ID: ${userRole.cliente_id || 'NO ASIGNADO'}`);
    console.log(`Pedidos por user_id: ${pedidosUserId.length}`);
    console.log(`Pedidos por cliente_id: ${pedidosClienteId.length}`);
    
    if (!userRole.cliente_id) {
      console.log("❌ PROBLEMA: Usuario sin cliente_id asignado");
      console.log("💡 SOLUCIÓN: Asignar cliente_id = user_id en user_roles");
    } else if (pedidosUserId.length === 0 && pedidosClienteId.length > 0) {
      console.log("❌ PROBLEMA: Pedidos están en cliente_id pero filtro usa user_id");
      console.log("💡 SOLUCIÓN: Cambiar filtro en Pedidos.tsx para usar cliente_id");
    } else if (pedidosUserId.length > 0) {
      console.log("✅ OK: Pedidos están en user_id (correcto)");
    } else {
      console.log("⚠️ No hay pedidos para este usuario");
    }

    // Mostrar pedidos encontrados
    if (pedidosUserId.length > 0) {
      console.log("\n📋 Pedidos por user_id:");
      pedidosUserId.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, Estado: ${pedido.estado}, Total: $${pedido.total_usd}`);
      });
    }

    if (pedidosClienteId.length > 0) {
      console.log("\n📋 Pedidos por cliente_id:");
      pedidosClienteId.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, Estado: ${pedido.estado}, Total: $${pedido.total_usd}`);
      });
    }

    console.log("\n🎯 CONCLUSIÓN:");
    if (!userRole.cliente_id) {
      console.log("El usuario necesita tener cliente_id asignado en user_roles");
    } else if (pedidosUserId.length === 0 && pedidosClienteId.length > 0) {
      console.log("El filtro en Pedidos.tsx debe usar cliente_id en lugar de user_id");
    } else if (pedidosUserId.length > 0) {
      console.log("El sistema está funcionando correctamente");
    } else {
      console.log("No hay pedidos confirmados para este usuario");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Detalles:", error.message);
  }
}

// Ejecutar y mostrar resultado
diagnosticarConResultados().then(() => {
  console.log("\n✅ Diagnóstico completado");
}).catch((error) => {
  console.error("❌ Error en diagnóstico:", error);
});
