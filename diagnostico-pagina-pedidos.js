// Script de diagnóstico específico para la página de Pedidos
console.log("🔍 DIAGNÓSTICO ESPECÍFICO DE PÁGINA PEDIDOS");
console.log("==========================================");

window.diagnosticarPaginaPedidos = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de página Pedidos...");

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

    // 1. Verificar información del usuario
    console.log("\n🔍 1. Verificando información del usuario...");
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
    console.log(`✅ Cliente ID: ${userInfo.cliente_id}`);

    // 2. Simular hook useCarritos (como lo usa la página Pedidos)
    console.log("\n🔍 2. Simulando hook useCarritos...");
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

    console.log(`✅ Total carritos en sistema: ${carritosData?.length || 0}`);

    // 3. Aplicar filtro de usuario (como en la página Pedidos)
    console.log("\n🔍 3. Aplicando filtro de usuario...");
    const carritosDelUsuario = carritosData?.filter(c => c.cliente_id === userId) || [];
    console.log(`✅ Carritos del usuario actual: ${carritosDelUsuario.length}`);

    if (carritosDelUsuario.length > 0) {
      console.log("\n📋 CARRITOS DEL USUARIO:");
      carritosDelUsuario.forEach((carrito, index) => {
        console.log(`   ${index + 1}. Carrito ${carrito.id.slice(-8)}`);
        console.log(`      - Cliente: ${carrito.clientes?.nombre || 'Sin nombre'}`);
        console.log(`      - Items: ${carrito.total_items}`);
        console.log(`      - Unidades: ${carrito.total_unidades}`);
        console.log(`      - Fecha: ${carrito.created_at}`);
        
        if (carrito.items && Array.isArray(carrito.items)) {
          console.log(`      - Productos:`);
          carrito.items.forEach((item, itemIndex) => {
            console.log(`        ${itemIndex + 1}. ${item.productoId} - $${item.precio_usd}`);
          });
        }
      });
    } else {
      console.log("❌ No hay carritos para este usuario");
    }

    // 4. Simular hook usePedidos
    console.log("\n🔍 4. Simulando hook usePedidos...");
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

    const pedidosDelUsuario = pedidosData?.filter(p => p.cliente_id === userId) || [];
    console.log(`✅ Pedidos del usuario: ${pedidosDelUsuario.length}`);

    // 5. Simular renderizado de pestañas
    console.log("\n🔍 5. Simulando renderizado de pestañas...");
    
    console.log("\n📋 TAB 'MI CARRITO' (debería mostrar carritos pendientes):");
    if (carritosDelUsuario.length > 0) {
      console.log("✅ DEBERÍA MOSTRAR:");
      carritosDelUsuario.forEach((carrito, index) => {
        console.log(`   - Carrito ${carrito.id.slice(-8)} con ${carrito.total_items} items`);
      });
    } else {
      console.log("❌ NO HAY CARRITOS PARA MOSTRAR");
      console.log("💡 Mensaje esperado: 'No hay productos en tu carrito'");
    }

    console.log("\n📋 TAB 'MIS PEDIDOS' (debería mostrar pedidos finalizados):");
    if (pedidosDelUsuario.length > 0) {
      console.log("✅ DEBERÍA MOSTRAR:");
      pedidosDelUsuario.forEach((pedido, index) => {
        console.log(`   - Pedido ${pedido.id.slice(-8)} - ${pedido.estado}`);
      });
    } else {
      console.log("ℹ️ NO HAY PEDIDOS FINALIZADOS");
      console.log("💡 Mensaje esperado: 'No tienes pedidos finalizados'");
    }

    // 6. Verificar si hay problemas con el componente PedidoCard
    console.log("\n🔍 6. Verificando datos para PedidoCard...");
    if (carritosDelUsuario.length > 0) {
      const carrito = carritosDelUsuario[0];
      console.log("📊 Datos del primer carrito para PedidoCard:");
      console.log(`   - ID: ${carrito.id}`);
      console.log(`   - Cliente ID: ${carrito.cliente_id}`);
      console.log(`   - Vendedor ID: ${carrito.clientes?.vendedor_id || 'null'}`);
      console.log(`   - Total USD: ${carrito.total_items * 100} (estimado)`);
      console.log(`   - Estado: 'pending'`);
      console.log(`   - Created at: ${carrito.created_at}`);
      console.log(`   - Clientes: ${carrito.clientes ? 'Disponible' : 'No disponible'}`);
      console.log(`   - Vendedores: ${carrito.vendedores ? 'Disponible' : 'No disponible'}`);
    }

    // 7. Resumen y diagnóstico
    console.log("\n📊 RESUMEN DEL DIAGNÓSTICO:");
    console.log(`   - Usuario: ${userInfo.nombre} (${userInfo.role})`);
    console.log(`   - Cliente ID: ${userInfo.cliente_id}`);
    console.log(`   - Carritos totales: ${carritosData?.length || 0}`);
    console.log(`   - Carritos del usuario: ${carritosDelUsuario.length}`);
    console.log(`   - Pedidos del usuario: ${pedidosDelUsuario.length}`);

    if (carritosDelUsuario.length > 0) {
      console.log("\n🎉 ¡DATOS DISPONIBLES PARA MOSTRAR!");
      console.log("💡 La página Pedidos DEBERÍA mostrar los carritos pendientes.");
      console.log("💡 Si no los muestra, el problema está en el frontend (React Query o renderizado).");
      
      console.log("\n🔧 POSIBLES CAUSAS SI NO SE MUESTRAN:");
      console.log("   1. Error en React Query (useCarritos hook)");
      console.log("   2. Error en el filtro de usuario");
      console.log("   3. Error en el componente PedidoCard");
      console.log("   4. Error en el renderizado de pestañas");
      console.log("   5. Error en el procesamiento de datos");
    } else {
      console.log("\n⚠️ NO HAY CARRITOS PARA ESTE USUARIO");
      console.log("💡 Agrega productos al carrito desde el catálogo para probar.");
    }

  } catch (error) {
    console.error("❌ Error inesperado durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarPaginaPedidos() - Diagnóstico específico de página Pedidos");
console.log("\n💡 Ejecuta: diagnosticarPaginaPedidos()");











