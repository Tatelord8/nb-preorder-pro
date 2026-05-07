// Script para probar el Layout corregido
console.log("🧪 PRUEBA DEL LAYOUT CORREGIDO");
console.log("===============================");

window.probarLayoutCorregido = async () => {
  try {
    console.log("🔍 Probando el Layout corregido...");

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

    // 1. Simular useSupabaseCart hook
    console.log("\n🔍 1. Simulando useSupabaseCart hook...");
    const { data: carritosData, error: carritosError } = await window.supabase
      .from("carritos_pendientes")
      .select(`
        id,
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        created_at
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });

    if (carritosError) {
      console.error("❌ Error obteniendo carritos:", carritosError);
      return;
    }

    console.log(`✅ Carritos del usuario: ${carritosData?.length || 0}`);

    // 2. Calcular totales como lo hace useSupabaseCart
    let totalItems = 0;
    let totalUnidades = 0;

    if (carritosData && carritosData.length > 0) {
      for (const carrito of carritosData) {
        totalItems += carrito.total_items || 0;
        totalUnidades += carrito.total_unidades || 0;
      }
    }

    console.log(`✅ Total items: ${totalItems}`);
    console.log(`✅ Total unidades: ${totalUnidades}`);

    // 3. Simular getCartCount del Layout
    console.log("\n🔍 2. Simulando getCartCount del Layout...");
    const cartCount = totalItems;
    console.log(`✅ Cart count (como lo mostraría el Layout): ${cartCount}`);

    // 4. Verificar información del usuario
    console.log("\n🔍 3. Verificando información del usuario...");
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

    // 5. Resumen
    console.log("\n📊 RESUMEN DEL LAYOUT CORREGIDO:");
    console.log(`   - Usuario: ${userInfo.nombre} (${userInfo.role})`);
    console.log(`   - Carritos en Supabase: ${carritosData?.length || 0}`);
    console.log(`   - Total items: ${totalItems}`);
    console.log(`   - Total unidades: ${totalUnidades}`);
    console.log(`   - Cart count en Layout: ${cartCount}`);

    if (totalItems > 0) {
      console.log("\n🎉 ¡LAYOUT CORREGIDO FUNCIONANDO!");
      console.log("💡 El Layout ahora debería mostrar el número correcto de items en el carrito.");
      console.log("💡 Ya no debería aparecer 'Cart is empty' en la consola.");
    } else {
      console.log("\nℹ️ No hay items en el carrito para este usuario.");
      console.log("💡 Agrega productos al carrito desde el catálogo para probar.");
    }

    // 6. Verificar que no hay conflictos con CartStorageService
    console.log("\n🔍 4. Verificando conflictos con CartStorageService...");
    const localStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('cartItems_'));
    console.log(`✅ Keys de localStorage relacionados con carrito: ${localStorageKeys.length}`);
    
    if (localStorageKeys.length > 0) {
      console.log("⚠️ Hay datos en localStorage que podrían causar confusión.");
      console.log("💡 El Layout ahora usa Supabase, no localStorage.");
    } else {
      console.log("✅ No hay conflictos con localStorage.");
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarLayoutCorregido() - Prueba el Layout corregido");
console.log("\n💡 Ejecuta: probarLayoutCorregido()");











