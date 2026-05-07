// Script SIMPLE para verificar acceso a Supabase
// Copiar y pegar directamente en la consola del navegador

console.log("🔍 VERIFICANDO ACCESO A SUPABASE");
console.log("User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40");

// 1. Verificar window.supabase
console.log("\n1️⃣ VERIFICANDO window.supabase:");
if (typeof window.supabase !== 'undefined') {
  console.log("✅ window.supabase disponible");
} else {
  console.log("❌ window.supabase no disponible");
}

// 2. Buscar credenciales en scripts
console.log("\n2️⃣ BUSCANDO CREDENCIALES:");
var scripts = document.getElementsByTagName('script');
var supabaseUrl = null;
var supabaseKey = null;

for (var i = 0; i < scripts.length; i++) {
  var scriptContent = scripts[i].innerHTML;
  if (scriptContent.indexOf('supabase') !== -1) {
    console.log("🔍 Script encontrado con Supabase");
    
    // Buscar URL
    var urlMatch = scriptContent.match(/https:\/\/[a-zA-Z0-9.-]+\.supabase\.co/g);
    if (urlMatch) {
      supabaseUrl = urlMatch[0];
      console.log("✅ URL encontrada: " + supabaseUrl);
    }
    
    // Buscar clave
    var keyMatch = scriptContent.match(/eyJ[a-zA-Z0-9._-]+/g);
    if (keyMatch) {
      supabaseKey = keyMatch[0];
      console.log("✅ Clave encontrada: " + keyMatch[0].substring(0, 20) + "...");
    }
  }
}

// 3. Verificar token de autenticación
console.log("\n3️⃣ VERIFICANDO TOKEN:");
var authToken = localStorage.getItem('sb-oszmlmscckrbfnjrveet-auth-token');
if (authToken) {
  console.log("✅ Token encontrado");
  try {
    var tokenData = JSON.parse(authToken);
    if (tokenData.currentSession && tokenData.currentSession.user) {
      var user = tokenData.currentSession.user;
      console.log("👤 Usuario: " + user.email);
      console.log("🆔 User ID: " + user.id);
    }
  } catch (e) {
    console.log("❌ Error parseando token: " + e.message);
  }
} else {
  console.log("❌ No se encontró token");
}

// 4. Intentar crear cliente de Supabase
console.log("\n4️⃣ INTENTANDO CREAR CLIENTE:");
if (supabaseUrl && supabaseKey) {
  console.log("🔧 Creando cliente de Supabase...");
  
  try {
    var supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("✅ Cliente creado");
    
    // Intentar obtener carrito
    var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
    
    supabaseClient
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', userId)
      .then(function(result) {
        if (result.data && result.data.length > 0) {
          console.log("🎉 ¡CARRITO ENCONTRADO!");
          console.log("📦 Datos:", result.data);
        } else {
          console.log("❌ No hay carrito en Supabase");
        }
      })
      .catch(function(error) {
        console.log("❌ Error consultando Supabase:", error);
      });
      
  } catch (e) {
    console.log("❌ Error creando cliente: " + e.message);
  }
} else {
  console.log("❌ No se encontraron credenciales");
}

console.log("\n📋 RESUMEN:");
console.log("   Supabase disponible: " + (typeof window.supabase !== 'undefined' ? "✅" : "❌"));
console.log("   Credenciales encontradas: " + (supabaseUrl && supabaseKey ? "✅" : "❌"));
console.log("   Token de autenticación: " + (authToken ? "✅" : "❌"));

console.log("\n💡 PRÓXIMOS PASOS:");
console.log("   1. Si Supabase está disponible, ejecutar consulta directa");
console.log("   2. Si no, verificar en Supabase Dashboard");
console.log("   3. Contactar al cliente para recrear el carrito");


