// Script para buscar el carrito perdido del Cliente 360 Senaker en Local Storage
// Ejecutar en la consola del navegador en el equipo del cliente

console.log("🔍 BUSCANDO CARRITO PERDIDO EN LOCAL STORAGE");
console.log("=============================================");

window.buscarCarritoEnLocalStorage = function() {
  try {
    console.log("🚀 Iniciando búsqueda en Local Storage...");
    
    // 1. Obtener todas las claves de Local Storage
    const allKeys = Object.keys(localStorage);
    console.log(`📋 Total de claves en Local Storage: ${allKeys.length}`);
    
    // 2. Filtrar claves relacionadas con carritos
    const cartKeys = allKeys.filter(key => 
      key.startsWith('cartItems_') || 
      key.includes('cart') || 
      key.includes('carrito') ||
      key.includes('360') ||
      key.includes('Senaker')
    );
    
    console.log(`🛒 Claves relacionadas con carritos: ${cartKeys.length}`);
    cartKeys.forEach(key => console.log(`   - ${key}`));
    
    // 3. Buscar específicamente por "cartItems_"
    const cartItemKeys = allKeys.filter(key => key.startsWith('cartItems_'));
    console.log(`\n📦 Claves cartItems_ encontradas: ${cartItemKeys.length}`);
    
    if (cartItemKeys.length === 0) {
      console.log("❌ No se encontraron carritos en Local Storage");
      return null;
    }
    
    // 4. Examinar cada carrito
    const carritosEncontrados = [];
    
    cartItemKeys.forEach(key => {
      try {
        const cartData = localStorage.getItem(key);
        if (cartData) {
          const parsedCart = JSON.parse(cartData);
          const userId = key.replace('cartItems_', '');
          
          console.log(`\n🔍 Examinando carrito: ${key}`);
          console.log(`   User ID: ${userId}`);
          console.log(`   Items: ${Array.isArray(parsedCart) ? parsedCart.length : 'Formato desconocido'}`);
          
          // Verificar si es un array (formato correcto)
          if (Array.isArray(parsedCart)) {
            console.log(`   ✅ Formato correcto - ${parsedCart.length} productos`);
            
            // Mostrar detalles de los productos
            parsedCart.forEach((item, index) => {
              console.log(`      ${index + 1}. Producto ID: ${item.productoId}`);
              console.log(`         Curva: ${item.curvaId || 'N/A'}`);
              console.log(`         Talles: ${JSON.stringify(item.talles || {})}`);
              console.log(`         Tipo: ${item.type || 'N/A'}`);
              console.log(`         Precio: $${item.precio_usd || 'N/A'}`);
            });
            
            carritosEncontrados.push({
              userId: userId,
              key: key,
              data: parsedCart,
              itemCount: parsedCart.length
            });
          } else {
            console.log(`   ⚠️ Formato inesperado:`, parsedCart);
          }
        }
      } catch (e) {
        console.log(`   ❌ Error parseando ${key}:`, e.message);
      }
    });
    
    console.log(`\n📊 RESUMEN: ${carritosEncontrados.length} carritos válidos encontrados`);
    
    // 5. Buscar específicamente por "360" o "Senaker" en los datos
    console.log("\n🎯 Buscando carritos que puedan ser de 360 Senaker...");
    
    const carritosSospechosos = carritosEncontrados.filter(cart => {
      // Buscar en los datos del carrito por referencias a 360 o Senaker
      const cartString = JSON.stringify(cart.data).toLowerCase();
      return cartString.includes('360') || cartString.includes('senaker');
    });
    
    if (carritosSospechosos.length > 0) {
      console.log(`🎉 CARRITOS SOSPECHOSOS ENCONTRADOS: ${carritosSospechosos.length}`);
      carritosSospechosos.forEach((cart, index) => {
        console.log(`\n${index + 1}. Carrito sospechoso:`);
        console.log(`   User ID: ${cart.userId}`);
        console.log(`   Items: ${cart.itemCount}`);
        console.log(`   Datos:`, cart.data);
      });
    } else {
      console.log("ℹ️ No se encontraron carritos con referencias a '360' o 'Senaker'");
    }
    
    // 6. Mostrar todos los carritos para revisión manual
    console.log("\n📋 TODOS LOS CARRITOS ENCONTRADOS:");
    carritosEncontrados.forEach((cart, index) => {
      console.log(`\n${index + 1}. Carrito:`);
      console.log(`   User ID: ${cart.userId}`);
      console.log(`   Clave: ${cart.key}`);
      console.log(`   Items: ${cart.itemCount}`);
      console.log(`   Datos completos:`, cart.data);
    });
    
    return carritosEncontrados;
    
  } catch (error) {
    console.error("❌ Error buscando en Local Storage:", error);
    return null;
  }
};

