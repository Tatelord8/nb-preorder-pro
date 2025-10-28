// Script para probar la corrección de detalles de pedidos
console.log("🧪 PRUEBA DE CORRECCIÓN DE DETALLES DE PEDIDOS");
console.log("==============================================");

window.probarDetallesPedidos = async () => {
  try {
    console.log("🔍 Iniciando prueba de detalles de pedidos...");

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

    // Simular la consulta corregida con detalles
    console.log("\n🔍 Simulando consulta con detalles...");
    const { data: pedidosConDetalles, error: pedidosError } = await supabase
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
      .eq("cliente_id", session.user.id)
      .in("estado", ["autorizado", "completado"])
      .order("created_at", { ascending: false });

    if (pedidosError) {
      console.log("❌ Error en consulta con detalles:", pedidosError);
      return;
    }

    console.log(`✅ Pedidos con detalles encontrados: ${pedidosConDetalles.length}`);
    
    if (pedidosConDetalles.length > 0) {
      const pedido = pedidosConDetalles[0];
      console.log("\n📋 Detalles del primer pedido:");
      console.log(`   - ID: ${pedido.id}`);
      console.log(`   - Estado: ${pedido.estado}`);
      console.log(`   - Total: $${pedido.total_usd}`);
      console.log(`   - Cliente: ${pedido.clientes?.nombre || 'N/A'}`);
      console.log(`   - Vendedor: ${pedido.vendedores?.nombre || 'Sin vendedor asignado'}`);
      
      if (pedido.items_pedido && pedido.items_pedido.length > 0) {
        console.log(`   - Items: ${pedido.items_pedido.length} productos`);
        
        // Calcular estadísticas por rubro
        const calzados = { skus: new Set(), cantidadTotal: 0 };
        const prendas = { skus: new Set(), cantidadTotal: 0 };
        
        pedido.items_pedido.forEach((item) => {
          const producto = item.productos;
          if (producto) {
            if (producto.rubro.toLowerCase() === 'calzados') {
              calzados.skus.add(producto.sku);
              calzados.cantidadTotal += item.cantidad;
            } else if (producto.rubro.toLowerCase() === 'prendas') {
              prendas.skus.add(producto.sku);
              prendas.cantidadTotal += item.cantidad;
            }
          }
        });
        
        console.log(`   - Calzados: ${calzados.skus.size} SKUs (${calzados.cantidadTotal} unidades)`);
        console.log(`   - Prendas: ${prendas.skus.size} SKUs (${prendas.cantidadTotal} unidades)`);
        
        console.log("\n📋 Detalles de productos:");
        pedido.items_pedido.forEach((item, index) => {
          const producto = item.productos;
          console.log(`   ${index + 1}. ${producto?.sku} - ${producto?.nombre} (${producto?.rubro}) - Cantidad: ${item.cantidad}`);
        });
      } else {
        console.log("   - Items: No se encontraron items del pedido");
      }
    }

    console.log("\n🎯 RESULTADO ESPERADO:");
    console.log("=====================");
    console.log("1. Los pedidos ahora deberían mostrar los SKUs por rubro");
    console.log("2. Deberían mostrar las cantidades correctas");
    console.log("3. Deberían mostrar el vendedor asignado (si existe)");

    if (pedidosConDetalles.length > 0 && pedidosConDetalles[0].items_pedido?.length > 0) {
      console.log("\n🎉 ¡CORRECCIÓN EXITOSA! Los detalles del pedido deberían aparecer correctamente.");
    } else {
      console.log("\n⚠️ Verificar que los datos estén correctos en la base de datos.");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarDetallesPedidos() - Prueba la corrección de detalles de pedidos");
console.log("\n💡 Ejecuta: probarDetallesPedidos()");







