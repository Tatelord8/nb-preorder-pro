// Script de diagnóstico para verificar conexión de Superadmin
console.log("🔍 DIAGNÓSTICO SUPERADMIN - CONEXIÓN SUPABASE");
console.log("=============================================");

window.diagnosticarSuperadmin = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico...");
    
    // Verificar si Supabase está disponible
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no está disponible en window.supabase");
      console.log("💡 Intentando encontrar Supabase en otras ubicaciones...");
      
      // Buscar en diferentes ubicaciones posibles
      const possibleLocations = [
        'window.supabase',
        'window.__supabase',
        'window.SupabaseClient',
        'document.supabase'
      ];
      
      for (const location of possibleLocations) {
        try {
          const found = eval(location);
          if (found) {
            console.log(`✅ Supabase encontrado en: ${location}`);
            window.supabase = found;
            break;
          }
        } catch (e) {
          // Continuar buscando
        }
      }
      
      if (typeof window.supabase === 'undefined') {
        console.log("❌ No se pudo encontrar Supabase en ninguna ubicación");
        console.log("💡 Asegúrate de que la aplicación esté cargada completamente");
        return;
      }
    }
    
    console.log("✅ Supabase encontrado");
    
    // Verificar sesión actual
    console.log("\n🔍 Verificando sesión actual...");
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Error obteniendo sesión:", sessionError);
      return;
    }
    
    if (!session) {
      console.log("❌ No hay sesión activa");
      console.log("💡 Necesitas hacer login primero");
      return;
    }
    
    console.log("✅ Sesión activa encontrada");
    console.log("📧 Email:", session.user.email);
    console.log("🆔 User ID:", session.user.id);
    
    // Verificar rol del usuario
    console.log("\n🔍 Verificando rol del usuario...");
    const { data: userRole, error: roleError } = await window.supabase
      .from("user_roles")
      .select("role, nombre, cliente_id")
      .eq("user_id", session.user.id)
      .single();
    
    if (roleError) {
      console.log("❌ Error obteniendo rol:", roleError);
      return;
    }
    
    if (!userRole) {
      console.log("❌ Usuario no encontrado en user_roles");
      return;
    }
    
    console.log("✅ Datos del usuario:");
    console.log("   - Role:", userRole.role);
    console.log("   - Nombre:", userRole.nombre);
    console.log("   - Cliente ID:", userRole.cliente_id);
    
    if (userRole.role !== 'superadmin') {
      console.log("⚠️ Usuario NO es superadmin");
      console.log("💡 Necesitas hacer login como superadmin");
      return;
    }
    
    console.log("✅ Usuario es SUPERADMIN");
    
    // Verificar acceso a tablas principales
    console.log("\n🔍 Verificando acceso a tablas principales...");
    
    const tables = [
      { name: "user_roles", description: "Roles de usuarios" },
      { name: "clientes", description: "Clientes" },
      { name: "productos", description: "Productos" },
      { name: "pedidos", description: "Pedidos" },
      { name: "marcas", description: "Marcas" }
    ];
    
    for (const table of tables) {
      try {
        console.log(`\n📊 Probando acceso a ${table.name} (${table.description})...`);
        
        const { data, error, count } = await window.supabase
          .from(table.name)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          console.log(`❌ Error en ${table.name}:`, error);
        } else {
          console.log(`✅ ${table.name}: ${count} registros`);
        }
      } catch (err) {
        console.log(`❌ Excepción en ${table.name}:`, err);
      }
    }
    
    // Verificar datos específicos del Dashboard
    console.log("\n🔍 Verificando datos específicos del Dashboard...");
    
    try {
      // Contar usuarios
      const { count: userCount } = await window.supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true });
      console.log(`👥 Total usuarios: ${userCount}`);
      
      // Contar productos
      const { count: productCount } = await window.supabase
        .from("productos")
        .select("*", { count: "exact", head: true });
      console.log(`📦 Total productos: ${productCount}`);
      
      // Contar pedidos
      const { count: orderCount } = await window.supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true });
      console.log(`🛒 Total pedidos: ${orderCount}`);
      
      // Contar marcas
      const { count: brandCount } = await window.supabase
        .from("marcas")
        .select("*", { count: "exact", head: true });
      console.log(`🏷️ Total marcas: ${brandCount}`);
      
    } catch (err) {
      console.log("❌ Error verificando conteos:", err);
    }
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    console.log("💡 Si todos los datos se muestran correctamente, el problema puede estar en el frontend");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarSuperadmin() - Diagnostica la conexión del superadmin");
console.log("\n💡 Ejecuta: diagnosticarSuperadmin()");
