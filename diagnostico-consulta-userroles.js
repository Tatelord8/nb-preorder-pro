// Script para diagnosticar la consulta de user_roles en Layout.tsx
console.log("🔍 DIAGNÓSTICO CONSULTA USER_ROLES EN LAYOUT");
console.log("=============================================");

window.diagnosticarConsultaUserRoles = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de la consulta user_roles...");
    
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
    
    // Probar la consulta exacta de Layout.tsx
    console.log("\n🔍 Probando consulta exacta de Layout.tsx...");
    console.log("   - Consulta: user_roles con clientes(nombre)");
    
    try {
      const { data: userRole, error } = await window.supabase
        .from("user_roles")
        .select("role, nombre, clientes(nombre)")
        .eq("user_id", session.user.id)
        .single();
      
      console.log("   - Resultado userRole:", userRole);
      console.log("   - Error:", error);
      
      if (error) {
        console.log("   ❌ Error en consulta:", error.message);
        console.log("   🔍 Código:", error.code);
        console.log("   🔍 Detalles:", error.details);
        console.log("   🔍 Hint:", error.hint);
      } else {
        console.log("   ✅ Consulta exitosa");
        console.log("   📋 Datos obtenidos:", userRole);
      }
    } catch (err) {
      console.log("   ❌ Excepción:", err.message);
    }
    
    // Probar consulta simplificada sin JOIN
    console.log("\n🔍 Probando consulta simplificada sin JOIN...");
    
    try {
      const { data: userRoleSimple, error: errorSimple } = await window.supabase
        .from("user_roles")
        .select("role, nombre, cliente_id")
        .eq("user_id", session.user.id)
        .single();
      
      console.log("   - Resultado userRoleSimple:", userRoleSimple);
      console.log("   - Error:", errorSimple);
      
      if (errorSimple) {
        console.log("   ❌ Error en consulta simple:", errorSimple.message);
        console.log("   🔍 Código:", errorSimple.code);
      } else {
        console.log("   ✅ Consulta simple exitosa");
        console.log("   📋 Datos obtenidos:", userRoleSimple);
        
        // Si hay cliente_id, obtener nombre del cliente por separado
        if (userRoleSimple.cliente_id) {
          console.log("\n🔍 Obteniendo nombre del cliente por separado...");
          
          try {
            const { data: cliente, error: clienteError } = await window.supabase
              .from("clientes")
              .select("nombre")
              .eq("id", userRoleSimple.cliente_id)
              .single();
            
            if (clienteError) {
              console.log("   ❌ Error obteniendo cliente:", clienteError.message);
            } else {
              console.log("   ✅ Cliente obtenido:", cliente);
            }
          } catch (err) {
            console.log("   ❌ Excepción obteniendo cliente:", err.message);
          }
        }
      }
    } catch (err) {
      console.log("   ❌ Excepción en consulta simple:", err.message);
    }
    
    // Probar consulta con JOIN explícito
    console.log("\n🔍 Probando consulta con JOIN explícito...");
    
    try {
      const { data: userRoleJoin, error: errorJoin } = await window.supabase
        .from("user_roles")
        .select(`
          role, 
          nombre, 
          cliente_id,
          clientes!left(nombre)
        `)
        .eq("user_id", session.user.id)
        .single();
      
      console.log("   - Resultado userRoleJoin:", userRoleJoin);
      console.log("   - Error:", errorJoin);
      
      if (errorJoin) {
        console.log("   ❌ Error en consulta JOIN:", errorJoin.message);
        console.log("   🔍 Código:", errorJoin.code);
      } else {
        console.log("   ✅ Consulta JOIN exitosa");
        console.log("   📋 Datos obtenidos:", userRoleJoin);
      }
    } catch (err) {
      console.log("   ❌ Excepción en consulta JOIN:", err.message);
    }
    
    // Verificar si el usuario existe en user_roles
    console.log("\n🔍 Verificando si el usuario existe en user_roles...");
    
    try {
      const { data: allRoles, error: allRolesError } = await window.supabase
        .from("user_roles")
        .select("*");
      
      if (allRolesError) {
        console.log("   ❌ Error obteniendo todos los roles:", allRolesError.message);
      } else {
        console.log("   ✅ Todos los roles obtenidos:", allRoles.length, "registros");
        console.log("   📋 Roles:", allRoles);
        
        // Buscar el usuario actual
        const currentUserRole = allRoles.find(role => role.user_id === session.user.id);
        if (currentUserRole) {
          console.log("   ✅ Usuario encontrado en user_roles:", currentUserRole);
        } else {
          console.log("   ❌ Usuario NO encontrado en user_roles");
          console.log("   🔍 User ID buscado:", session.user.id);
        }
      }
    } catch (err) {
      console.log("   ❌ Excepción obteniendo todos los roles:", err.message);
    }
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarConsultaUserRoles() - Diagnostica la consulta de user_roles");
console.log("\n💡 Ejecuta: diagnosticarConsultaUserRoles()");
