// Script simple para verificar Supabase y ejecutar diagnóstico
console.log("🔍 VERIFICACIÓN DE SUPABASE Y DIAGNÓSTICO");
console.log("=========================================");

window.verificarSupabaseYDiagnosticar = async () => {
  try {
    console.log("🔍 Verificando disponibilidad de Supabase...");

    // Verificar diferentes ubicaciones donde puede estar Supabase
    const ubicacionesSupabase = [
      'window.supabase',
      'window.__SUPABASE_CLIENT__',
      'window.supabaseClient',
      'window.supabaseClient.client',
      'window.supabaseClient.supabase'
    ];

    let supabaseEncontrado = null;
    let ubicacionEncontrada = null;

    for (const ubicacion of ubicacionesSupabase) {
      try {
        const supabase = eval(ubicacion);
        if (supabase && supabase.auth) {
          supabaseEncontrado = supabase;
          ubicacionEncontrada = ubicacion;
          console.log(`✅ Supabase encontrado en: ${ubicacion}`);
          break;
        }
      } catch (e) {
        // Continuar buscando
      }
    }

    if (!supabaseEncontrado) {
      console.log("❌ Supabase no encontrado en ninguna ubicación");
      console.log("💡 Intenta refrescar la página y ejecutar el script nuevamente");
      console.log("💡 O verifica que estés en una página donde Supabase esté inicializado");
      return;
    }

    // Ahora ejecutar el diagnóstico
    console.log("\n🔍 Ejecutando diagnóstico con Supabase encontrado...");
    
    const { data: { session }, error: sessionError } = await supabaseEncontrado.auth.getSession();
    if (sessionError || !session) {
      console.log("❌ No hay sesión activa. Por favor, inicia sesión.");
      return;
    }
    const userId = session.user.id;
    console.log("✅ Sesión activa. User ID:", userId);

    // Verificar información del usuario en user_roles
    const { data: userRole, error: roleError } = await supabaseEncontrado
      .from("user_roles")
      .select("user_id, role, cliente_id, nombre")
      .eq("user_id", userId)
      .single();

    if (roleError) {
      console.log("❌ Error obteniendo user_roles:", roleError);
      return;
    }

    console.log("✅ Información de user_roles:", userRole);
    console.log(`   - user_id: ${userRole.user_id}`);
    console.log(`   - cliente_id: ${userRole.cliente_id}`);

    // Verificar pedidos por user_id
    const { data: pedidosPorUserId } = await supabaseEncontrado
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd")
      .eq("cliente_id", userId)
      .in("estado", ["autorizado", "completado"]);

    console.log(`✅ Pedidos por user_id: ${pedidosPorUserId.length}`);

    // Verificar pedidos por cliente_id
    if (userRole.cliente_id) {
      const { data: pedidosPorClienteId } = await supabaseEncontrado
        .from("pedidos")
        .select("id, cliente_id, estado, total_usd")
        .eq("cliente_id", userRole.cliente_id)
        .in("estado", ["autorizado", "completado"]);

      console.log(`✅ Pedidos por cliente_id: ${pedidosPorClienteId.length}`);
    }

    // Diagnóstico del problema
    console.log("\n🔍 DIAGNÓSTICO DEL PROBLEMA:");
    console.log("============================");
    
    if (!userRole.cliente_id) {
      console.log("❌ PROBLEMA IDENTIFICADO: El usuario no tiene cliente_id asignado");
      console.log("   SOLUCIÓN: Asignar cliente_id = user_id en user_roles");
    } else if (pedidosPorUserId.length === 0 && pedidosPorClienteId.length === 0) {
      console.log("⚠️ No se encontraron pedidos para este usuario");
      console.log("   Esto puede ser normal si el usuario no ha hecho pedidos aún");
    } else if (pedidosPorUserId.length > 0 && pedidosPorClienteId.length === 0) {
      console.log("✅ Los pedidos están asociados al user_id (correcto)");
    } else if (pedidosPorUserId.length === 0 && pedidosPorClienteId.length > 0) {
      console.log("❌ PROBLEMA IDENTIFICADO: Los pedidos están asociados al cliente_id pero el filtro usa user_id");
      console.log("   SOLUCIÓN: Cambiar el filtro en Pedidos.tsx para usar cliente_id");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    console.log("💡 Detalles del error:", error.message);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - verificarSupabaseYDiagnosticar() - Verifica Supabase y ejecuta diagnóstico");
console.log("\n💡 Ejecuta: verificarSupabaseYDiagnosticar()");

