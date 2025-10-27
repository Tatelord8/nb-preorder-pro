// Script para diagnosticar el problema de página en blanco en ProductDetail
console.log("🔍 DIAGNÓSTICO PÁGINA EN BLANCO - PRODUCTDETAIL");
console.log("===============================================");

window.diagnosticarPaginaBlancaProductDetail = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de página en blanco...");
    
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
    console.log("🆔 User ID:", session.user.id);
    
    // Obtener tier del usuario
    console.log("\n🔍 Obteniendo tier del usuario...");
    
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
      
    } catch (err) {
      console.log("❌ Excepción obteniendo datos del usuario:", err.message);
      return;
    }
    
    // Obtener algunos productos para probar
    console.log("\n🔍 Obteniendo productos para probar...");
    
    try {
      const { data: productos, error: productosError } = await window.supabase
        .from("productos")
        .select("id, sku, nombre, tier, rubro, genero")
        .limit(5);
      
      if (productosError) {
        console.log("❌ Error obteniendo productos:", productosError.message);
        return;
      }
      
      console.log(`✅ Productos obtenidos: ${productos.length}`);
      
      // Probar acceso a cada producto
      productos.forEach((producto, index) => {
        console.log(`\n📦 Producto ${index + 1}:`);
        console.log("   - ID:", producto.id);
        console.log("   - SKU:", producto.sku);
        console.log("   - Nombre:", producto.nombre);
        console.log("   - Tier:", producto.tier);
        console.log("   - Rubro:", producto.rubro);
        console.log("   - Género:", producto.genero);
        
        // Probar la función canUserAccessTier
        try {
          const canAccess = window.canUserAccessTier ? 
            window.canUserAccessTier(userRole.tier, producto.tier || "0") :
            "Función no disponible";
          console.log("   - Acceso:", canAccess);
        } catch (err) {
          console.log("   - Error probando acceso:", err.message);
        }
      });
      
      // Probar navegación a un producto específico
      console.log("\n🔍 Probando navegación a producto...");
      
      if (productos.length > 0) {
        const productoPrueba = productos[0];
        console.log(`📦 Probando navegación a: ${productoPrueba.sku}`);
        
        // Simular la navegación
        const url = `/product/${productoPrueba.id}?rubro=${productoPrueba.rubro || 'calzados'}`;
        console.log("🔗 URL de prueba:", url);
        
        // Verificar si la función de navegación está disponible
        if (typeof window.location !== 'undefined') {
          console.log("✅ window.location disponible");
          console.log("   - URL actual:", window.location.href);
          console.log("   - Pathname:", window.location.pathname);
          console.log("   - Search:", window.location.search);
        } else {
          console.log("❌ window.location no disponible");
        }
      }
      
    } catch (err) {
      console.log("❌ Excepción obteniendo productos:", err.message);
    }
    
    // Verificar errores en la consola
    console.log("\n🔍 Verificando errores en la consola...");
    
    // Interceptar errores de JavaScript
    const originalError = console.error;
    console.error = function(...args) {
      console.log("🚨 ERROR INTERCEPTADO:", ...args);
      originalError.apply(console, args);
    };
    
    // Verificar si hay errores de React
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      console.log("✅ React está disponible");
    } else {
      console.log("⚠️ React no está disponible o no se puede acceder");
    }
    
    // Verificar si hay errores de React Router
    if (window.ReactRouterDOM) {
      console.log("✅ React Router DOM está disponible");
    } else {
      console.log("⚠️ React Router DOM no está disponible");
    }
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    console.log("💡 Revisa la consola para ver si hay errores interceptados");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

// Función auxiliar para probar canUserAccessTier
window.canUserAccessTier = (userTier, productTier) => {
  if (!userTier) return false;
  
  const userTierNum = parseInt(userTier);
  const productTierNum = parseInt(productTier);
  
  if (isNaN(userTierNum) || isNaN(productTierNum)) return false;
  
  if (userTierNum === 0) return true;
  
  return productTierNum >= userTierNum;
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarPaginaBlancaProductDetail() - Diagnostica el problema de página en blanco");
console.log("\n💡 Ejecuta: diagnosticarPaginaBlancaProductDetail()");

