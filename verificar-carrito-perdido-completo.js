// Script para verificar todas las posibilidades del carrito perdido
// Ejecutar en la consola del navegador

console.log("🔍 VERIFICANDO TODAS LAS POSIBILIDADES DEL CARRITO PERDIDO");
console.log("User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40");

// 1. Verificar Local Storage completo
console.log("\n1️⃣ VERIFICANDO LOCAL STORAGE COMPLETO:");
var allKeys = Object.keys(localStorage);
console.log("📋 Total de claves en Local Storage: " + allKeys.length);

// Mostrar todas las claves
for (var i = 0; i < allKeys.length; i++) {
  console.log("   " + (i + 1) + ". " + allKeys[i]);
}

// Buscar cualquier clave que contenga "cart", "carrito", "360", "senaker"
console.log("\n🔍 Buscando claves relacionadas con carrito:");
var relatedKeys = [];
for (var j = 0; j < allKeys.length; j++) {
  var key = allKeys[j].toLowerCase();
  if (key.indexOf('cart') !== -1 || 
      key.indexOf('carrito') !== -1 || 
      key.indexOf('360') !== -1 || 
      key.indexOf('senaker') !== -1) {
    relatedKeys.push(allKeys[j]);
    console.log("   ✅ Encontrada: " + allKeys[j]);
  }
}

if (relatedKeys.length === 0) {
  console.log("   ❌ No se encontraron claves relacionadas");
}

// 2. Verificar Session Storage
console.log("\n2️⃣ VERIFICANDO SESSION STORAGE:");
var sessionKeys = Object.keys(sessionStorage);
console.log("📋 Total de claves en Session Storage: " + sessionKeys.length);

if (sessionKeys.length > 0) {
  for (var k = 0; k < sessionKeys.length; k++) {
    console.log("   " + (k + 1) + ". " + sessionKeys[k]);
  }
} else {
  console.log("   ❌ Session Storage vacío");
}

// 3. Verificar cookies
console.log("\n3️⃣ VERIFICANDO COOKIES:");
var cookies = document.cookie;
if (cookies) {
  console.log("🍪 Cookies encontradas: " + cookies);
} else {
  console.log("❌ No hay cookies");
}

// 4. Verificar si hay datos en IndexedDB
console.log("\n4️⃣ VERIFICANDO INDEXEDDB:");
if ('indexedDB' in window) {
  console.log("✅ IndexedDB disponible");
  // Intentar abrir bases de datos comunes
  var dbNames = ['cart', 'carrito', 'shopping', 'preorder'];
  for (var l = 0; l < dbNames.length; l++) {
    try {
      var request = indexedDB.open(dbNames[l]);
      request.onsuccess = function() {
        console.log("   ✅ Base de datos encontrada: " + dbNames[l]);
      };
      request.onerror = function() {
        console.log("   ❌ Base de datos no encontrada: " + dbNames[l]);
      };
    } catch (e) {
      console.log("   ❌ Error verificando: " + dbNames[l]);
    }
  }
} else {
  console.log("❌ IndexedDB no disponible");
}

// 5. Verificar datos en Supabase (si está disponible)
console.log("\n5️⃣ VERIFICANDO SUPABASE:");
if (typeof window.supabase !== 'undefined') {
  console.log("✅ Supabase disponible");
  
  // Intentar obtener el carrito desde Supabase
  var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
  
  window.supabase
    .from('carritos_pendientes')
    .select('*')
    .eq('user_id', userId)
    .then(function(result) {
      if (result.data && result.data.length > 0) {
        console.log("🎉 ¡CARRITO ENCONTRADO EN SUPABASE!");
        console.log("📦 Datos:", result.data);
      } else {
        console.log("❌ No hay carrito en Supabase");
      }
    })
    .catch(function(error) {
      console.log("❌ Error consultando Supabase:", error);
    });
    
} else {
  console.log("❌ Supabase no disponible en window.supabase");
}

// 6. Verificar si hay datos en el DOM
console.log("\n6️⃣ VERIFICANDO DATOS EN EL DOM:");
var cartElements = document.querySelectorAll('[data-cart], [id*="cart"], [class*="cart"]');
console.log("🔍 Elementos relacionados con carrito: " + cartElements.length);

for (var m = 0; m < cartElements.length; m++) {
  var element = cartElements[m];
  console.log("   " + (m + 1) + ". " + element.tagName + " - " + element.id + " - " + element.className);
}

// 7. Verificar variables globales
console.log("\n7️⃣ VERIFICANDO VARIABLES GLOBALES:");
var globalVars = ['cart', 'carrito', 'shoppingCart', 'cartItems'];
for (var n = 0; n < globalVars.length; n++) {
  if (window[globalVars[n]]) {
    console.log("✅ Variable global encontrada: " + globalVars[n]);
    console.log("   Valor:", window[globalVars[n]]);
  } else {
    console.log("❌ Variable global no encontrada: " + globalVars[n]);
  }
}

console.log("\n📋 RESUMEN DE BÚSQUEDA:");
console.log("   Local Storage: " + (relatedKeys.length > 0 ? "✅ Encontrado" : "❌ No encontrado"));
console.log("   Session Storage: " + (sessionKeys.length > 0 ? "✅ Datos encontrados" : "❌ Vacío"));
console.log("   Cookies: " + (cookies ? "✅ Encontradas" : "❌ No encontradas"));
console.log("   Supabase: " + (typeof window.supabase !== 'undefined' ? "✅ Disponible" : "❌ No disponible"));

console.log("\n💡 POSIBLES CAUSAS DEL CARRITO PERDIDO:");
console.log("   1. El carrito nunca se guardó en Local Storage");
console.log("   2. Se limpió el Local Storage del navegador");
console.log("   3. El carrito se guardó en otra ubicación");
console.log("   4. El carrito se perdió durante una actualización");
console.log("   5. El carrito está en Supabase pero la estructura de la tabla es incorrecta");

console.log("\n🔧 PRÓXIMOS PASOS RECOMENDADOS:");
console.log("   1. Verificar si el carrito está en Supabase (ejecutar consulta SQL)");
console.log("   2. Revisar logs del servidor para ver si se guardó");
console.log("   3. Verificar si hay backups o respaldos");
console.log("   4. Contactar al cliente para recrear el carrito");


