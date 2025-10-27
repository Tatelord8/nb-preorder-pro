// Script para probar la lógica jerárquica de tiers
console.log("🔍 PRUEBA LÓGICA JERÁRQUICA DE TIERS");
console.log("====================================");

window.probarLogicaJerarquicaTiers = async () => {
  try {
    console.log("🔍 Probando la lógica jerárquica de tiers...");
    
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
    
    // Obtener tier del usuario actual
    console.log("\n🔍 Obteniendo tier del usuario actual...");
    
    try {
      const { data: userRole, error: roleError } = await window.supabase
        .from("user_roles")
        .select("role, tier, nombre")
        .eq("user_id", session.user.id)
        .single();
      
      if (roleError) {
        console.log("❌ Error obteniendo rol:", roleError.message);
        return;
      }
      
      if (!userRole) {
        console.log("❌ Usuario no encontrado en user_roles");
        return;
      }
      
      console.log("✅ Datos del usuario:");
      console.log("   - Role:", userRole.role);
      console.log("   - Nombre:", userRole.nombre);
      console.log("   - Tier:", userRole.tier);
      
      const userTier = userRole.tier;
      
      if (!userTier) {
        console.log("⚠️ Usuario no tiene tier asignado");
        return;
      }
      
      console.log(`\n🔍 Usuario actual es Tier ${userTier}`);
      
      // Probar la lógica jerárquica
      console.log("\n🔍 Probando lógica jerárquica...");
      
      // Función para probar acceso (copiada de tierAccess.ts)
      const canUserAccessTier = (userTier, productTier) => {
        if (!userTier) return false;
        
        const userTierNum = parseInt(userTier);
        const productTierNum = parseInt(productTier);
        
        if (isNaN(userTierNum) || isNaN(productTierNum)) return false;
        
        if (userTierNum === 0) return true; // Tier 0 ve todo
        
        return productTierNum >= userTierNum;
      };
      
      // Probar acceso a diferentes tiers
      const tiersToTest = ["0", "1", "2", "3"];
      
      console.log(`\n📊 Tabla de acceso para Tier ${userTier}:`);
      console.log("   Producto Tier | Acceso | Razón");
      console.log("   -------------|--------|------");
      
      tiersToTest.forEach(productTier => {
        const hasAccess = canUserAccessTier(userTier, productTier);
        let razon = "";
        
        if (userTier === "0") {
          razon = "Tier 0 ve todo";
        } else if (parseInt(productTier) >= parseInt(userTier)) {
          razon = `Tier ${userTier} puede ver Tier ${productTier} o superior`;
        } else {
          razon = `Tier ${userTier} NO puede ver Tier ${productTier} (inferior)`;
        }
        
        console.log(`   Tier ${productTier.padEnd(6)} | ${hasAccess ? "✅ Sí" : "❌ No"}    | ${razon}`);
      });
      
      // Obtener algunos productos de diferentes tiers para probar
      console.log("\n🔍 Obteniendo productos de diferentes tiers...");
      
      const { data: productos, error: productosError } = await window.supabase
        .from("productos")
        .select("id, sku, nombre, tier")
        .limit(20);
      
      if (productosError) {
        console.log("❌ Error obteniendo productos:", productosError.message);
      } else {
        console.log(`✅ Productos obtenidos: ${productos.length}`);
        
        // Agrupar productos por tier
        const productosPorTier = {};
        productos.forEach(producto => {
          const tier = producto.tier || "0";
          if (!productosPorTier[tier]) {
            productosPorTier[tier] = [];
          }
          productosPorTier[tier].push(producto);
        });
        
        console.log("\n📊 Productos por tier:");
        Object.keys(productosPorTier).sort().forEach(tier => {
          const productos = productosPorTier[tier];
          const tieneAcceso = canUserAccessTier(userTier, tier);
          console.log(`   Tier ${tier}: ${productos.length} productos - ${tieneAcceso ? "✅ Acceso" : "❌ Sin acceso"}`);
          
          if (tieneAcceso && productos.length > 0) {
            console.log(`      Ejemplo: ${productos[0].sku} - ${productos[0].nombre}`);
          }
        });
        
        // Probar acceso a un producto específico
        console.log("\n🔍 Probando acceso a producto específico...");
        
        const productoPrueba = productos.find(p => p.tier && p.tier !== userTier);
        if (productoPrueba) {
          const tieneAcceso = canUserAccessTier(userTier, productoPrueba.tier);
          console.log(`   Producto: ${productoPrueba.sku} (Tier ${productoPrueba.tier})`);
          console.log(`   Usuario: Tier ${userTier}`);
          console.log(`   Acceso: ${tieneAcceso ? "✅ Permitido" : "❌ Denegado"}`);
          
          if (!tieneAcceso) {
            console.log(`   💡 Este producto debería mostrar "Acceso Denegado" en ProductDetail`);
          }
        }
      }
      
    } catch (err) {
      console.log("❌ Excepción obteniendo datos del usuario:", err.message);
    }
    
    console.log("\n✅ PRUEBA DE LÓGICA JERÁRQUICA COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarLogicaJerarquicaTiers() - Prueba la lógica jerárquica de tiers");
console.log("\n💡 Ejecuta: probarLogicaJerarquicaTiers()");
