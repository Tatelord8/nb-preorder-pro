// Script SIMPLE y COMPATIBLE para buscar carrito de 360 Senaker
// Copiar y pegar directamente en la consola del navegador

console.log("🔍 BUSCANDO CARRITO DE 360 SENAKER");
console.log("User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40");

// Función simple para buscar
function buscarCarrito360Senaker() {
  var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
  var cartKey = 'cartItems_' + userId;
  
  console.log("🚀 Buscando carrito con clave: " + cartKey);
  
  // Buscar directamente
  var cartData = localStorage.getItem(cartKey);
  
  if (cartData) {
    try {
      var parsedCart = JSON.parse(cartData);
      console.log("🎉 ¡CARRITO ENCONTRADO!");
      console.log("📦 Items en el carrito: " + parsedCart.length);
      console.log("📋 Datos completos:", parsedCart);
      
      // Mostrar detalles de cada producto
      for (var i = 0; i < parsedCart.length; i++) {
        var item = parsedCart[i];
        console.log("\n" + (i + 1) + ". Producto:");
        console.log("   ID: " + item.productoId);
        console.log("   Curva: " + (item.curvaId || 'N/A'));
        console.log("   Talles: " + JSON.stringify(item.talles || {}));
        console.log("   Tipo: " + (item.type || 'N/A'));
        console.log("   Precio: $" + (item.precio_usd || 'N/A'));
        console.log("   Cantidad Curvas: " + (item.cantidadCurvas || 'N/A'));
      }
      
      // Calcular totales
      var totalUnidades = 0;
      var totalPrecio = 0;
      
      for (var j = 0; j < parsedCart.length; j++) {
        var item = parsedCart[j];
        var unidadesItem = 0;
        
        if (item.talles) {
          var talles = Object.keys(item.talles);
          for (var k = 0; k < talles.length; k++) {
            unidadesItem += item.talles[talles[k]];
          }
        }
        
        totalUnidades += unidadesItem;
        totalPrecio += (item.precio_usd || 0) * unidadesItem;
      }
      
      console.log("\n💰 RESUMEN:");
      console.log("   Total productos: " + parsedCart.length);
      console.log("   Total unidades: " + totalUnidades);
      console.log("   Precio total: $" + totalPrecio.toFixed(2));
      
      return parsedCart;
      
    } catch (e) {
      console.log("❌ Error parseando carrito: " + e.message);
      console.log("📄 Datos raw: " + cartData);
      return null;
    }
  } else {
    console.log("❌ No se encontró carrito para el usuario: " + userId);
    
    // Buscar todas las claves de carrito por si acaso
    console.log("🔍 Buscando todas las claves de carrito...");
    var allKeys = Object.keys(localStorage);
    var cartKeys = [];
    
    for (var m = 0; m < allKeys.length; m++) {
      if (allKeys[m].indexOf('cartItems_') === 0) {
        cartKeys.push(allKeys[m]);
      }
    }
    
    console.log("📋 Carritos encontrados: " + cartKeys.length);
    for (var n = 0; n < cartKeys.length; n++) {
      console.log("   - " + cartKeys[n]);
    }
    
    return null;
  }
}

// Función para exportar el carrito encontrado
function exportarCarrito360Senaker() {
  var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
  var cartKey = 'cartItems_' + userId;
  var cartData = localStorage.getItem(cartKey);
  
  if (cartData) {
    console.log("📦 Exportando carrito de 360 Senaker...");
    
    // Crear archivo de descarga
    var blob = new Blob([cartData], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'carrito_360_senaker_' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("✅ Archivo de carrito descargado");
    return JSON.parse(cartData);
  } else {
    console.log("❌ No se encontró carrito para exportar");
    return null;
  }
}

// Ejecutar búsqueda automáticamente
var carritoEncontrado = buscarCarrito360Senaker();

console.log("\n📋 Funciones disponibles:");
console.log("  - buscarCarrito360Senaker()");
console.log("  - exportarCarrito360Senaker()");

if (carritoEncontrado) {
  console.log("\n🎉 ¡CARRITO ENCONTRADO! Para exportar:");
  console.log("   exportarCarrito360Senaker()");
} else {
  console.log("\n❌ Carrito no encontrado en Local Storage");
  console.log("   Verificar que estés en el navegador correcto del cliente");
}


