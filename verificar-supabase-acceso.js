// Script para verificar acceso a Supabase desde diferentes contextos
// Ejecutar en la consola del navegador

console.log("🔍 VERIFICANDO ACCESO A SUPABASE");
console.log("User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40");

// 1. Verificar diferentes formas de acceder a Supabase
console.log("\n1️⃣ VERIFICANDO DIFERENTES CONTEXTOS DE SUPABASE:");

// Verificar window.supabase
if (typeof window.supabase !== 'undefined') {
  console.log("✅ window.supabase disponible");
} else {
  console.log("❌ window.supabase no disponible");
}

// Verificar si hay una instancia global de Supabase
if (typeof window.supabaseClient !== 'undefined') {
  console.log("✅ window.supabaseClient disponible");
} else {
  console.log("❌ window.supabaseClient no disponible");
}

// Verificar si hay una instancia en el contexto de la aplicación
if (typeof window.__SUPABASE_CLIENT__ !== 'undefined') {
  console.log("✅ window.__SUPABASE_CLIENT__ disponible");
} else {
  console.log("❌ window.__SUPABASE_CLIENT__ no disponible");
}

// 2. Verificar si podemos crear una instancia de Supabase
console.log("\n2️⃣ INTENTANDO CREAR INSTANCIA DE SUPABASE:");

// Buscar la URL y clave de Supabase en el código fuente
var scripts = document.getElementsByTagName('script');
var supabaseUrl = null;
var supabaseKey = null;

for (var i = 0; i < scripts.length; i++) {
  var scriptContent = scripts[i].innerHTML;
  if (scriptContent.indexOf('supabase') !== -1) {
    console.log("🔍 Script encontrado con contenido de Supabase");
    
    // Buscar URL
    var urlMatch = scriptContent.match(/https:\/\/[a-zA-Z0-9.-]+\.supabase\.co/g);
    if (urlMatch) {
      supabaseUrl = urlMatch[0];
      console.log("✅ URL de Supabase encontrada: " + supabaseUrl);
    }
    
    // Buscar clave
    var keyMatch = scriptContent.match(/eyJ[a-zA-Z0-9._-]+/g);
    if (keyMatch) {
      supabaseKey = keyMatch[0];
      console.log("✅ Clave de Supabase encontrada: " + supabaseKey.substring(0, 20) + "...");
    }
  }
}

// 3. Verificar si podemos acceder a la API directamente
console.log("\n3️⃣ VERIFICANDO ACCESO DIRECTO A LA API:");

if (supabaseUrl && supabaseKey) {
  console.log("🔧 Intentando crear cliente de Supabase...");
  
  try {
    // Crear cliente de Supabase
    var supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("✅ Cliente de Supabase creado exitosamente");
    
    // Intentar obtener el carrito
    var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
    
    supabaseClient
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', userId)
      .then(function(result) {
        if (result.data && result.data.length > 0) {
          console.log("🎉 ¡CARRITO ENCONTRADO EN SUPABASE!");
          console.log("📦 Datos:", result.data);
        } else {
          console.log("❌ No hay carrito en Supabase para este usuario");
        }
      })
      .catch(function(error) {
        console.log("❌ Error consultando Supabase:", error);
      });
      
  } catch (e) {
    console.log("❌ Error creando cliente de Supabase:", e.message);
  }
} else {
  console.log("❌ No se pudieron encontrar las credenciales de Supabase");
}

// 4. Verificar si hay datos en el localStorage que puedan ser del carrito
console.log("\n4️⃣ VERIFICANDO DATOS EN LOCALSTORAGE:");

var authToken = localStorage.getItem('sb-oszmlmscckrbfnjrveet-auth-token');
if (authToken) {
  console.log("✅ Token de autenticación encontrado");
  try {
    var tokenData = JSON.parse(authToken);
    console.log("📋 Datos del token:", tokenData);
    
    // Verificar si el token contiene información del usuario
    if (tokenData.currentSession && tokenData.currentSession.user) {
      var user = tokenData.currentSession.user;
      console.log("👤 Usuario del token:", user.email);
      console.log("🆔 User ID del token:", user.id);
      
      if (user.id === '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') {
        console.log("✅ Token corresponde al usuario correcto");
      } else {
        console.log("⚠️ Token corresponde a otro usuario");
      }
    }
  } catch (e) {
    console.log("❌ Error parseando token:", e.message);
  }
} else {
  console.log("❌ No se encontró token de autenticación");
}

// 5. Verificar si hay datos en el DOM que puedan ser del carrito
console.log("\n5️⃣ VERIFICANDO DATOS EN EL DOM:");

// Buscar elementos que puedan contener datos del carrito
var cartElements = document.querySelectorAll('[data-cart], [id*="cart"], [class*="cart"], [data-items], [data-products]');
console.log("🔍 Elementos relacionados con carrito: " + cartElements.length);

for (var j = 0; j < cartElements.length; j++) {
  var element = cartElements[j];
  console.log("   " + (j + 1) + ". " + element.tagName + " - " + element.id + " - " + element.className);
  
  // Verificar si el elemento tiene datos
  if (element.dataset) {
    var dataset = element.dataset;
    for (var key in dataset) {
      if (key.indexOf('cart') !== -1 || key.indexOf('item') !== -1) {
        console.log("      📋 " + key + ": " + dataset[key]);
      }
    }
  }
}

console.log("\n📋 RESUMEN:");
console.log("   Supabase disponible: " + (typeof window.supabase !== 'undefined' ? "✅" : "❌"));
console.log("   Credenciales encontradas: " + (supabaseUrl && supabaseKey ? "✅" : "❌"));
console.log("   Token de autenticación: " + (authToken ? "✅" : "❌"));
console.log("   Elementos DOM relacionados: " + cartElements.length);

console.log("\n💡 PRÓXIMOS PASOS:");
console.log("   1. Si Supabase está disponible, ejecutar consulta directa");
console.log("   2. Si no, verificar en Supabase Dashboard");
console.log("   3. Contactar al cliente para recrear el carrito");
console.log("   4. Verificar logs del servidor");


