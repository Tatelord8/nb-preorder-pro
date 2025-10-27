// Script para obtener el user_id actual y verificar user_roles
console.log("🔍 OBTENER USER_ID ACTUAL Y VERIFICAR USER_ROLES");
console.log("================================================");

window.obtenerUserIdActual = async () => {
  try {
    console.log("🔍 Obteniendo user_id actual...");
    
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
    
    // Verificar si este user_id existe en user_roles
    console.log("\n🔍 Verificando si este user_id existe en user_roles...");
    
    try {
      const { data: userRole, error } = await window.supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (error) {
        console.log("❌ Error obteniendo user_role:", error.message);
        console.log("🔍 Código:", error.code);
        
        if (error.code === 'PGRST116') {
          console.log("💡 PGRST116 = No se encontraron filas");
          console.log("   - Este user_id NO existe en user_roles");
          console.log("   - Necesitas crear un registro en user_roles para este usuario");
        }
      } else {
        console.log("✅ Usuario encontrado en user_roles:");
        console.log("📋 Datos:", userRole);
        console.log("🎭 Role:", userRole.role);
        console.log("👤 Nombre:", userRole.nombre);
        console.log("🏢 Cliente ID:", userRole.cliente_id);
        console.log("🏷️ Marca ID:", userRole.marca_id);
        console.log("📊 Tier:", userRole.tier);
      }
    } catch (err) {
      console.log("❌ Excepción:", err.message);
    }
    
    // Mostrar todos los user_roles para comparar
    console.log("\n🔍 Mostrando todos los user_roles para comparar...");
    
    try {
      const { data: allRoles, error: allRolesError } = await window.supabase
        .from("user_roles")
        .select("*");
      
      if (allRolesError) {
        console.log("❌ Error obteniendo todos los roles:", allRolesError.message);
      } else {
        console.log("✅ Todos los user_roles:");
        allRoles.forEach((role, index) => {
          console.log(`   ${index + 1}. User ID: ${role.user_id}`);
          console.log(`      Role: ${role.role}`);
          console.log(`      Nombre: ${role.nombre}`);
          console.log(`      Cliente ID: ${role.cliente_id}`);
          console.log(`      Marca ID: ${role.marca_id}`);
          console.log(`      Tier: ${role.tier}`);
          console.log(`      Created: ${role.created_at}`);
          console.log("");
        });
        
        // Verificar si el user_id actual está en la lista
        const currentUserId = session.user.id;
        const foundRole = allRoles.find(role => role.user_id === currentUserId);
        
        if (foundRole) {
          console.log("✅ El user_id actual SÍ está en user_roles");
          console.log("📋 Role encontrado:", foundRole.role);
        } else {
          console.log("❌ El user_id actual NO está en user_roles");
          console.log("💡 Necesitas crear un registro para este usuario");
        }
      }
    } catch (err) {
      console.log("❌ Excepción obteniendo todos los roles:", err.message);
    }
    
    console.log("\n✅ VERIFICACIÓN COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - obtenerUserIdActual() - Obtiene el user_id actual y verifica user_roles");
console.log("\n💡 Ejecuta: obtenerUserIdActual()");
