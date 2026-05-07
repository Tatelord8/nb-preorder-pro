// Script para verificar y corregir la estructura de carritos_pendientes en producción
// Ejecutar en la consola del navegador en el sitio desplegado

console.log("🔧 VERIFICACIÓN Y CORRECCIÓN DE ESTRUCTURA DE BASE DE DATOS");
console.log("==========================================================");

window.verificarEstructuraCarritos = async function() {
  try {
    console.log("🚀 Iniciando verificación de estructura...");
    
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no disponible");
      return;
    }
    
    // 1. Verificar si la tabla existe y obtener su estructura
    console.log("\n📋 1. Verificando estructura de carritos_pendientes...");
    
    const { data: sampleData, error: sampleError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log("❌ Error accediendo a la tabla:", sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log("✅ Estructura actual de la tabla:");
      console.log("   Campos:", Object.keys(sampleData[0]));
      
      // Verificar campos críticos
      const hasUserId = 'user_id' in sampleData[0];
      const hasItems = 'items' in sampleData[0];
      const hasTotalItems = 'total_items' in sampleData[0];
      const hasExpiresAt = 'expires_at' in sampleData[0];
      
      console.log("   ✅ user_id:", hasUserId);
      console.log("   ✅ items:", hasItems);
      console.log("   ✅ total_items:", hasTotalItems);
      console.log("   ✅ expires_at:", hasExpiresAt);
      
      if (!hasUserId || !hasItems || !hasTotalItems || !hasExpiresAt) {
        console.log("\n⚠️ ESTRUCTURA INCOMPLETA - Se requiere migración");
        console.log("   Campos faltantes detectados");
        return false;
      } else {
        console.log("\n✅ ESTRUCTURA CORRECTA - Todos los campos necesarios están presentes");
        return true;
      }
    } else {
      console.log("ℹ️ Tabla vacía - Estructura se verificará al insertar datos");
      return true;
    }
    
  } catch (error) {
    console.error("❌ Error verificando estructura:", error);
    return false;
  }
};

window.aplicarMigracionCarritos = async function() {
  try {
    console.log("🔧 Aplicando migración de carritos...");
    
    // Verificar estructura primero
    const estructuraCorrecta = await window.verificarEstructuraCarritos();
    
    if (estructuraCorrecta) {
      console.log("✅ Estructura ya es correcta, no se requiere migración");
      return true;
    }
    
    console.log("⚠️ Estructura incorrecta detectada - Aplicando correcciones...");
    
    // Nota: Las migraciones DDL deben ejecutarse desde Supabase Dashboard o CLI
    // Este script solo puede verificar y sugerir acciones
    
    console.log("📋 ACCIONES REQUERIDAS:");
    console.log("   1. Ejecutar migración SQL desde Supabase Dashboard");
    console.log("   2. Archivo: supabase/migrations/20250127000015_fix_carritos_pendientes_structure.sql");
    console.log("   3. O ejecutar los comandos SQL manualmente");
    
    console.log("\n📝 COMANDOS SQL A EJECUTAR:");
    console.log(`
-- Agregar campos faltantes
ALTER TABLE carritos_pendientes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS total_items INTEGER,
ADD COLUMN IF NOT EXISTS total_unidades INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_user_id ON carritos_pendientes(user_id);
CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_expires_at ON carritos_pendientes(expires_at);
    `);
    
    return false;
    
  } catch (error) {
    console.error("❌ Error aplicando migración:", error);
    return false;
  }
};

