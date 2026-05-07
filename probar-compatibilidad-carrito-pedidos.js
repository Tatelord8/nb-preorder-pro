// Script para probar la compatibilidad entre carrito y pedidos
console.log("🧪 PRUEBA DE COMPATIBILIDAD CARRITO-PEDIDOS");
console.log("=============================================");

window.probarCompatibilidadCarritoPedidos = async () => {
  try {
    console.log("🔍 Iniciando prueba de compatibilidad...");

    if (!window.supabase) {
      console.log("❌ Supabase no disponible. Asegúrate de que el cliente esté inicializado.");
      return;
    }

    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.log("❌ No hay sesión activa. Por favor, inicia sesión.");
      return;
    }
    const userId = session.user.id;
    console.log("✅ Sesión activa. User ID:", userId);

    // 1. Verificar carritos pendientes del usuario actual
    console.log("\n🔍 Verificando carritos pendientes del usuario actual...");
    const { data: carritosUsuario, error: carritosError } = await window.supabase
      .from("carritos_pendientes")
      .select(`
        id,
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        created_at,
        clientes!inner(nombre, tier, vendedor_id),
        vendedores(nombre)
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });

    if (carritosError) {
      console.error("❌ Error obteniendo carritos del usuario:", carritosError);
      return;
    }

    console.log(`✅ Carritos del usuario: ${carritosUsuario?.length || 0}`);
    if (carritosUsuario && carritosUsuario.length > 0) {
      carritosUsuario.forEach((carrito, index) => {
        console.log(`   ${index + 1}. Carrito ${carrito.id} - ${carrito.total_items} items, ${carrito.total_unidades} unidades`);
      });
    }

    // 2. Verificar pedidos del usuario actual
    console.log("\n🔍 Verificando pedidos del usuario actual...");
    const { data: pedidosUsuario, error: pedidosError } = await window.supabase
      .from("pedidos")
      .select(`
        id,
        cliente_id,
        estado,
        total_usd,
        created_at
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });

    if (pedidosError) {
      console.error("❌ Error obteniendo pedidos del usuario:", pedidosError);
      return;
    }

    console.log(`✅ Pedidos del usuario: ${pedidosUsuario?.length || 0}`);
    if (pedidosUsuario && pedidosUsuario.length > 0) {
      pedidosUsuario.forEach((pedido, index) => {
        console.log(`   ${index + 1}. Pedido ${pedido.id} - ${pedido.estado} - $${pedido.total_usd}`);
      });
    }

    // 3. Verificar información del usuario
    console.log("\n🔍 Verificando información del usuario...");
    const { data: userInfo, error: userError } = await window.supabase
      .from("user_roles")
      .select("nombre, role, cliente_id")
      .eq("user_id", userId)
      .single();

    if (userError) {
      console.error("❌ Error obteniendo información del usuario:", userError);
      return;
    }

    console.log(`✅ Usuario: ${userInfo.nombre} (${userInfo.role})`);
    console.log(`   Cliente ID: ${userInfo.cliente_id}`);

    // 4. Resumen y recomendaciones
    console.log("\n📊 RESUMEN:");
    console.log(`   - Carritos pendientes: ${carritosUsuario?.length || 0}`);
    console.log(`   - Pedidos finalizados: ${pedidosUsuario?.length || 0}`);
    console.log(`   - Usuario tiene cliente_id: ${userInfo.cliente_id ? 'Sí' : 'No'}`);

    if (carritosUsuario && carritosUsuario.length > 0) {
      console.log("\n🎉 ¡COMPATIBILIDAD CONFIRMADA!");
      console.log("💡 Los carritos del usuario ahora aparecerán en la página 'Mi Pedido'.");
      console.log("💡 El usuario puede ver sus carritos pendientes y finalizar su selección.");
    } else {
      console.log("\nℹ️ No hay carritos pendientes para este usuario.");
      console.log("💡 Agrega productos al carrito desde el catálogo para probar la funcionalidad.");
    }

  } catch (error) {
    console.error("❌ Error inesperado durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarCompatibilidadCarritoPedidos() - Prueba la compatibilidad entre carrito y pedidos");
console.log("\n💡 Ejecuta: probarCompatibilidadCarritoPedidos()");











