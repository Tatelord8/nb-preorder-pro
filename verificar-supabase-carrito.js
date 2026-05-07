// Script para verificar carrito en Supabase directamente
// Ejecutar en la consola del navegador

console.log("🔍 VERIFICANDO CARRITO EN SUPABASE");
console.log("User ID: 67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40");

var userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';

// Verificar si Supabase está disponible
if (typeof window.supabase !== 'undefined') {
  console.log("✅ Supabase disponible");
  
  // Intentar obtener el carrito
  window.supabase
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
      console.log("💡 Posible causa: Estructura de tabla incorrecta");
    });
    
} else {
  console.log("❌ Supabase no disponible");
  console.log("💡 Verificar que estés en la aplicación correcta");
}

// Verificar estructura de la tabla
console.log("\n🔍 VERIFICANDO ESTRUCTURA DE LA TABLA:");
if (typeof window.supabase !== 'undefined') {
  window.supabase
    .from('carritos_pendientes')
    .select('*')
    .limit(1)
    .then(function(result) {
      if (result.data && result.data.length > 0) {
        console.log("✅ Tabla existe y tiene datos");
        console.log("📋 Campos disponibles:", Object.keys(result.data[0]));
      } else {
        console.log("ℹ️ Tabla existe pero está vacía");
      }
    })
    .catch(function(error) {
      console.log("❌ Error accediendo a la tabla:", error);
      console.log("💡 Posible causa: Tabla no existe o permisos incorrectos");
    });
}


