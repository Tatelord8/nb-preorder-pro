// Script de prueba para ProductDetail
console.log("🧪 PRUEBA DE PRODUCTDETAIL");
console.log("========================");

// Función para probar ProductDetail
window.probarProductDetail = async function(productId = null) {
  try {
    console.log("🔍 Iniciando prueba de ProductDetail...");
    
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
    
    // Obtener un producto si no se proporciona ID
    if (!productId) {
      console.log("\n🔍 Obteniendo producto de prueba...");
      const { data: productos, error: productosError } = await window.supabase
        .from("productos")
        .select("id, sku, nombre, precio_usd, genero, rubro, tier")
        .limit(1);
      
      if (productosError || !productos || productos.length === 0) {
        console.log("❌ Error obteniendo productos:", productosError);
        return;
      }
      
      productId = productos[0].id;
      console.log("✅ Producto de prueba:", productos[0].sku, "-", productos[0].nombre);
    }
    
    // 1. Verificar que el producto existe
    console.log(`\n🔍 Verificando producto con ID: ${productId}`);
    const { data: producto, error: productoError } = await window.supabase
      .from("productos")
      .select("*")
      .eq("id", productId)
      .single();
    
    if (productoError) {
      console.log("❌ Error obteniendo producto:", productoError);
      return;
    }
    
    console.log("✅ Producto encontrado:", producto.sku, "-", producto.nombre);
    console.log("   - Tier:", producto.tier);
    console.log("   - Género:", producto.genero);
    console.log("   - Rubro:", producto.rubro);
    console.log("   - Precio:", producto.precio_usd);
    
    // 2. Verificar tier del usuario
    console.log("\n🔍 Verificando tier del usuario...");
    const { data: userRole, error: userRoleError } = await window.supabase
      .from("user_roles")
      .select("cliente_id, clientes(tier)")
      .eq("user_id", session.user.id)
      .single();
    
    if (userRoleError) {
      console.log("❌ Error obteniendo user role:", userRoleError);
      return;
    }
    
    const userTier = userRole?.clientes ? (userRole.clientes as any).tier : null;
    console.log("✅ Tier del usuario:", userTier);
    
    // 3. Verificar acceso al producto
    console.log("\n🔍 Verificando acceso al producto...");
    if (window.canUserAccessTier && window.getAccessDeniedMessage) {
      const hasAccess = window.canUserAccessTier(userTier, producto.tier || "0");
      console.log(`   - ¿Tiene acceso?: ${hasAccess}`);
      
      if (!hasAccess) {
        console.log(`   - Mensaje de denegación: ${window.getAccessDeniedMessage(userTier, producto.tier || "0")}`);
      }
    } else {
      console.log("⚠️ Funciones de tierAccess no disponibles");
    }
    
    // 4. Verificar si el producto está en el carrito
    console.log("\n🔍 Verificando si el producto está en el carrito...");
    const { data: cart, error: cartError } = await window.supabase
      .from('carritos_pendientes')
      .select('items')
      .eq('user_id', session.user.id)
      .single();
    
    if (cartError && cartError.code !== 'PGRST116') {
      console.log("❌ Error obteniendo carrito:", cartError);
      return;
    }
    
    const isInCart = cart?.items?.some(item => item.productoId === productId) || false;
    console.log(`   - ¿Está en el carrito?: ${isInCart ? "✅ Sí" : "❌ No"}`);
    
    if (cart?.items) {
      console.log(`   - Total items en carrito: ${cart.items.length}`);
    }
    
    // 5. Simular navegación a ProductDetail
    console.log("\n🔍 Simulando navegación a ProductDetail...");
    const productUrl = `/product/${productId}`;
    console.log(`   - URL del producto: ${productUrl}`);
    
    // Verificar que la URL es válida
    if (productId && typeof productId === 'string') {
      console.log("✅ URL del producto es válida");
    } else {
      console.log("❌ ID del producto no es válido");
    }
    
    console.log("\n--- Diagnóstico de ProductDetail completado ---");
    console.log("💡 Si ProductDetail sigue mostrando página en blanco:");
    console.log("   1. Verifica que el componente se esté renderizando correctamente");
    console.log("   2. Revisa la consola para errores de JavaScript");
    console.log("   3. Asegúrate de que todas las dependencias estén importadas");
    
    // Sugerir navegación manual
    console.log("\n🚀 Para probar manualmente:");
    console.log(`   - Ve a: http://localhost:8080${productUrl}`);
    console.log("   - O ejecuta: window.location.href = '" + productUrl + "'");
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

// Función para navegar a un producto específico
window.navegarAProducto = function(productId) {
  if (!productId) {
    console.log("❌ Debes proporcionar un ID de producto");
    return;
  }
  
  const url = `/product/${productId}`;
  console.log(`🚀 Navegando a: ${url}`);
  window.location.href = url;
};

console.log("\n🚀 FUNCIONES DISPONIBLES:");
console.log("   - probarProductDetail(productId) - Diagnostica ProductDetail");
console.log("   - navegarAProducto(productId) - Navega a un producto específico");
console.log("\n💡 Ejecuta: probarProductDetail()");




