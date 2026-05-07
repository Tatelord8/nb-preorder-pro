// Script para aplicar migración y restaurar carrito de 360 Senaker
// Ejecutar en la consola del navegador después de encontrar el carrito

console.log("🔧 APLICANDO MIGRACIÓN Y RESTAURANDO CARRITO DE 360 SENAKER");

// Función para aplicar la migración usando SQL directo
window.aplicarMigracionYRestaurar = async function(cartData) {
  try {
    console.log("🚀 Iniciando proceso completo...");
    
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no disponible");
      return false;
    }
    
    const userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
    
    // 1. Verificar estructura actual
    console.log("🔍 1. Verificando estructura de la tabla...");
    
    const { data: sampleData, error: sampleError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log("❌ Error accediendo a la tabla:", sampleError);
      console.log("⚠️ La tabla puede no existir o tener problemas de permisos");
      return false;
    }
    
    // Verificar si tiene los campos necesarios
    const hasRequiredFields = sampleData && sampleData.length > 0 && 
      'user_id' in sampleData[0] && 
      'items' in sampleData[0];
    
    if (!hasRequiredFields) {
      console.log("⚠️ Estructura incorrecta - Campos faltantes detectados");
      console.log("📋 Campos disponibles:", sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : 'Tabla vacía');
      
      console.log("\n🔧 SOLUCIÓN REQUERIDA:");
      console.log("   1. Ir a Supabase Dashboard > SQL Editor");
      console.log("   2. Ejecutar la migración SQL:");
      console.log(`
-- Migración para carritos_pendientes
ALTER TABLE carritos_pendientes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS total_items INTEGER,
ADD COLUMN IF NOT EXISTS total_unidades INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_user_id ON carritos_pendientes(user_id);
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_expires_at ON carritos_pendientes(expires_at);
      `);
      console.log("   3. Después ejecutar: restaurarCarritoDirecto(cartData)");
      
      return false;
    }
    
    console.log("✅ Estructura correcta - Procediendo con restauración");
    
    // 2. Restaurar carrito
    console.log("💾 2. Restaurando carrito...");
    
    if (!cartData || !Array.isArray(cartData)) {
      console.log("❌ Datos de carrito inválidos");
      return false;
    }
    
    const totalItems = cartData.length;
    const totalUnidades = cartData.reduce((total, item) => {
      return total + Object.values(item.talles || {}).reduce((sum, cantidad) => sum + cantidad, 0);
    }, 0);
    
    const cartRecord = {
      user_id: userId,
      cliente_id: userId,
      items: cartData,
      total_items: totalItems,
      total_unidades: totalUnidades,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log("📦 Datos a insertar:", cartRecord);
    
    const { data: insertData, error: insertError } = await window.supabase
      .from('carritos_pendientes')
      .upsert(cartRecord)
      .select();
    
    if (insertError) {
      console.log("❌ Error insertando carrito:", insertError);
      return false;
    }
    
    console.log("✅ Carrito restaurado exitosamente:", insertData);
    
    // 3. Verificar restauración
    console.log("🔍 3. Verificando restauración...");
    
    const { data: verifyData, error: verifyError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      console.log("❌ Error verificando carrito:", verifyError);
      return false;
    }
    
    console.log("✅ Carrito verificado:", verifyData);
    console.log("🎉 PROCESO COMPLETADO EXITOSAMENTE");
    
    return true;
    
  } catch (error) {
    console.error("❌ Error en proceso:", error);
    return false;
  }
};

// Función para restaurar directamente (asumiendo que la migración ya está aplicada)
window.restaurarCarritoDirecto = async function(cartData) {
  try {
    console.log("💾 Restaurando carrito directamente...");
    
    const userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
    
    if (!cartData || !Array.isArray(cartData)) {
      console.log("❌ Datos de carrito inválidos");
      return false;
    }
    
    const totalItems = cartData.length;
    const totalUnidades = cartData.reduce((total, item) => {
      return total + Object.values(item.talles || {}).reduce((sum, cantidad) => sum + cantidad, 0);
    }, 0);
    
    const cartRecord = {
      user_id: userId,
      cliente_id: userId,
      items: cartData,
      total_items: totalItems,
      total_unidades: totalUnidades,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log("📦 Insertando carrito:", cartRecord);
    
    const { data, error } = await window.supabase
      .from('carritos_pendientes')
      .upsert(cartRecord)
      .select();
    
    if (error) {
      console.log("❌ Error:", error);
      return false;
    }
    
    console.log("✅ Carrito restaurado:", data);
    return true;
    
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
};

// Función para probar el carrito restaurado
window.probarCarritoRestaurado = async function() {
  try {
    console.log("🧪 Probando carrito restaurado...");
    
    const userId = '67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40';
    
    const { data, error } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.log("❌ Error obteniendo carrito:", error);
      return false;
    }
    
    console.log("✅ Carrito obtenido:", data);
    console.log(`📦 Items: ${data.items?.length || 0}`);
    console.log(`💰 Total unidades: ${data.total_unidades || 0}`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
};

console.log("📋 Funciones disponibles:");
console.log("  - aplicarMigracionYRestaurar(cartData)");
console.log("  - restaurarCarritoDirecto(cartData)");
console.log("  - probarCarritoRestaurado()");
console.log("\n🚀 Pasos recomendados:");
console.log("   1. Primero ejecutar el script de búsqueda para obtener cartData");
console.log("   2. Luego ejecutar: aplicarMigracionYRestaurar(cartData)");
console.log("   3. Finalmente: probarCarritoRestaurado()");


