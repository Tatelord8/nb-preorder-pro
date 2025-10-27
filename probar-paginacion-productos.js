// Script para probar la paginación de productos
console.log("🔍 PRUEBA PAGINACIÓN DE PRODUCTOS");
console.log("=================================");

window.probarPaginacionProductos = async () => {
  try {
    console.log("🔍 Probando paginación de productos...");
    
    // Verificar si Supabase está disponible
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no está disponible");
      return;
    }
    
    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Error obteniendo sesión:", sessionError);
      return;
    }
    
    if (!session) {
      console.log("❌ No hay sesión activa");
      return;
    }
    
    console.log("✅ Sesión activa encontrada");
    console.log("📧 Email:", session.user.email);
    
    // Probar paginación
    console.log("\n🔍 Probando paginación...");
    
    let todosProductos = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let pageCount = 0;
    
    while (hasMore) {
      pageCount++;
      console.log(`\n📄 Página ${pageCount}: Cargando productos desde ${offset} hasta ${offset + limit - 1}...`);
      
      const { data: productosPage, error: productosError } = await window.supabase
        .from("productos")
        .select("id, sku, nombre, rubro")
        .range(offset, offset + limit - 1);
      
      if (productosError) {
        console.log(`❌ Error en página ${pageCount}:`, productosError.message);
        break;
      }
      
      if (productosPage && productosPage.length > 0) {
        todosProductos = [...todosProductos, ...productosPage];
        console.log(`✅ Página ${pageCount}: Cargados ${productosPage.length} productos`);
        console.log(`📊 Total acumulado: ${todosProductos.length}`);
        
        // Si obtenemos menos productos que el límite, hemos llegado al final
        if (productosPage.length < limit) {
          hasMore = false;
          console.log(`🏁 Última página detectada (${productosPage.length} < ${limit})`);
        } else {
          offset += limit;
        }
      } else {
        hasMore = false;
        console.log(`🏁 No hay más productos en página ${pageCount}`);
      }
    }
    
    console.log(`\n📊 RESUMEN DE PAGINACIÓN:`);
    console.log(`   - Páginas procesadas: ${pageCount}`);
    console.log(`   - Total productos obtenidos: ${todosProductos.length}`);
    console.log(`   - Límite por página: ${limit}`);
    
    // Verificar conteos por rubro
    console.log(`\n🔍 Verificando conteos por rubro...`);
    
    const calzados = todosProductos.filter(p => p.rubro?.toLowerCase() === 'calzados');
    const prendas = todosProductos.filter(p => p.rubro?.toLowerCase() === 'prendas');
    const otros = todosProductos.filter(p => p.rubro?.toLowerCase() !== 'calzados' && p.rubro?.toLowerCase() !== 'prendas');
    
    console.log(`   - Calzados: ${calzados.length}`);
    console.log(`   - Prendas: ${prendas.length}`);
    console.log(`   - Otros: ${otros.length}`);
    console.log(`   - Total: ${calzados.length + prendas.length + otros.length}`);
    
    // Verificar que no hay duplicados
    const skusUnicos = new Set(todosProductos.map(p => p.sku));
    console.log(`\n🔍 Verificando duplicados...`);
    console.log(`   - SKUs únicos: ${skusUnicos.size}`);
    console.log(`   - Total productos: ${todosProductos.length}`);
    
    if (skusUnicos.size === todosProductos.length) {
      console.log(`   ✅ No hay duplicados`);
    } else {
      console.log(`   ⚠️ Hay ${todosProductos.length - skusUnicos.size} duplicados`);
    }
    
    // Comparar con consulta directa
    console.log(`\n🔍 Comparando con consulta directa...`);
    
    try {
      const { count: totalCount, error: countError } = await window.supabase
        .from("productos")
        .select("*", { count: "exact", head: true });
      
      if (countError) {
        console.log(`❌ Error obteniendo conteo total:`, countError.message);
      } else {
        console.log(`📊 Conteo total desde BD: ${totalCount}`);
        console.log(`📊 Productos obtenidos con paginación: ${todosProductos.length}`);
        
        if (totalCount === todosProductos.length) {
          console.log(`✅ ¡PAGINACIÓN EXITOSA! Todos los productos fueron obtenidos`);
        } else {
          console.log(`⚠️ Faltan ${totalCount - todosProductos.length} productos`);
        }
      }
    } catch (err) {
      console.log(`❌ Excepción obteniendo conteo total:`, err.message);
    }
    
    console.log("\n✅ PRUEBA DE PAGINACIÓN COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarPaginacionProductos() - Prueba la paginación de productos");
console.log("\n💡 Ejecuta: probarPaginacionProductos()");