window.probarCarritoCompleto = async function() {
  try {
    console.log("🧪 Probando funcionalidad completa del carrito...");
    
    // 1. Verificar estructura
    const estructuraOk = await window.verificarEstructuraCarritos();
    if (!estructuraOk) {
      console.log("❌ Estructura incorrecta - No se puede probar");
      return false;
    }
    
    // 2. Obtener sesión actual
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.log("❌ No hay sesión activa");
      return false;
    }
    
    console.log("✅ Sesión activa:", session.user.email);
    
    // 3. Crear carrito de prueba
    const testCart = [
      {
        productoId: "test-product-id",
        curvaId: "test-curva",
        cantidadCurvas: 1,
        talles: { "S": 1, "M": 2 },
        tipo: "predefined",
        genero: "unisex",
        opcion: 1,
        precioUsd: 25.99
      }
    ];
    
    console.log("📦 Carrito de prueba:", testCart);
    
    // 4. Guardar carrito
    const cartData = {
      user_id: session.user.id,
      cliente_id: session.user.id,
      items: testCart,
      total_items: testCart.length,
      total_unidades: 3, // S:1 + M:2
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data: insertData, error: insertError } = await window.supabase
      .from('carritos_pendientes')
      .upsert(cartData)
      .select();
    
    if (insertError) {
      console.log("❌ Error guardando carrito de prueba:", insertError);
      return false;
    }
    
    console.log("✅ Carrito de prueba guardado:", insertData);
    
    // 5. Recuperar carrito
    const { data: retrieveData, error: retrieveError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (retrieveError) {
      console.log("❌ Error recuperando carrito:", retrieveError);
      return false;
    }
    
    console.log("✅ Carrito recuperado:", retrieveData);
    
    // 6. Limpiar carrito de prueba
    const { error: deleteError } = await window.supabase
      .from('carritos_pendientes')
      .delete()
      .eq('user_id', session.user.id);
    
    if (deleteError) {
      console.log("⚠️ Error limpiando carrito de prueba:", deleteError);
    } else {
      console.log("✅ Carrito de prueba limpiado");
    }
    
    console.log("🎉 PRUEBA COMPLETA EXITOSA - El sistema de carritos funciona correctamente");
    return true;
    
  } catch (error) {
    console.error("❌ Error en prueba completa:", error);
    return false;
  }
};

window.buscarCarrito360Senaker = async function() {
  try {
    console.log("🔍 Buscando específicamente el carrito de 360 Senaker...");
    
    // Buscar usuario
    const { data: users, error: usersError } = await window.supabase
      .from('user_roles')
      .select('*')
      .or('nombre.ilike.%360%,nombre.ilike.%Senaker%');
    
    if (usersError) {
      console.log("❌ Error buscando usuarios:", usersError);
      return;
    }
    
    console.log("👥 Usuarios encontrados:", users);
    
    for (const user of users || []) {
      console.log(`\n🔍 Analizando usuario: ${user.nombre} (${user.user_id})`);
      
      // Buscar carrito en Supabase
      const { data: supabaseCart, error: supabaseError } = await window.supabase
        .from('carritos_pendientes')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.log("❌ Error buscando en Supabase:", supabaseError);
      } else if (supabaseCart) {
        console.log("✅ Carrito encontrado en Supabase:", supabaseCart);
      } else {
        console.log("ℹ️ No hay carrito en Supabase");
      }
      
      // Buscar en Local Storage
      const localCartKey = `cartItems_${user.user_id}`;
      const localCartData = localStorage.getItem(localCartKey);
      
      if (localCartData) {
        console.log("✅ Carrito encontrado en Local Storage:", JSON.parse(localCartData));
        
        // Ofrecer restaurar
        console.log("💡 ¿Deseas restaurar este carrito a Supabase?");
        console.log(`   Ejecutar: restaurarCarritoASupabase('${user.user_id}', JSON.parse('${localCartData}'))`);
      } else {
        console.log("ℹ️ No hay carrito en Local Storage");
      }
    }
    
  } catch (error) {
    console.error("❌ Error buscando carrito:", error);
  }
};

console.log("📋 Funciones disponibles:");
console.log("  - verificarEstructuraCarritos()");
console.log("  - aplicarMigracionCarritos()");
console.log("  - probarCarritoCompleto()");
console.log("  - buscarCarrito360Senaker()");
console.log("\n🚀 Ejecutar: verificarEstructuraCarritos()");


