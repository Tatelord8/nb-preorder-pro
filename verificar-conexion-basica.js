// Script simple para verificar conexión básica
console.log("🔍 VERIFICACIÓN BÁSICA DE CONEXIÓN");
console.log("==================================");

window.verificarConexionBasica = async () => {
  try {
    console.log("🔍 Verificando conexión a Supabase...");
    
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
    
    // Probar consulta de productos
    console.log("🔍 Probando consulta de productos...");
    const { count: productCount, error: productError } = await window.supabase
      .from("productos")
      .select("*", { count: "exact", head: true });
    
    if (productError) {
      console.log("❌ Error en productos:", productError);
    } else {
      console.log("✅ Productos accesibles");
      console.log("📦 Total productos:", productCount);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - verificarConexionBasica() - Verifica la conexión básica");
console.log("\n💡 Ejecuta: verificarConexionBasica()");
