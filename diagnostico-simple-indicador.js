// Script simple para diagnosticar el indicador visual
console.log("🔍 DIAGNÓSTICO SIMPLE DEL INDICADOR VISUAL");
console.log("==========================================");

// Función para diagnosticar el indicador visual
window.diagnosticarIndicadorSimple = async function() {
  try {
    console.log("🔍 Iniciando diagnóstico simple...");
    
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
    
    // Verificar localStorage directamente
    const cartKey = `cartItems_${session.user.id}`;
    const savedItems = localStorage.getItem(cartKey);
    
    console.log("\n🔍 Verificando localStorage:");
    console.log("📋 Clave:", cartKey);
    
    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        console.log("📦 Items encontrados:", items.length);
        
        if (items.length > 0) {
          console.log("📋 Detalles de items:");
          items.forEach((item, index) => {
            console.log(`   ${index + 1}. Producto ID: ${item.productoId}`);
            console.log(`      - Tipo: ${item.type}`);
            console.log(`      - Cantidad: ${item.cantidadCurvas}`);
          });
        }
      } catch (err) {
        console.log("❌ Error parseando items:", err.message);
      }
    } else {
      console.log("📦 No hay items en localStorage");
    }
    
    // Verificar todas las claves de carrito
    console.log("\n🔍 Todas las claves de carrito:");
    const cartKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cartItems_")) {
        cartKeys.push(key);
      }
    }
    
    console.log("📋 Claves encontradas:", cartKeys);
    
    // Simular función isProductInCart
    console.log("\n🔍 Simulando isProductInCart:");
    
    if (savedItems) {
      const items = JSON.parse(savedItems);
      
      // Obtener algunos productos para probar
      const { data: productos } = await window.supabase
        .from("productos")
        .select("id, sku, nombre")
        .limit(5);
      
      if (productos) {
        productos.forEach(producto => {
          const isInCart = items.some(item => item.productoId === producto.id);
          console.log(`   - ${producto.sku}: ${isInCart ? "✅ En carrito" : "❌ No en carrito"}`);
        });
      }
    }
    
    console.log("\n✅ Diagnóstico completado");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

// Función para agregar un producto de prueba
window.agregarProductoPrueba = async function() {
  try {
    console.log("🔍 Agregando producto de prueba...");
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.log("❌ No hay sesión");
      return;
    }
    
    // Obtener un producto
    const { data: productos } = await window.supabase
      .from("productos")
      .select("id, sku, nombre")
      .limit(1);
    
    if (!productos || productos.length === 0) {
      console.log("❌ No hay productos disponibles");
      return;
    }
    
    const producto = productos[0];
    console.log("📦 Producto seleccionado:", producto.sku);
    
    // Crear item de prueba
    const testItem = {
      productoId: producto.id,
      curvaId: "predefined-1",
      cantidadCurvas: 1,
      talles: { "S": 1, "M": 2, "L": 1 },
      type: "predefined",
      genero: "M",
      opcion: 1,
      precio_usd: 50
    };
    
    // Guardar en localStorage directamente
    const cartKey = `cartItems_${session.user.id}`;
    const existingItems = localStorage.getItem(cartKey);
    let items = [];
    
    if (existingItems) {
      items = JSON.parse(existingItems);
    }
    
    // Verificar si ya existe
    const existingIndex = items.findIndex(item => item.productoId === producto.id);
    
    if (existingIndex >= 0) {
      console.log("⚠️ Producto ya existe en el carrito, actualizando...");
      items[existingIndex] = testItem;
    } else {
      console.log("➕ Agregando nuevo producto al carrito...");
      items.push(testItem);
    }
    
    // Guardar
    localStorage.setItem(cartKey, JSON.stringify(items));
    console.log("✅ Producto agregado al carrito");
    console.log("📦 Total items:", items.length);
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    console.log("📡 Evento cartUpdated disparado");
    
    console.log("💡 Ahora ve al catálogo y verifica el indicador visual");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

// Función para limpiar el carrito
window.limpiarCarrito = function() {
  try {
    const { data: { session } } = window.supabase.auth.getSession();
    if (!session) {
      console.log("❌ No hay sesión");
      return;
    }
    
    const cartKey = `cartItems_${session.user.id}`;
    localStorage.removeItem(cartKey);
    console.log("🧹 Carrito limpiado");
    
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    console.log("📡 Evento cartUpdated disparado");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIONES DISPONIBLES:");
console.log("   - diagnosticarIndicadorSimple() - Diagnóstico simple del indicador");
console.log("   - agregarProductoPrueba() - Agrega un producto de prueba al carrito");
console.log("   - limpiarCarrito() - Limpia el carrito");
console.log("\n💡 Ejecuta: diagnosticarIndicadorSimple()");
