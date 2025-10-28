// Script para probar el hook useCarritos actualizado
console.log("🧪 PRUEBA DEL HOOK USECARROS ACTUALIZADO");
console.log("==========================================");

window.probarHookUseCarritos = async () => {
  try {
    console.log("🔍 Iniciando prueba del hook useCarritos...");

    if (!window.supabase) {
      console.log("❌ Supabase no disponible. Asegúrate de que el cliente esté inicializado.");
      return;
    }

    // Simular la consulta del hook
    console.log("\n🔍 Ejecutando consulta de carritos pendientes...");
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
        clientes!inner(nombre, tier, vendedor_id),
        vendedores(nombre)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Error en la consulta:", error);
      return;
    }

    console.log(`✅ Consulta exitosa. Encontrados ${carritosData?.length || 0} carritos.`);

    if (carritosData && carritosData.length > 0) {
      console.log("\n📊 Carritos encontrados:");
      carritosData.forEach((carrito, index) => {
        console.log(`\n--- Carrito ${index + 1} ---`);
        console.log(`   ID: ${carrito.id}`);
        console.log(`   Cliente: ${carrito.clientes?.nombre} (Tier ${carrito.clientes?.tier})`);
        console.log(`   Vendedor: ${carrito.vendedores?.nombre || 'Sin vendedor'}`);
        console.log(`   Items: ${carrito.total_items}`);
        console.log(`   Unidades: ${carrito.total_unidades}`);
        console.log(`   Fecha: ${carrito.created_at}`);
        
        if (carrito.items && Array.isArray(carrito.items)) {
          console.log(`   Productos en el carrito:`);
          carrito.items.forEach((item, itemIndex) => {
            console.log(`     ${itemIndex + 1}. ${item.productoId} - ${item.precio_usd} USD`);
          });
        }
      });

      console.log("\n🎉 ¡El hook useCarritos debería funcionar correctamente!");
      console.log("💡 Los carritos ahora aparecerán en la página 'Mi Pedido'.");
    } else {
      console.log("ℹ️ No se encontraron carritos pendientes.");
    }

  } catch (error) {
    console.error("❌ Error inesperado durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarHookUseCarritos() - Prueba el hook useCarritos actualizado");
console.log("\n💡 Ejecuta: probarHookUseCarritos()");




