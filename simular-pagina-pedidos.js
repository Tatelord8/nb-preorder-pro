// Script final para simular exactamente la página de Pedidos
console.log("🧪 SIMULACIÓN COMPLETA DE LA PÁGINA DE PEDIDOS");
console.log("===============================================");

window.simularPaginaPedidos = async () => {
  try {
    console.log("🔍 Simulando la página de Pedidos...");

    if (!window.supabase) {
      console.log("❌ Supabase no disponible.");
      return;
    }

    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.log("❌ No hay sesión activa. Por favor, inicia sesión.");
      return;
    }
    const userId = session.user.id;
    console.log("✅ Sesión activa. User ID:", userId);

    // 1. Simular useCarritos hook
    console.log("\n🔍 1. Simulando hook useCarritos...");
    const { data: carritosData, error: carritosError } = await window.supabase
      .from("carritos_pendientes")
      .select(`
        id,
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        created_at,
        clientes(nombre, tier, vendedor_id),
        vendedores(nombre)
      `)
      .order('created_at', { ascending: false });

    if (carritosError) {
      console.error("❌ Error en useCarritos:", carritosError);
      return;
    }

    console.log(`✅ useCarritos: ${carritosData?.length || 0} carritos encontrados`);

    // 2. Simular usePedidos hook
    console.log("\n🔍 2. Simulando hook usePedidos...");
    const { data: pedidosData, error: pedidosError } = await window.supabase
      .from("pedidos")
      .select(`
        id,
        cliente_id,
        vendedor_id,
        estado,
        total_usd,
        created_at,
        clientes(nombre, tier),
        vendedores(nombre)
      `)
      .in('estado', ['autorizado', 'completado'])
      .order('created_at', { ascending: false });

    if (pedidosError) {
      console.error("❌ Error en usePedidos:", pedidosError);
      return;
    }

    console.log(`✅ usePedidos: ${pedidosData?.length || 0} pedidos encontrados`);

    // 3. Simular filtros de usuario (como en la página)
    console.log("\n🔍 3. Aplicando filtros de usuario...");
    const carritosDelUsuario = carritosData?.filter(c => c.cliente_id === userId) || [];
    const pedidosDelUsuario = pedidosData?.filter(p => p.cliente_id === userId) || [];

    console.log(`✅ Carritos del usuario: ${carritosDelUsuario.length}`);
    console.log(`✅ Pedidos del usuario: ${pedidosDelUsuario.length}`);

    // 4. Simular renderizado de pestañas
    console.log("\n🔍 4. Simulando renderizado de pestañas...");
    
    console.log("\n📋 TAB 'MI CARRITO':");
    if (carritosDelUsuario.length > 0) {
      carritosDelUsuario.forEach((carrito, index) => {
        console.log(`   ${index + 1}. Carrito ${carrito.id.slice(-8)}`);
        console.log(`      - Cliente: ${carrito.clientes?.nombre || 'Sin nombre'}`);
        console.log(`      - Items: ${carrito.total_items}`);
        console.log(`      - Unidades: ${carrito.total_unidades}`);
        console.log(`      - Vendedor: ${carrito.vendedores?.nombre || 'Sin vendedor'}`);
      });
    } else {
      console.log("   ❌ No hay productos en tu carrito");
      console.log("   💡 Agrega productos desde el catálogo para comenzar tu pedido");
    }

    console.log("\n📋 TAB 'MIS PEDIDOS':");
    if (pedidosDelUsuario.length > 0) {
      pedidosDelUsuario.forEach((pedido, index) => {
        console.log(`   ${index + 1}. Pedido ${pedido.id.slice(-8)}`);
        console.log(`      - Estado: ${pedido.estado}`);
        console.log(`      - Total: $${pedido.total_usd}`);
        console.log(`      - Cliente: ${pedido.clientes?.nombre || 'Sin nombre'}`);
      });
    } else {
      console.log("   ❌ No tienes pedidos finalizados");
      console.log("   💡 Los pedidos aparecerán aquí una vez que sean autorizados");
    }

    // 5. Resumen final
    console.log("\n📊 RESUMEN DE LA SIMULACIÓN:");
    console.log(`   - Usuario actual: ${userId}`);
    console.log(`   - Carritos totales en sistema: ${carritosData?.length || 0}`);
    console.log(`   - Carritos del usuario: ${carritosDelUsuario.length}`);
    console.log(`   - Pedidos totales en sistema: ${pedidosData?.length || 0}`);
    console.log(`   - Pedidos del usuario: ${pedidosDelUsuario.length}`);

    if (carritosDelUsuario.length > 0) {
      console.log("\n🎉 ¡SIMULACIÓN EXITOSA!");
      console.log("💡 Los carritos del usuario deberían aparecer en la pestaña 'Mi Carrito'.");
      console.log("💡 Si no aparecen en la UI real, el problema está en React Query o en el renderizado.");
    } else {
      console.log("\n⚠️ NO HAY CARRITOS PARA ESTE USUARIO");
      console.log("💡 El usuario no tiene carritos pendientes.");
      console.log("💡 Para probar, agrega productos al carrito desde el catálogo.");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - simularPaginaPedidos() - Simula completamente la página de Pedidos");
console.log("\n💡 Ejecuta: simularPaginaPedidos()");
