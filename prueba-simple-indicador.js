// Script de prueba simple para el indicador visual
console.log("🔍 PRUEBA SIMPLE DEL INDICADOR VISUAL");
console.log("=====================================");

// Función para probar el indicador visual
window.probarIndicadorSimple = async function() {
  try {
    console.log("🔍 Probando indicador visual...");
    
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
    
    // Verificar CartStorageService
    console.log("\n🔍 Verificando CartStorageService...");
    
    if (typeof window.CartStorageService === 'undefined') {
      console.log("❌ CartStorageService no disponible globalmente");
      console.log("💡 Intentando importar...");
      
      try {
        const module = await import('/src/services/cart-storage.service.ts');
        window.CartStorageService = module.CartStorageService;
        console.log("✅ CartStorageService importado");
      } catch (err) {
        console.log("❌ Error importando:", err.message);
        return;
      }
    } else {
      console.log("✅ CartStorageService disponible");
    }
    
    // Verificar métodos
    console.log("\n🔍 Verificando métodos:");
    console.log("   - getCart:", typeof window.CartStorageService.getCart);
    console.log("   - addItem:", typeof window.CartStorageService.addItem);
    console.log("   - removeItem:", typeof window.CartStorageService.removeItem);
    
    // Obtener carrito actual
    console.log("\n🔍 Obteniendo carrito actual...");
    
    try {
      const cartItems = window.CartStorageService.getCart(session.user.id);
      console.log("📦 Items en el carrito:", cartItems.length);
      
      if (cartItems.length > 0) {
        console.log("📋 Detalles:");
        cartItems.forEach((item, index) => {
          console.log(`   ${index + 1}. Producto ID: ${item.productoId}`);
          console.log(`      - Tipo: ${item.type}`);
          console.log(`      - Cantidad: ${item.cantidadCurvas}`);
        });
      }
    } catch (err) {
      console.log("❌ Error obteniendo carrito:", err.message);
    }
    
    // Obtener productos para probar
    console.log("\n🔍 Obteniendo productos...");
    
    const { data: productos, error: productosError } = await window.supabase
      .from("productos")
      .select("id, sku, nombre")
      .limit(3);
    
    if (productosError) {
      console.log("❌ Error obteniendo productos:", productosError.message);
      return;
    }
    
    console.log(`✅ Productos obtenidos: ${productos.length}`);
    productos.forEach((producto, index) => {
      console.log(`   ${index + 1}. ${producto.sku} - ${producto.nombre}`);
    });
    
    // Simular función isProductInCart
    console.log("\n🔍 Simulando isProductInCart:");
    
    try {
      const cartItems = window.CartStorageService.getCart(session.user.id);
      
      productos.forEach(producto => {
        const isInCart = cartItems.some(item => item.productoId === producto.id);
        console.log(`   - ${producto.sku}: ${isInCart ? "✅ En carrito" : "❌ No en carrito"}`);
      });
    } catch (err) {
      console.log("❌ Error simulando isProductInCart:", err.message);
    }
    
    // Agregar un producto de prueba
    console.log("\n🔍 Agregando producto de prueba...");
    
    try {
      const productoPrueba = productos[0];
      const testItem = {
        productoId: productoPrueba.id,
        curvaId: "predefined-1",
        cantidadCurvas: 1,
        talles: { "S": 1, "M": 2, "L": 1 },
        type: "predefined",
        genero: "M",
        opcion: 1,
        precio_usd: 50
      };
      
      console.log(`📝 Agregando ${productoPrueba.sku} al carrito...`);
      window.CartStorageService.addItem(session.user.id, testItem);
      
      // Verificar que se agregó
      const updatedItems = window.CartStorageService.getCart(session.user.id);
      console.log("📦 Items después de agregar:", updatedItems.length);
      
      // Verificar si está en el carrito
      const isInCart = updatedItems.some(item => item.productoId === productoPrueba.id);
      console.log(`✅ ${productoPrueba.sku} está en el carrito:`, isInCart);
      
      // Disparar evento
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      console.log("📡 Evento cartUpdated disparado");
      
      console.log("\n💡 Ahora ve al catálogo y verifica que el producto tenga check verde");
      
    } catch (err) {
      console.log("❌ Error agregando producto:", err.message);
    }
    
    console.log("\n✅ Prueba completada");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarIndicadorSimple() - Prueba simple del indicador visual");
console.log("\n💡 Ejecuta: probarIndicadorSimple()");

