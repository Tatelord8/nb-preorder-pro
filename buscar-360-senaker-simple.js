// Script SIMPLE para buscar el carrito de 360 Senaker en Local Storage
// Copiar y pegar directamente en la consola del navegador

console.log("🔍 BUSCANDO CARRITO DE 360 SENAKER...");

// Función simple para buscar
function buscarCarrito360Senaker() {
  console.log("🚀 Buscando en Local Storage...");
  
  // Obtener todas las claves
  const keys = Object.keys(localStorage);
  console.log(`📋 Total de claves: ${keys.length}`);
  
  // Buscar claves de carrito
  const cartKeys = keys.filter(k => k.startsWith('cartItems_'));
  console.log(`🛒 Carritos encontrados: ${cartKeys.length}`);
  
  // Examinar cada carrito
  cartKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      const userId = key.replace('cartItems_', '');
      
      console.log(`\n🔍 Carrito: ${key}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Items: ${data.length}`);
      
      // Buscar referencias a 360 o Senaker
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('360') || dataStr.includes('senaker')) {
        console.log(`🎉 ¡ENCONTRADO! Este podría ser el carrito de 360 Senaker:`);
        console.log(`   Datos completos:`, data);
        
        // Mostrar detalles
        data.forEach((item, i) => {
          console.log(`   ${i+1}. Producto: ${item.productoId}`);
          console.log(`      Talles: ${JSON.stringify(item.talles)}`);
          console.log(`      Precio: $${item.precio_usd}`);
        });
      }
    } catch (e) {
      console.log(`❌ Error en ${key}:`, e.message);
    }
  });
}

// Ejecutar búsqueda
buscarCarrito360Senaker();

// Función para exportar un carrito específico
function exportarCarrito(userId) {
  const key = `cartItems_${userId}`;
  const data = localStorage.getItem(key);
  
  if (data) {
    console.log(`📦 Exportando carrito de ${userId}:`);
    console.log(JSON.stringify(JSON.parse(data), null, 2));
    
    // Crear archivo de descarga
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carrito_${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log("✅ Archivo descargado");
  } else {
    console.log(`❌ No se encontró carrito para ${userId}`);
  }
}

console.log("\n📋 Para exportar un carrito específico:");
console.log("   exportarCarrito('USER_ID_AQUI')");
console.log("\n🔍 Para buscar de nuevo:");
console.log("   buscarCarrito360Senaker()");


