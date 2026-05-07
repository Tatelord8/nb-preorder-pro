// Script ultra simple para diagnóstico
console.log("🔍 DIAGNÓSTICO ULTRA SIMPLE");
console.log("===========================");

// Función simple para diagnosticar
async function diagnosticarSimple() {
  try {
    console.log("🔍 Iniciando diagnóstico simple...");

    // Buscar Supabase en diferentes lugares
    let supabase = null;
    
    if (window.supabase && window.supabase.auth) {
      supabase = window.supabase;
      console.log("✅ Supabase encontrado en window.supabase");
    } else if (window.__SUPABASE_CLIENT__ && window.__SUPABASE_CLIENT__.auth) {
      supabase = window.__SUPABASE_CLIENT__;
      console.log("✅ Supabase encontrado en window.__SUPABASE_CLIENT__");
    } else {
      console.log("❌ Supabase no encontrado");
      console.log("💡 Refresca la página y ejecuta nuevamente");
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
    if (userRole.cliente_id) {
      const { data: pedidosClienteId } = await supabase
        .from("pedidos")
        .select("id, cliente_id, estado, total_usd")
        .eq("cliente_id", userRole.cliente_id)
        .in("estado", ["autorizado", "completado"]);

      console.log(`✅ Pedidos por cliente_id: ${pedidosClienteId.length}`);
    }

    // Diagnóstico
    console.log("\n🔍 DIAGNÓSTICO:");
    if (!userRole.cliente_id) {
      console.log("❌ PROBLEMA: Usuario sin cliente_id");
    } else if (pedidosUserId.length === 0 && pedidosClienteId.length > 0) {
      console.log("❌ PROBLEMA: Pedidos en cliente_id pero filtro usa user_id");
    } else if (pedidosUserId.length > 0) {
      console.log("✅ OK: Pedidos en user_id");
    } else {
      console.log("⚠️ No hay pedidos para este usuario");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Ejecutar automáticamente
diagnosticarSimple();











