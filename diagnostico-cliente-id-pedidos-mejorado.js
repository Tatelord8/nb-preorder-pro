// Script de diagnóstico mejorado para cliente_id en pedidos
console.log("🔍 DIAGNÓSTICO CLIENTE_ID EN PEDIDOS - VERSIÓN MEJORADA");
console.log("======================================================");

window.diagnosticarClienteIdPedidosMejorado = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de cliente_id en pedidos...");

    // Verificar si Supabase está disponible
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no está disponible en window.supabase");
      console.log("🔍 Intentando acceder a Supabase desde otros lugares...");
      
      // Intentar acceder desde diferentes ubicaciones
      if (window.__SUPABASE_CLIENT__) {
        console.log("✅ Encontrado Supabase en window.__SUPABASE_CLIENT__");
        window.supabase = window.__SUPABASE_CLIENT__;
      } else if (window.supabaseClient) {
        console.log("✅ Encontrado Supabase en window.supabaseClient");
        window.supabase = window.supabaseClient;
      } else {
        console.log("❌ No se pudo encontrar Supabase en ninguna ubicación");
        console.log("💡 Intenta refrescar la página y ejecutar el script nuevamente");
        return;
      }
    }

    console.log("✅ Supabase disponible:", !!window.supabase);

    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.log("❌ No hay sesión activa. Por favor, inicia sesión.");
      return;
    }
    const userId = session.user.id;
    console.log("✅ Sesión activa. User ID:", userId);

    // 1. Verificar información del usuario en user_roles
    console.log("\n🔍 Verificando información del usuario en user_roles...");
    const { data: userRole, error: roleError } = await window.supabase
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
    console.log(`   - role: ${userRole.role}`);
    console.log(`   - cliente_id: ${userRole.cliente_id}`);
    console.log(`   - nombre: ${userRole.nombre}`);

    // 2. Verificar si existe cliente_id en la tabla clientes
    if (userRole.cliente_id) {
      console.log("\n🔍 Verificando información del cliente...");
      const { data: clienteData, error: clienteError } = await window.supabase
        .from("clientes")
        .select("id, nombre, tier, vendedor_id")
        .eq("id", userRole.cliente_id)
        .single();

      if (clienteError) {
        console.log("❌ Error obteniendo cliente:", clienteError);
      } else {
        console.log("✅ Información del cliente:", clienteData);
      }
    } else {
      console.log("⚠️ El usuario no tiene cliente_id asignado en user_roles");
    }

    // 3. Verificar pedidos existentes para este usuario
    console.log("\n🔍 Verificando pedidos existentes...");
    
    // Buscar por user_id (como se está haciendo actualmente)
    const { data: pedidosPorUserId, error: pedidosUserIdError } = await window.supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .eq("cliente_id", userId)
      .in("estado", ["autorizado", "completado"]);

    if (pedidosUserIdError) {
      console.log("❌ Error obteniendo pedidos por user_id:", pedidosUserIdError);
    } else {
      console.log(`✅ Pedidos encontrados por user_id (${userId}): ${pedidosPorUserId.length}`);
      if (pedidosPorUserId.length > 0) {
        console.log("   Primer pedido:", pedidosPorUserId[0]);
      }
    }

    // Buscar por cliente_id (si existe)
    if (userRole.cliente_id) {
      const { data: pedidosPorClienteId, error: pedidosClienteIdError } = await window.supabase
        .from("pedidos")
        .select("id, cliente_id, estado, total_usd, created_at")
        .eq("cliente_id", userRole.cliente_id)
        .in("estado", ["autorizado", "completado"]);

      if (pedidosClienteIdError) {
        console.log("❌ Error obteniendo pedidos por cliente_id:", pedidosClienteIdError);
      } else {
        console.log(`✅ Pedidos encontrados por cliente_id (${userRole.cliente_id}): ${pedidosPorClienteId.length}`);
        if (pedidosPorClienteId.length > 0) {
          console.log("   Primer pedido:", pedidosPorClienteId[0]);
        }
      }
    }

    // 4. Verificar todos los pedidos para ver qué cliente_id tienen
    console.log("\n🔍 Verificando todos los pedidos autorizados/completados...");
    const { data: todosPedidos, error: todosPedidosError } = await window.supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (todosPedidosError) {
      console.log("❌ Error obteniendo todos los pedidos:", todosPedidosError);
    } else {
      console.log(`✅ Total de pedidos autorizados/completados: ${todosPedidos.length}`);
      console.log("   Primeros 5 pedidos:");
      todosPedidos.slice(0, 5).forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id}, cliente_id: ${pedido.cliente_id}, estado: ${pedido.estado}`);
      });
    }

    // 5. Diagnóstico del problema
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

    console.log("\n--- Diagnóstico de Cliente_ID en Pedidos Completado ---");

  } catch (error) {
    console.error("❌ Error inesperado durante el diagnóstico:", error);
    console.log("💡 Detalles del error:", error.message);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarClienteIdPedidosMejorado() - Diagnostica el problema de cliente_id en pedidos");
console.log("\n💡 Ejecuta: diagnosticarClienteIdPedidosMejorado()");






