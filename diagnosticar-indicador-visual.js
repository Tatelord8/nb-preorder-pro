// Script para diagnosticar el indicador visual de productos seleccionados
console.log("🔍 DIAGNÓSTICO INDICADOR VISUAL DE PRODUCTOS SELECCIONADOS");
console.log("========================================================");

window.diagnosticarIndicadorVisual = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico del indicador visual...");
    
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
      console.log("💡 Intentando acceder desde el módulo...");
      
      try {
        const module = await import('/src/services/cart-storage.service.ts');
        window.CartStorageService = module.CartStorageService;
        console.log("✅ CartStorageService importado exitosamente");
      } catch (err) {
        console.log("❌ Error importando CartStorageService:", err.message);
        return;
      }
    } else {
      console.log("✅ CartStorageService está disponible");
    }
    
    // Verificar métodos del CartStorageService
    console.log("\n🔍 Verificando métodos de CartStorageService...");
    
    const methods = ['getItems', 'addItem', 'removeItem', 'clearItems'];
    methods.forEach(method => {
      if (typeof window.CartStorageService[method] === 'function') {
        console.log(`✅ Método ${method} está disponible`);
      } else {
        console.log(`❌ Método ${method} NO está disponible`);
      }
    });
    
    // Obtener items del carrito actual
    console.log("\n🔍 Obteniendo items del carrito actual...");
    
    try {
      const cartItems = window.CartStorageService.getItems(session.user.id);
      console.log("📦 Items en el carrito:", cartItems.length);
      
      if (cartItems.length > 0) {
        console.log("📋 Detalles de los items:");
        cartItems.forEach((item, index) => {
          console.log(`   ${index + 1}. Producto ID: ${item.productoId}`);
          console.log(`      - Tipo: ${item.type}`);
          console.log(`      - Cantidad de curvas: ${item.cantidadCurvas}`);
          console.log(`      - Talles:`, item.talles);
        });
      } else {
        console.log("📦 El carrito está vacío");
      }
    } catch (err) {
      console.log("❌ Error obteniendo items del carrito:", err.message);
    }
    
    // Verificar localStorage directamente
    console.log("\n🔍 Verificando localStorage directamente...");
    
    const cartKey = `cartItems_${session.user.id}`;
    const savedCartItems = localStorage.getItem(cartKey);
    
    if (savedCartItems) {
      try {
        const items = JSON.parse(savedCartItems);
        console.log("📦 Items en localStorage:", items.length);
        console.log("📋 Clave usada:", cartKey);
        
        if (items.length > 0) {
          console.log("📋 Detalles de los items en localStorage:");
          items.forEach((item, index) => {
            console.log(`   ${index + 1}. Producto ID: ${item.productoId}`);
            console.log(`      - Tipo: ${item.type}`);
            console.log(`      - Cantidad de curvas: ${item.cantidadCurvas}`);
          });
        }
      } catch (err) {
        console.log("❌ Error parseando items del localStorage:", err.message);
      }
    } else {
      console.log("📦 No hay items en localStorage para la clave:", cartKey);
    }
    
    // Verificar todas las claves de carrito en localStorage
    console.log("\n🔍 Verificando todas las claves de carrito en localStorage...");
    
    const cartKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cartItems_")) {
        cartKeys.push(key);
      }
    }
    
    console.log("📋 Claves de carrito encontradas:", cartKeys);
    
    cartKeys.forEach(key => {
      const items = localStorage.getItem(key);
      if (items) {
        try {
          const parsedItems = JSON.parse(items);
          console.log(`   - ${key}: ${parsedItems.length} items`);
        } catch (err) {
          console.log(`   - ${key}: Error parseando`);
        }
      }
    });
    
    // Simular agregar un producto al carrito para probar
    console.log("\n🔍 Simulando agregar un producto al carrito...");
    
    try {
      // Obtener un producto de prueba
      const { data: productos, error: productosError } = await window.supabase
        .from("productos")
        .select("id, sku, nombre")
        .limit(1);
      
      if (productosError) {
        console.log("❌ Error obteniendo productos:", productosError.message);
      } else if (productos && productos.length > 0) {
        const productoPrueba = productos[0];
        console.log("📦 Producto de prueba:", productoPrueba.sku, "-", productoPrueba.nombre);
        
        // Crear un item de prueba
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
        
        // Agregar al carrito
        console.log("📝 Agregando producto al carrito...");
        window.CartStorageService.addItem(session.user.id, testItem);
        console.log("✅ Producto agregado al carrito");
        
        // Verificar que se agregó
        const updatedItems = window.CartStorageService.getItems(session.user.id);
        console.log("📦 Items después de agregar:", updatedItems.length);
        
        // Verificar si el producto está en el carrito
        const isInCart = updatedItems.some(item => item.productoId === productoPrueba.id);
        console.log("✅ Producto está en el carrito:", isInCart);
        
        // Verificar localStorage después de agregar
        const updatedSavedItems = localStorage.getItem(cartKey);
        if (updatedSavedItems) {
          const parsedUpdatedItems = JSON.parse(updatedSavedItems);
          console.log("📦 Items en localStorage después de agregar:", parsedUpdatedItems.length);
        }
        
        // Disparar evento de actualización
        console.log("📡 Disparando evento cartUpdated...");
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        console.log("✅ Evento cartUpdated disparado");
        
        // Simular la función isProductInCart
        console.log("\n🔍 Simulando función isProductInCart...");
        
        const simulateIsProductInCart = (productId) => {
          return updatedItems.some(item => item.productoId === productId);
        };
        
        const testResult = simulateIsProductInCart(productoPrueba.id);
        console.log(`✅ isProductInCart(${productoPrueba.id}):`, testResult);
        
        // Limpiar el carrito de prueba después de 5 segundos
        setTimeout(() => {
          window.CartStorageService.removeItem(session.user.id, productoPrueba.id);
          console.log("🧹 Producto de prueba removido del carrito");
        }, 5000);
        
      }
    } catch (err) {
      console.log("❌ Error en simulación:", err.message);
    }
    
    // Verificar si hay errores en la consola
    console.log("\n🔍 Verificando errores en la consola...");
    
    // Interceptar errores de JavaScript
    const originalError = console.error;
    console.error = function(...args) {
      console.log("🚨 ERROR INTERCEPTADO:", ...args);
      originalError.apply(console, args);
    };
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    console.log("💡 Revisa los logs para identificar el problema");
    console.log("💡 Si hay items en el carrito pero no se muestran los indicadores, puede ser un problema de renderizado");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarIndicadorVisual() - Diagnostica el indicador visual de productos seleccionados");
console.log("\n💡 Ejecuta: diagnosticarIndicadorVisual()");
