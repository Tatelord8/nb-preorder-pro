// Script para diagnosticar ambigüedad en user_id
console.log("🔍 DIAGNÓSTICO AMBIGÜEDAD USER_ID");
console.log("=================================");

window.diagnosticarAmbiguedadUserId = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de ambigüedad en user_id...");
    
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
    
    // Verificar rol del usuario
    console.log("\n🔍 Verificando rol del usuario...");
    const { data: userRole, error: roleError } = await window.supabase
      .from("user_roles")
      .select("role, nombre, cliente_id")
      .eq("user_id", session.user.id)
      .single();
    
    if (roleError) {
      console.log("❌ Error obteniendo rol:", roleError);
      console.log("🔍 Detalles del error:", {
        code: roleError.code,
        message: roleError.message,
        details: roleError.details,
        hint: roleError.hint
      });
      
      // Si es error de ambigüedad, probar diferentes enfoques
      if (roleError.code === '42702') {
        console.log("\n🔍 ERROR DE AMBIGÜEDAD DETECTADO - Probando soluciones...");
        
        // Enfoque 1: Especificar tabla explícitamente
        console.log("   - Enfoque 1: Especificando tabla explícitamente");
        const { data: userRole1, error: roleError1 } = await window.supabase
          .from("user_roles")
          .select("role, nombre, cliente_id")
          .eq("user_roles.user_id", session.user.id)
          .single();
        
        if (roleError1) {
          console.log("     ❌ Error:", roleError1.message);
        } else {
          console.log("     ✅ Éxito:", userRole1);
        }
        
        // Enfoque 2: Usar alias
        console.log("   - Enfoque 2: Usando alias");
        const { data: userRole2, error: roleError2 } = await window.supabase
          .from("user_roles")
          .select("role, nombre, cliente_id")
          .eq("user_roles.user_id", session.user.id)
          .single();
        
        if (roleError2) {
          console.log("     ❌ Error:", roleError2.message);
        } else {
          console.log("     ✅ Éxito:", userRole2);
        }
        
        // Enfoque 3: Consulta sin filtro para ver estructura
        console.log("   - Enfoque 3: Verificando estructura de la tabla");
        const { data: allRoles, error: allRolesError } = await window.supabase
          .from("user_roles")
          .select("*")
          .limit(5);
        
        if (allRolesError) {
          console.log("     ❌ Error:", allRolesError.message);
        } else {
          console.log("     ✅ Estructura:", allRoles);
        }
      }
      
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
      return;
    }
    
    console.log("✅ Usuario es SUPERADMIN");
    
    // Probar acceso a diferentes tablas con diferentes enfoques
    console.log("\n🔍 Probando acceso a tablas con diferentes enfoques...");
    
    const testTables = [
      { name: "user_roles", description: "Roles de usuarios" },
      { name: "clientes", description: "Clientes" },
      { name: "productos", description: "Productos" },
      { name: "pedidos", description: "Pedidos" }
    ];
    
    for (const table of testTables) {
      console.log(`\n📊 Probando ${table.name} (${table.description})...`);
      
      // Enfoque 1: Consulta simple
      try {
        const { data, error, count } = await window.supabase
          .from(table.name)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          console.log(`   ❌ Error simple:`, error.message);
          
          // Si es error de ambigüedad, probar enfoques específicos
          if (error.code === '42702') {
            console.log(`   🔍 Error de ambigüedad en ${table.name} - Probando soluciones...`);
            
            // Enfoque 2: Especificar columnas explícitamente
            try {
              const { data: data2, error: error2 } = await window.supabase
                .from(table.name)
                .select("id", { count: "exact", head: true });
              
              if (error2) {
                console.log(`     ❌ Error con columnas específicas:`, error2.message);
              } else {
                console.log(`     ✅ Éxito con columnas específicas: ${data2} registros`);
              }
            } catch (err) {
              console.log(`     ❌ Excepción:`, err.message);
            }
          }
        } else {
          console.log(`   ✅ Éxito simple: ${count} registros`);
        }
      } catch (err) {
        console.log(`   ❌ Excepción:`, err.message);
      }
    }
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarAmbiguedadUserId() - Diagnostica ambigüedad en user_id");
console.log("\n💡 Ejecuta: diagnosticarAmbiguedadUserId()");
