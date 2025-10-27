// Script para probar el flujo completo del indicador visual
console.log("🔍 PRUEBA FLUJO COMPLETO DEL INDICADOR VISUAL");
console.log("=============================================");

window.probarFlujoCompletoIndicador = async () => {
  try {
    console.log("🔍 Probando el flujo completo del indicador visual...");
    
    // Verificar si Supabase está disponible
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no está disponible");
      return;
    }
    
    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Error obteniendo sesión:", sessionError);
      return;
    }
    
    if (!session) {
      console.log("❌ No hay sesión activa");
      return;
    }
    
    console.log("✅ Sesión activa encontrada");
    console.log("📧 Email:", session.user.email);
    console.log("🆔 User ID:", session.user.id);
    
    // Verificar CartStorageService
    console.log("\n🔍 Verificando CartStorageService...");
    
    if (typeof window.CartStorageService === 'undefined') {
      console.log("❌ CartStorageService no está disponible globalmente");
      return;
    }
    
    console.log("✅ CartStorageService está disponible");
    
    // Limpiar carrito antes de la prueba
    console.log("\n🧹 Limpiando carrito antes de la prueba...");
    window.CartStorageService.clearItems(session.user.id);
    
    // Verificar que el carrito está vacío
    let cartItems = window.CartStorageService.getItems(session.user.id);
    console.log("📦 Carrito después de limpiar:", cartItems.length);
    
    // Obtener algunos productos para probar
    console.log("\n🔍 Obteniendo productos para la prueba...");
    
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
      console.log(`   ${index + 1}. ${producto.sku} - ${producto.nombre} (ID: ${producto.id})`);
    });
    
    // Simular la función isProductInCart
    const simulateIsProductInCart = (productId) => {
      return cartItems.some(item => item.productoId === productId);
    };
    
    // Probar 1: Verificar que ningún producto está en el carrito
    console.log("\n🔍 PRUEBA 1: Verificar que ningún producto está en el carrito");
    productos.forEach(producto => {
      const isInCart = simulateIsProductInCart(producto.id);
      console.log(`   - ${producto.sku}: ${isInCart ? "❌ En carrito" : "✅ No en carrito"}`);
    });
    
    // Probar 2: Agregar un producto al carrito
    console.log("\n🔍 PRUEBA 2: Agregar un producto al carrito");
    
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
    cartItems = window.CartStorageService.getItems(session.user.id);
    console.log("📦 Items en el carrito después de agregar:", cartItems.length);
    
    // Probar 3: Verificar que el producto agregado está en el carrito
    console.log("\n🔍 PRUEBA 3: Verificar que el producto agregado está en el carrito");
    productos.forEach(producto => {
      const isInCart = simulateIsProductInCart(producto.id);
      console.log(`   - ${producto.sku}: ${isInCart ? "✅ En carrito" : "❌ No en carrito"}`);
    });
    
    // Probar 4: Agregar otro producto
    console.log("\n🔍 PRUEBA 4: Agregar otro producto");
    
    const productoPrueba2 = productos[1];
    const testItem2 = {
      productoId: productoPrueba2.id,
      curvaId: "predefined-2",
      cantidadCurvas: 2,
      talles: { "M": 1, "L": 2, "XL": 1 },
      type: "predefined",
      genero: "F",
      opcion: 2,
      precio_usd: 75
    };
    
    console.log(`📝 Agregando ${productoPrueba2.sku} al carrito...`);
    window.CartStorageService.addItem(session.user.id, testItem2);
    
    // Verificar que se agregó
    cartItems = window.CartStorageService.getItems(session.user.id);
    console.log("📦 Items en el carrito después de agregar el segundo:", cartItems.length);
    
    // Probar 5: Verificar que ambos productos están en el carrito
    console.log("\n🔍 PRUEBA 5: Verificar que ambos productos están en el carrito");
    productos.forEach(producto => {
      const isInCart = simulateIsProductInCart(producto.id);
      console.log(`   - ${producto.sku}: ${isInCart ? "✅ En carrito" : "❌ No en carrito"}`);
    });
    
    // Probar 6: Disparar evento de actualización
    console.log("\n🔍 PRUEBA 6: Disparar evento de actualización");
    console.log("📡 Disparando evento cartUpdated...");
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    console.log("✅ Evento cartUpdated disparado");
    
    // Probar 7: Verificar localStorage
    console.log("\n🔍 PRUEBA 7: Verificar localStorage");
    
    const cartKey = `cartItems_${session.user.id}`;
    const savedCartItems = localStorage.getItem(cartKey);
    
    if (savedCartItems) {
      const items = JSON.parse(savedCartItems);
      console.log("📦 Items en localStorage:", items.length);
      console.log("📋 Clave usada:", cartKey);
      
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. Producto ID: ${item.productoId}`);
        console.log(`      - Tipo: ${item.type}`);
        console.log(`      - Cantidad de curvas: ${item.cantidadCurvas}`);
      });
    } else {
      console.log("❌ No hay items en localStorage");
    }
    
    // Probar 8: Simular navegación al catálogo
    console.log("\n🔍 PRUEBA 8: Simular navegación al catálogo");
    console.log("💡 Ahora ve al catálogo y verifica que los productos tengan el indicador visual");
    console.log("💡 Los siguientes productos deberían tener check verde:");
    console.log(`   - ${productoPrueba.sku} (${productoPrueba.nombre})`);
    console.log(`   - ${productoPrueba2.sku} (${productoPrueba2.nombre})`);
    
    // Probar 9: Remover un producto
    console.log("\n🔍 PRUEBA 9: Remover un producto del carrito");
    
    console.log(`📝 Removiendo ${productoPrueba.sku} del carrito...`);
    window.CartStorageService.removeItem(session.user.id, productoPrueba.id);
    
    // Verificar que se removió
    cartItems = window.CartStorageService.getItems(session.user.id);
    console.log("📦 Items en el carrito después de remover:", cartItems.length);
    
    // Verificar estado final
    console.log("\n🔍 PRUEBA 10: Verificar estado final");
    productos.forEach(producto => {
      const isInCart = simulateIsProductInCart(producto.id);
      console.log(`   - ${producto.sku}: ${isInCart ? "✅ En carrito" : "❌ No en carrito"}`);
    });
    
    // Disparar evento final
    console.log("\n📡 Disparando evento cartUpdated final...");
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    console.log("✅ Evento cartUpdated final disparado");
    
    console.log("\n✅ PRUEBA DEL FLUJO COMPLETO COMPLETADA");
    console.log("💡 Revisa la consola para ver los logs de isProductInCart");
    console.log("💡 Ve al catálogo y verifica que solo el segundo producto tenga check verde");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarFlujoCompletoIndicador() - Prueba el flujo completo del indicador visual");
console.log("\n💡 Ejecuta: probarFlujoCompletoIndicador()");

