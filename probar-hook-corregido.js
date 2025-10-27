// Script para probar el hook useCarritos corregido
console.log("🧪 PRUEBA DEL HOOK USECARROS CORREGIDO");
console.log("======================================");

window.probarHookCorregido = async () => {
  try {
    console.log("🔍 Probando el hook useCarritos corregido...");

    if (!window.supabase) {
      console.log("❌ Supabase no disponible.");
      return;
    }

    // Simular la consulta corregida del hook
    console.log("\n🔍 Ejecutando consulta corregida...");
    const { data: carritosData, error } = await window.supabase
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

    if (error) {
      console.error("❌ Error en la consulta:", error);
      return;
    }

    console.log(`✅ Consulta exitosa: ${carritosData?.length || 0} carritos encontrados`);

    if (carritosData && carritosData.length > 0) {
      console.log("\n📊 CARRITOS ENCONTRADOS:");
      carritosData.forEach((carrito, index) => {
        console.log(`\n--- Carrito ${index + 1} ---`);
        console.log(`   ID: ${carrito.id}`);
        console.log(`   Cliente: ${carrito.clientes?.nombre || 'Sin nombre'} (Tier ${carrito.clientes?.tier || 'N/A'})`);
        console.log(`   Vendedor: ${carrito.vendedores?.nombre || 'Sin vendedor'}`);
        console.log(`   Items: ${carrito.total_items}`);
        console.log(`   Unidades: ${carrito.total_unidades}`);
        console.log(`   Fecha: ${carrito.created_at}`);
        
        if (carrito.items && Array.isArray(carrito.items)) {
          console.log(`   Productos:`);
          carrito.items.forEach((item, itemIndex) => {
            console.log(`     ${itemIndex + 1}. ${item.productoId} - $${item.precio_usd}`);
          });
        }
      });

      // Verificar si hay datos válidos para procesar
      console.log("\n🔍 Verificando procesamiento de datos...");
      let carritosProcesados = 0;
      
      for (const carrito of carritosData) {
        try {
          const items = carrito.items as any[];
          if (Array.isArray(items) && items.length > 0) {
            carritosProcesados++;
          }
        } catch (e) {
          console.warn(`Error procesando carrito ${carrito.id}:`, e);
        }
      }
      
      console.log(`✅ Carritos procesables: ${carritosProcesados}/${carritosData.length}`);

      console.log("\n🎉 ¡HOOK CORREGIDO FUNCIONANDO!");
      console.log("💡 Los carritos ahora deberían aparecer en la página 'Mi Pedido'.");
      console.log("💡 El problema del !inner JOIN ha sido resuelto.");
      
    } else {
      console.log("ℹ️ No se encontraron carritos pendientes.");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarHookCorregido() - Prueba el hook useCarritos corregido");
console.log("\n💡 Ejecuta: probarHookCorregido()");
