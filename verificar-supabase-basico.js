// Script BÁSICO para verificar Supabase
// Copiar y pegar línea por línea en la consola

console.log("🔍 VERIFICANDO SUPABASE");

// Verificar si Supabase está disponible
if (typeof window.supabase !== 'undefined') {
  console.log("✅ Supabase disponible");
} else {
  console.log("❌ Supabase no disponible");
}

// Buscar URL de Supabase
var scripts = document.getElementsByTagName('script');
for (var i = 0; i < scripts.length; i++) {
  var content = scripts[i].innerHTML;
  if (content.indexOf('supabase') !== -1) {
    var urlMatch = content.match(/https:\/\/[a-zA-Z0-9.-]+\.supabase\.co/g);
    if (urlMatch) {
      console.log("✅ URL encontrada: " + urlMatch[0]);
    }
  }
}

// Verificar token
var token = localStorage.getItem('sb-oszmlmscckrbfnjrveet-auth-token');
if (token) {
  console.log("✅ Token encontrado");
  try {
    var data = JSON.parse(token);
    if (data.currentSession && data.currentSession.user) {
      console.log("👤 Usuario: " + data.currentSession.user.email);
      console.log("🆔 User ID: " + data.currentSession.user.id);
    }
  } catch (e) {
    console.log("❌ Error parseando token");
  }
} else {
  console.log("❌ No se encontró token");
}

console.log("\n💡 Si Supabase está disponible, ejecutar:");
console.log("window.supabase.from('carritos_pendientes').select('*').eq('user_id', '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40')");


