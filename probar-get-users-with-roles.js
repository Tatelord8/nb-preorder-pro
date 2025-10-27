// Script para probar la función get_users_with_roles después de la corrección
console.log("🔍 PRUEBA FUNCIÓN GET_USERS_WITH_ROLES");
console.log("====================================");

window.probarGetUsersWithRoles = async () => {
  try {
    console.log("🔍 Probando la función get_users_with_roles...");
    
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
    
    try {
      const { data: userRole, error: roleError } = await window.supabase
        .from("user_roles")
        .select("role, nombre")
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
      
      if (userRole.role !== 'superadmin') {
        console.log("⚠️ Usuario NO es superadmin");
        console.log("💡 Necesitas hacer login como superadmin");
        return;
      }
      
      console.log("✅ Usuario es SUPERADMIN");
      
    } catch (err) {
      console.log("❌ Excepción obteniendo rol:", err.message);
      return;
    }
    
    // Probar la función get_users_with_roles
    console.log("\n🔍 Probando la función get_users_with_roles...");
    
    try {
      const { data: users, error } = await window.supabase
        .rpc('get_users_with_roles');
      
      if (error) {
        console.log("❌ Error en get_users_with_roles:", error.message);
        console.log("🔍 Código:", error.code);
        console.log("🔍 Detalles:", error.details);
        console.log("🔍 Hint:", error.hint);
      } else {
        console.log("✅ Función get_users_with_roles ejecutada exitosamente");
        console.log("📊 Total usuarios obtenidos:", users.length);
        
        users.forEach((user, index) => {
          console.log(`\n   ${index + 1}. Usuario: ${user.nombre}`);
          console.log(`      - ID: ${user.id}`);
          console.log(`      - User ID: ${user.user_id}`);
          console.log(`      - Email: ${user.email}`);
          console.log(`      - Role: ${user.role}`);
          console.log(`      - Cliente ID: ${user.cliente_id}`);
          console.log(`      - Marca ID: ${user.marca_id}`);
          console.log(`      - Tier: ${user.tier}`);
          console.log(`      - Created: ${user.created_at}`);
        });
      }
    } catch (err) {
      console.log("❌ Excepción en get_users_with_roles:", err.message);
    }
    
    // Probar acceso directo a la tabla usuarios
    console.log("\n🔍 Probando acceso directo a la tabla usuarios...");
    
    try {
      const { data: usuarios, error: usuariosError } = await window.supabase
        .from("usuarios")
        .select("*");
      
      if (usuariosError) {
        console.log("❌ Error en usuarios:", usuariosError.message);
      } else {
        console.log("✅ Acceso directo a usuarios exitoso");
        console.log("📊 Total usuarios en tabla:", usuarios.length);
        
        usuarios.forEach((usuario, index) => {
          console.log(`\n   ${index + 1}. Usuario: ${usuario.nombre}`);
          console.log(`      - ID: ${usuario.id}`);
          console.log(`      - Email: ${usuario.email}`);
          console.log(`      - Activo: ${usuario.activo}`);
          console.log(`      - Created: ${usuario.created_at}`);
        });
      }
    } catch (err) {
      console.log("❌ Excepción en usuarios:", err.message);
    }
    
    console.log("\n✅ PRUEBA COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarGetUsersWithRoles() - Prueba la función get_users_with_roles");
console.log("\n💡 Ejecuta: probarGetUsersWithRoles()");