window.exportarCarrito = function(userId) {
  try {
    const cartKey = `cartItems_${userId}`;
    const cartData = localStorage.getItem(cartKey);
    
    if (!cartData) {
      console.log(`❌ No se encontró carrito para usuario: ${userId}`);
      return null;
    }
    
    const parsedCart = JSON.parse(cartData);
    console.log(`📦 Carrito exportado para usuario: ${userId}`);
    console.log("📋 Datos del carrito:");
    console.log(JSON.stringify(parsedCart, null, 2));
    
    // Crear enlace de descarga
    const dataStr = JSON.stringify(parsedCart, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `carrito_${userId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("✅ Archivo de carrito descargado");
    return parsedCart;
    
  } catch (error) {
    console.error("❌ Error exportando carrito:", error);
    return null;
  }
};

window.restaurarCarritoDesdeArchivo = function(cartData, userId) {
  try {
    console.log(`🔧 Restaurando carrito para usuario: ${userId}`);
    
    if (!cartData || !Array.isArray(cartData)) {
      console.log("❌ Datos de carrito inválidos");
      return false;
    }
    
    const cartKey = `cartItems_${userId}`;
    localStorage.setItem(cartKey, JSON.stringify(cartData));
    
    console.log("✅ Carrito restaurado en Local Storage");
    console.log("📦 Datos restaurados:", cartData);
    
    return true;
    
  } catch (error) {
    console.error("❌ Error restaurando carrito:", error);
    return false;
  }
};

window.buscarPorPatron = function(patron) {
  try {
    console.log(`🔍 Buscando carritos que contengan: "${patron}"`);
    
    const allKeys = Object.keys(localStorage);
    const cartKeys = allKeys.filter(key => key.startsWith('cartItems_'));
    
    const resultados = [];
    
    cartKeys.forEach(key => {
      try {
        const cartData = localStorage.getItem(key);
        if (cartData) {
          const cartString = cartData.toLowerCase();
          if (cartString.includes(patron.toLowerCase())) {
            const userId = key.replace('cartItems_', '');
            const parsedCart = JSON.parse(cartData);
            
            resultados.push({
              userId: userId,
              key: key,
              data: parsedCart
            });
            
            console.log(`✅ Encontrado en ${key}:`);
            console.log(`   User ID: ${userId}`);
            console.log(`   Items: ${parsedCart.length}`);
          }
        }
      } catch (e) {
        console.log(`❌ Error procesando ${key}:`, e.message);
      }
    });
    
    console.log(`\n📊 Resultados encontrados: ${resultados.length}`);
    resultados.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.key}:`);
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Datos:`, result.data);
    });
    
    return resultados;
    
  } catch (error) {
    console.error("❌ Error en búsqueda por patrón:", error);
    return [];
  }
};

console.log("📋 Funciones disponibles:");
console.log("  - buscarCarritoEnLocalStorage()");
console.log("  - exportarCarrito(userId)");
console.log("  - restaurarCarritoDesdeArchivo(cartData, userId)");
console.log("  - buscarPorPatron('360') o buscarPorPatron('Senaker')");
console.log("\n🚀 Ejecutar: buscarCarritoEnLocalStorage()");
console.log("🎯 Para buscar específicamente: buscarPorPatron('360')");


