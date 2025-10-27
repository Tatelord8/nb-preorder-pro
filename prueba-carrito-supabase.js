// Script de prueba para el carrito de Supabase
console.log("🧪 PRUEBA DEL CARRITO DE SUPABASE");
console.log("=================================");

// Función para probar el carrito de Supabase
window.probarCarritoSupabase = async function() {
  try {
    console.log("🔍 Iniciando prueba del carrito de Supabase...");
    
    // Verificar Supabase
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no disponible");
      return;
    }
    
    // Obtener sesión
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Error de sesión:", sessionError);
      return;
    }
    
    if (!session) {
      console.log("❌ No hay sesión activa");
      return;
    }
    
    console.log("✅ Sesión activa:", session.user.email);
    console.log("🆔 User ID:", session.user.id);
    
    // 1. Verificar carrito actual
    console.log("\n🔍 Verificando carrito actual...");
    const { data: currentCart, error: cartError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (cartError && cartError.code !== 'PGRST116') {
      console.log("❌ Error obteniendo carrito:", cartError);
      return;
    }
    
    if (currentCart) {
      console.log("📦 Carrito actual encontrado:");
      console.log("   - ID:", currentCart.id);
      console.log("   - Items:", currentCart.items?.length || 0);
      console.log("   - Total items:", currentCart.total_items);
      console.log("   - Total unidades:", currentCart.total_unidades);
    } else {
      console.log("📦 No hay carrito actual");
    }
    
    // 2. Obtener un producto para probar
    console.log("\n🔍 Obteniendo producto de prueba...");
    const { data: productos, error: productosError } = await window.supabase
      .from("productos")
      .select("id, sku, nombre, precio_usd, genero")
      .limit(1);
    
    if (productosError || !productos || productos.length === 0) {
      console.log("❌ Error obteniendo productos:", productosError);
      return;
    }
    
    const productoPrueba = productos[0];
    console.log("✅ Producto de prueba:", productoPrueba.sku, "-", productoPrueba.nombre);
    
    // 3. Crear item de prueba
    const testItem = {
      productoId: productoPrueba.id,
      curvaId: "predefined-1",
      cantidadCurvas: 1,
      talles: { "S": 1, "M": 2, "L": 1 },
      type: "predefined",
      genero: productoPrueba.genero,
      opcion: 1,
      precio_usd: productoPrueba.precio_usd
    };
    
    console.log("\n🔍 Item de prueba creado:", testItem);
    
    // 4. Agregar item al carrito
    console.log("\n➕ Agregando item al carrito...");
    
    // Calcular totales
    const totalItems = (currentCart?.items?.length || 0) + 1;
    const totalUnidades = (currentCart?.total_unidades || 0) + 4; // S:1 + M:2 + L:1 = 4
    
    // Obtener cliente_id
    const { data: userRole, error: roleError } = await window.supabase
      .from('user_roles')
      .select('cliente_id')
      .eq('user_id', session.user.id)
      .single();
    
    if (roleError || !userRole?.cliente_id) {
      console.log("❌ Error obteniendo cliente_id:", roleError);
      return;
    }
    
    const cartData = {
      user_id: session.user.id,
      cliente_id: userRole.cliente_id,
      items: [...(currentCart?.items || []), testItem],
      total_items: totalItems,
      total_unidades: totalUnidades,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    if (currentCart) {
      // Actualizar carrito existente
      const { error: updateError } = await window.supabase
        .from('carritos_pendientes')
        .update(cartData)
        .eq('id', currentCart.id);
      
      if (updateError) {
        console.log("❌ Error actualizando carrito:", updateError);
        return;
      }
      console.log("✅ Carrito actualizado");
    } else {
      // Crear nuevo carrito
      const { error: insertError } = await window.supabase
        .from('carritos_pendientes')
        .insert(cartData);
      
      if (insertError) {
        console.log("❌ Error creando carrito:", insertError);
        return;
      }
      console.log("✅ Carrito creado");
    }
    
    // 5. Verificar que se agregó
    console.log("\n🔍 Verificando que el item se agregó...");
    const { data: updatedCart, error: verifyError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (verifyError) {
      console.log("❌ Error verificando carrito:", verifyError);
      return;
    }
    
    console.log("📦 Carrito actualizado:");
    console.log("   - Items:", updatedCart.items?.length || 0);
    console.log("   - Total items:", updatedCart.total_items);
    console.log("   - Total unidades:", updatedCart.total_unidades);
    
    const itemAdded = updatedCart.items?.some(item => item.productoId === productoPrueba.id);
    console.log("   - ¿Item agregado?:", itemAdded ? "✅ Sí" : "❌ No");
    
    if (itemAdded) {
      console.log("\n🎉 ¡Prueba del carrito de Supabase EXITOSA!");
      console.log("💡 El carrito ahora persiste en la base de datos");
      console.log("💡 Los datos se mantendrán entre sesiones");
    } else {
      console.log("\n❌ Prueba del carrito de Supabase FALLIDA");
    }
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

// Función para limpiar el carrito de prueba
window.limpiarCarritoSupabase = async function() {
  try {
    console.log("🧹 Limpiando carrito de Supabase...");
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.log("❌ No hay sesión");
      return;
    }
    
    const { error } = await window.supabase
      .from('carritos_pendientes')
      .delete()
      .eq('user_id', session.user.id);
    
    if (error) {
      console.log("❌ Error limpiando carrito:", error);
      return;
    }
    
    console.log("✅ Carrito limpiado");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIONES DISPONIBLES:");
console.log("   - probarCarritoSupabase() - Prueba completa del carrito de Supabase");
console.log("   - limpiarCarritoSupabase() - Limpia el carrito de Supabase");
console.log("\n💡 Ejecuta: probarCarritoSupabase()");

