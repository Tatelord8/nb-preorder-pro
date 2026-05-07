// Script BÁSICO para buscar carrito de 360 Senaker
// Copiar y pegar línea por línea en la consola del navegador

console.log("🔍 BUSCANDO CARRITO DE 360 SENAKER");

var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
var cartKey = 'cartItems_' + userId;

console.log("🚀 Buscando carrito con clave: " + cartKey);

var cartData = localStorage.getItem(cartKey);

if (cartData) {
  console.log("🎉 ¡CARRITO ENCONTRADO!");
  
  try {
    var parsedCart = JSON.parse(cartData);
    console.log("📦 Items en el carrito: " + parsedCart.length);
    console.log("📋 Datos completos:");
    console.log(parsedCart);
    
    for (var i = 0; i < parsedCart.length; i++) {
      var item = parsedCart[i];
      console.log("\n" + (i + 1) + ". Producto:");
      console.log("   ID: " + item.productoId);
      console.log("   Curva: " + (item.curvaId || 'N/A'));
      console.log("   Talles: " + JSON.stringify(item.talles || {}));
      console.log("   Tipo: " + (item.type || 'N/A'));
      console.log("   Precio: $" + (item.precio_usd || 'N/A'));
    }
    
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
    
  } catch (e) {
    console.log("❌ Error parseando carrito: " + e.message);
    console.log("📄 Datos raw: " + cartData);
  }
  
} else {
  console.log("❌ No se encontró carrito para el usuario: " + userId);
  
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
}

console.log("\n📋 Para exportar el carrito (si se encontró):");
console.log("   var blob = new Blob([localStorage.getItem('cartItems_67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40')], {type: 'application/json'});");
console.log("   var url = URL.createObjectURL(blob);");
console.log("   var a = document.createElement('a');");
console.log("   a.href = url;");
console.log("   a.download = 'carrito_360_senaker.json';");
console.log("   a.click();");


