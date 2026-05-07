// Script de diagnóstico detallado para el problema de visualización de carritos
console.log("🔍 DIAGNÓSTICO DETALLADO DE VISUALIZACIÓN DE CARRITOS");
console.log("=====================================================");

window.diagnosticarVisualizacionCarritos = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico detallado...");

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

    // 1. Verificar información del usuario actual
    console.log("\n🔍 1. Verificando información del usuario actual...");
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

    // 2. Verificar carritos del usuario actual
    console.log("\n🔍 2. Verificando carritos del usuario actual...");
    const { data: carritosUsuario, error: carritosError } = await window.supabase
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
      console.error("❌ Error obteniendo carritos del usuario:", carritosError);
      return;
    }

    console.log(`✅ Carritos del usuario: ${carritosUsuario?.length || 0}`);
    if (carritosUsuario && carritosUsuario.length > 0) {
      carritosUsuario.forEach((carrito, index) => {
        console.log(`   ${index + 1}. Carrito ${carrito.id}`);
        console.log(`      - Items: ${carrito.total_items}`);
        console.log(`      - Unidades: ${carrito.total_unidades}`);
        console.log(`      - Fecha: ${carrito.created_at}`);
      });
    }

    // 3. Simular la consulta del hook useCarritos
    console.log("\n🔍 3. Simulando consulta del hook useCarritos...");
    const { data: carritosData, error: hookError } = await window.supabase
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

    if (hookError) {
      console.error("❌ Error en consulta del hook:", hookError);
      return;
    }

    console.log(`✅ Consulta del hook exitosa. Total carritos: ${carritosData?.length || 0}`);
    
    if (carritosData && carritosData.length > 0) {
      console.log("\n📊 Carritos encontrados por el hook:");
      carritosData.forEach((carrito, index) => {
        console.log(`   ${index + 1}. Carrito ${carrito.id}`);
        console.log(`      - Cliente: ${carrito.clientes?.nombre} (Tier ${carrito.clientes?.tier})`);
        console.log(`      - Vendedor: ${carrito.vendedores?.nombre || 'Sin vendedor'}`);
        console.log(`      - Items: ${carrito.total_items}`);
        console.log(`      - Unidades: ${carrito.total_unidades}`);
        
        // Verificar si este carrito pertenece al usuario actual
        const esDelUsuario = carrito.cliente_id === userId;
        console.log(`      - ¿Es del usuario actual?: ${esDelUsuario ? 'SÍ' : 'NO'}`);
      });
    }

    // 4. Verificar filtros en la página Pedidos
    console.log("\n🔍 4. Verificando filtros de la página Pedidos...");
    const carritosDelUsuario = carritosData?.filter(c => c.cliente_id === userId) || [];
    console.log(`✅ Carritos filtrados para el usuario actual: ${carritosDelUsuario.length}`);
    
    if (carritosDelUsuario.length > 0) {
      console.log("📋 Carritos que deberían aparecer en 'Mi Carrito':");
      carritosDelUsuario.forEach((carrito, index) => {
        console.log(`   ${index + 1}. ${carrito.clientes?.nombre} - ${carrito.total_items} items`);
      });
    }

    // 5. Verificar si hay problemas con React Query
    console.log("\n🔍 5. Verificando estado de React Query...");
    console.log("💡 Si los datos están en Supabase pero no se muestran en la UI:");
    console.log("   - Verifica que React Query esté funcionando");
    console.log("   - Revisa la consola del navegador por errores");
    console.log("   - Verifica que el hook useCarritos se esté ejecutando");

    // 6. Resumen y recomendaciones
    console.log("\n📊 RESUMEN DEL DIAGNÓSTICO:");
    console.log(`   - Usuario actual: ${userInfo.nombre} (${userInfo.role})`);
    console.log(`   - Cliente ID: ${userInfo.cliente_id}`);
    console.log(`   - Carritos directos del usuario: ${carritosUsuario?.length || 0}`);
    console.log(`   - Carritos totales en sistema: ${carritosData?.length || 0}`);
    console.log(`   - Carritos filtrados para UI: ${carritosDelUsuario.length}`);

    if (carritosDelUsuario.length > 0) {
      console.log("\n🎉 ¡DATOS DISPONIBLES!");
      console.log("💡 Los carritos están en Supabase y deberían aparecer en la UI.");
      console.log("💡 Si no aparecen, el problema está en el frontend (React Query o renderizado).");
    } else {
      console.log("\n⚠️ NO HAY CARRITOS PARA ESTE USUARIO");
      console.log("💡 El usuario no tiene carritos pendientes.");
      console.log("💡 Agrega productos al carrito desde el catálogo para probar.");
    }

  } catch (error) {
    console.error("❌ Error inesperado durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarVisualizacionCarritos() - Diagnóstico detallado de visualización");
console.log("\n💡 Ejecuta: diagnosticarVisualizacionCarritos()");











