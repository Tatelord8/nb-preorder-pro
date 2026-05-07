// Script ESPECÍFICO para buscar el carrito del User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40
// Copiar y pegar directamente en la consola del navegador

console.log("🔍 BUSCANDO CARRITO ESPECÍFICO DE 360 SENAKER");
console.log("User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40");

// Función específica para este usuario
function buscarCarrito360Senaker() {
  const userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
  const cartKey = `cartItems_${userId}`;
  
  console.log(`🚀 Buscando carrito con clave: ${cartKey}`);
  
  // Buscar directamente
  const cartData = localStorage.getItem(cartKey);
  
  if (cartData) {
    try {
      const parsedCart = JSON.parse(cartData);
      console.log(`🎉 ¡CARRITO ENCONTRADO!`);
      console.log(`📦 Items en el carrito: ${parsedCart.length}`);
      console.log(`📋 Datos completos:`, parsedCart);
      
      // Mostrar detalles de cada producto
      parsedCart.forEach((item, index) => {
        console.log(`\n${index + 1}. Producto:`);
        console.log(`   ID: ${item.productoId}`);
        console.log(`   Curva: ${item.curvaId || 'N/A'}`);
        console.log(`   Talles: ${JSON.stringify(item.talles || {})}`);
        console.log(`   Tipo: ${item.type || 'N/A'}`);
        console.log(`   Precio: $${item.precio_usd || 'N/A'}`);
        console.log(`   Cantidad Curvas: ${item.cantidadCurvas || 'N/A'}`);
      });
      
      // Calcular totales
      const totalUnidades = parsedCart.reduce((total, item) => {
        return total + Object.values(item.talles || {}).reduce((sum, cantidad) => sum + cantidad, 0);
      }, 0);
      
      const totalPrecio = parsedCart.reduce((total, item) => {
        const unidadesItem = Object.values(item.talles || {}).reduce((sum, cantidad) => sum + cantidad, 0);
        return total + (item.precio_usd || 0) * unidadesItem;
      }, 0);
      
      console.log(`\n💰 RESUMEN:`);
      console.log(`   Total productos: ${parsedCart.length}`);
      console.log(`   Total unidades: ${totalUnidades}`);
      console.log(`   Precio total: $${totalPrecio.toFixed(2)}`);
      
      return parsedCart;
      
    } catch (e) {
      console.log(`❌ Error parseando carrito:`, e.message);
      console.log(`📄 Datos raw:`, cartData);
      return null;
    }
  } else {
    console.log(`❌ No se encontró carrito para el usuario: ${userId}`);
    
    // Buscar todas las claves de carrito por si acaso
    console.log(`🔍 Buscando todas las claves de carrito...`);
    const allKeys = Object.keys(localStorage);
    const cartKeys = allKeys.filter(k => k.startsWith('cartItems_'));
    
    console.log(`📋 Carritos encontrados: ${cartKeys.length}`);
    cartKeys.forEach(key => {
      console.log(`   - ${key}`);
    });
    
    return null;
  }
}

// Función para exportar el carrito encontrado
function exportarCarrito360Senaker() {
  const userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
  const cartKey = `cartItems_${userId}`;
  const cartData = localStorage.getItem(cartKey);
  
  if (cartData) {
    console.log(`📦 Exportando carrito de 360 Senaker...`);
    
    // Crear archivo de descarga
    const blob = new Blob([cartData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carrito_360_senaker_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("✅ Archivo de carrito descargado");
    return JSON.parse(cartData);
  } else {
    console.log(`❌ No se encontró carrito para exportar`);
    return null;
  }
}

// Función para restaurar carrito a Supabase (después de aplicar migración)
function restaurarCarritoASupabase(cartData) {
  const userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
  
  console.log('💾 Restaurando carrito a Supabase para usuario: ' + userId);
  
  if (!cartData || !Array.isArray(cartData)) {
    console.log("❌ Datos de carrito inválidos");
    return false;
  }
  
  // Calcular totales
  const totalItems = cartData.length;
  const totalUnidades = cartData.reduce(function(total, item) {
    return total + Object.values(item.talles || {}).reduce(function(sum, cantidad) {
      return sum + cantidad;
    }, 0);
  }, 0);
  
  const cartRecord = {
    user_id: userId,
    cliente_id: userId,
    items: cartData,
    total_items: totalItems,
    total_unidades: totalUnidades,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  console.log("📦 Datos a insertar:", cartRecord);
  
  // Nota: Esta función requiere que la migración ya esté aplicada
  console.log("⚠️ IMPORTANTE: Ejecutar esta función solo después de aplicar la migración");
  console.log("   Primero ejecutar: aplicarMigracionCarritosFrontend()");
  
  return cartRecord;
}

// Ejecutar búsqueda automáticamente
const carritoEncontrado = buscarCarrito360Senaker();

console.log("\n📋 Funciones disponibles:");
console.log("  - buscarCarrito360Senaker()");
console.log("  - exportarCarrito360Senaker()");
console.log("  - restaurarCarritoASupabase(cartData)");

if (carritoEncontrado) {
  console.log("\n🎉 ¡CARRITO ENCONTRADO! Para exportar:");
  console.log("   exportarCarrito360Senaker()");
} else {
  console.log("\n❌ Carrito no encontrado en Local Storage");
  console.log("   Verificar que estés en el navegador correcto del cliente");
}
