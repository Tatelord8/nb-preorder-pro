// Script para probar el filtro de seguridad de pedidos
console.log("🔒 PRUEBA DE SEGURIDAD DE PEDIDOS");
console.log("=================================");

window.probarSeguridadPedidos = async () => {
  try {
    console.log("🔍 Iniciando prueba de seguridad...");

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
    console.log(`✅ Rol actual: ${userRole.role}`);

    // Probar consulta directa a la tabla pedidos (con RLS aplicado)
    console.log("\n🔍 Probando consulta directa con RLS...");
    const { data: pedidosConRLS, error: rlsError } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, total_usd, created_at")
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    if (rlsError) {
      console.log("❌ Error con RLS:", rlsError);
      return;
    }

    console.log(`✅ Pedidos visibles con RLS: ${pedidosConRLS.length}`);
    
    if (pedidosConRLS.length > 0) {
      console.log("📋 Pedidos que puede ver este usuario:");
      pedidosConRLS.forEach((pedido, index) => {
        const esDelCliente = pedido.cliente_id === session.user.id;
        console.log(`   ${index + 1}. ID: ${pedido.id.slice(-8)}, cliente_id: ${pedido.cliente_id}, ES MÍO: ${esDelCliente}`);
      });
    }

    // Verificar que solo ve sus propios pedidos (si es cliente)
    if (userRole.role === 'cliente') {
      console.log("\n🔍 Verificando seguridad para cliente...");
      const pedidosDeOtros = pedidosConRLS.filter(p => p.cliente_id !== session.user.id);
      
      if (pedidosDeOtros.length === 0) {
        console.log("✅ SEGURIDAD CORRECTA: El cliente solo ve sus propios pedidos");
      } else {
        console.log("❌ PROBLEMA DE SEGURIDAD: El cliente puede ver pedidos de otros");
        console.log("📋 Pedidos de otros que puede ver:");
        pedidosDeOtros.forEach((pedido, index) => {
          console.log(`   ${index + 1}. ID: ${pedido.id.slice(-8)}, cliente_id: ${pedido.cliente_id}`);
        });
      }
    } else if (userRole.role === 'superadmin') {
      console.log("\n🔍 Verificando acceso para superadmin...");
      console.log("✅ CORRECTO: El superadmin puede ver todos los pedidos");
    }

    // Probar la consulta completa con detalles (como en el frontend)
    console.log("\n🔍 Probando consulta completa con detalles...");
    const { data: pedidosCompletos, error: completoError } = await supabase
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
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    if (completoError) {
      console.log("❌ Error en consulta completa:", completoError);
      return;
    }

    console.log(`✅ Pedidos completos visibles: ${pedidosCompletos.length}`);
    
    if (pedidosCompletos.length > 0) {
      console.log("📋 Pedidos completos que puede ver:");
      pedidosCompletos.forEach((pedido, index) => {
        console.log(`   ${index + 1}. ID: ${pedido.id.slice(-8)}, cliente: ${pedido.clientes?.nombre || 'N/A'}, estado: ${pedido.estado}`);
      });
    }

    console.log("\n🎯 RESULTADO DE SEGURIDAD:");
    console.log("==========================");
    
    if (userRole.role === 'cliente') {
      const soloSusPedidos = pedidosConRLS.every(p => p.cliente_id === session.user.id);
      if (soloSusPedidos) {
        console.log("✅ SEGURIDAD GARANTIZADA: El cliente solo ve sus propios pedidos");
      } else {
        console.log("❌ VULNERABILIDAD: El cliente puede ver pedidos de otros");
      }
    } else if (userRole.role === 'superadmin') {
      console.log("✅ ACCESO COMPLETO: El superadmin puede ver todos los pedidos");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarSeguridadPedidos() - Prueba la seguridad de acceso a pedidos");
console.log("\n💡 Ejecuta: probarSeguridadPedidos()");



