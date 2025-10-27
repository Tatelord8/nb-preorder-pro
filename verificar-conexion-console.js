// Script simple para verificar conexión básica
console.log("🔍 VERIFICACIÓN BÁSICA DE CONEXIÓN");
console.log("==================================");

window.verificarConexion = async () => {
  try {
    console.log("🔍 Verificando conexión a Supabase...");
    
    // Verificar variables de entorno
    console.log("🔍 Variables de entorno:");
    console.log("   - VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("   - VITE_SUPABASE_PUBLISHABLE_KEY:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✅ Presente" : "❌ Ausente");
    
    // Verificar si Supabase está disponible
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no está disponible");
      console.log("💡 Asegúrate de que la aplicación esté cargada");
      return;
    }
    
    console.log("✅ Supabase está disponible");
    
    // Probar una consulta simple
    console.log("🔍 Probando consulta simple...");
    const { data, error } = await window.supabase
      .from("user_roles")
      .select("count", { count: "exact", head: true });
    
    if (error) {
      console.log("❌ Error en consulta:", error);
    } else {
      console.log("✅ Consulta exitosa");
      console.log("📊 Total usuarios:", data);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - verificarConexion() - Verifica la conexión básica");
console.log("\n💡 Ejecuta: verificarConexion()");
