// Script de prueba para verificar la carga masiva de productos
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testMassUpload() {
  console.log("🧪 Probando carga masiva de productos...\n");

  try {
    // 1. Verificar que las columnas existan
    console.log("1️⃣ Verificando estructura de tabla productos...");
    const { data: tableStructure, error: structureError } = await supabase
      .from("productos")
      .select(`
        id, sku, nombre, precio_usd, linea, categoria, genero, 
        tier, game_plan, imagen_url, xfd, fecha_despacho, 
        marca_id, rubro, created_at
      `)
      .limit(1);
    
    if (structureError) {
      console.error("❌ Error de estructura:", structureError.message);
      return false;
    }
    console.log("✅ Estructura de tabla verificada\n");

    // 2. Verificar tabla marcas
    console.log("2️⃣ Verificando tabla marcas...");
    const { data: marcasData, error: marcasError } = await supabase
      .from("marcas")
      .select("id, nombre")
      .limit(5);
    
    if (marcasError) {
      console.error("❌ Error en tabla marcas:", marcasError.message);
      return false;
    }
    console.log("✅ Tabla marcas verificada");
    console.log(`📊 Marcas disponibles: ${marcasData?.length || 0}\n`);

    // 3. Probar inserción de producto de prueba
    console.log("3️⃣ Probando inserción de producto...");
    const testProduct = {
      sku: "TEST001",
      nombre: "Producto de Prueba",
      precio_usd: 99.99,
      linea: "Test Line",
      categoria: "Test Category",
      genero: "Unisex",
      tier: "1",
      game_plan: false,
      imagen_url: "https://example.com/test.jpg",
      xfd: "2024-01-15",
      fecha_despacho: "2024-02-01",
      rubro: "Calzados"
    };

    const { data: insertData, error: insertError } = await supabase
      .from("productos")
      .insert(testProduct)
      .select();
    
    if (insertError) {
      console.error("❌ Error insertando producto:", insertError.message);
      return false;
    }
    console.log("✅ Producto de prueba insertado correctamente");
    console.log(`📊 ID del producto: ${insertData[0]?.id}\n`);

    // 4. Limpiar producto de prueba
    console.log("4️⃣ Limpiando producto de prueba...");
    const { error: deleteError } = await supabase
      .from("productos")
      .delete()
      .eq("sku", "TEST001");
    
    if (deleteError) {
      console.error("❌ Error eliminando producto de prueba:", deleteError.message);
    } else {
      console.log("✅ Producto de prueba eliminado correctamente\n");
    }

    console.log("🎉 PRUEBA COMPLETA: La carga masiva debería funcionar correctamente");
    return true;

  } catch (error) {
    console.error("❌ Error durante la prueba:", error.message);
    return false;
  }
}

// Ejecutar prueba
testMassUpload().then(success => {
  if (success) {
    console.log("\n✅ Estado: CARGA MASIVA LISTA PARA USAR");
    process.exit(0);
  } else {
    console.log("\n❌ Estado: ERROR EN CONFIGURACIÓN");
    process.exit(1);
  }
});
