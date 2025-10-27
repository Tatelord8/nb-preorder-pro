// Script para probar la edición de usuarios después de las correcciones
console.log("🔍 PRUEBA EDICIÓN DE USUARIOS");
console.log("=============================");

window.probarEdicionUsuarios = async () => {
  try {
    console.log("🔍 Probando edición de usuarios...");
    
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
        console.log("💡 Necesitas hacer login como superadmin para editar usuarios");
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
      } else {
        console.log("✅ Función get_users_with_roles ejecutada exitosamente");
        console.log("📊 Total usuarios obtenidos:", users.length);
        
        // Buscar un usuario cliente para probar edición
        const clienteUser = users.find(u => u.role === 'cliente');
        
        if (clienteUser) {
          console.log("\n🔍 Usuario cliente encontrado para prueba:");
          console.log("   - ID:", clienteUser.id);
          console.log("   - User ID:", clienteUser.user_id);
          console.log("   - Email:", clienteUser.email);
          console.log("   - Nombre:", clienteUser.nombre);
          console.log("   - Role:", clienteUser.role);
          console.log("   - Tier:", clienteUser.tier);
          console.log("   - Cliente ID:", clienteUser.cliente_id);
          console.log("   - Marca ID:", clienteUser.marca_id);
          
          // Probar una actualización simple
          console.log("\n🔍 Probando actualización simple...");
          
          try {
            const { data: updateResult, error: updateError } = await window.supabase
              .from("user_roles")
              .update({ 
                nombre: clienteUser.nombre + " (Test)" 
              })
              .eq("user_id", clienteUser.user_id)
              .select();
            
            if (updateError) {
              console.log("❌ Error en actualización:", updateError.message);
              console.log("🔍 Código:", updateError.code);
              console.log("🔍 Detalles:", updateError.details);
            } else {
              console.log("✅ Actualización exitosa:", updateResult);
              
              // Revertir el cambio
              console.log("\n🔄 Revirtiendo cambio...");
              const { error: revertError } = await window.supabase
                .from("user_roles")
                .update({ 
                  nombre: clienteUser.nombre 
                })
                .eq("user_id", clienteUser.user_id);
              
              if (revertError) {
                console.log("⚠️ Error revirtiendo cambio:", revertError.message);
              } else {
                console.log("✅ Cambio revertido exitosamente");
              }
            }
          } catch (err) {
            console.log("❌ Excepción en actualización:", err.message);
          }
        } else {
          console.log("⚠️ No se encontró ningún usuario cliente para probar");
        }
      }
    } catch (err) {
      console.log("❌ Excepción en get_users_with_roles:", err.message);
    }
    
    // Probar la función create_user_complete
    console.log("\n🔍 Probando la función create_user_complete...");
    
    try {
      // Solo verificar que la función existe y tiene los parámetros correctos
      const { data: testResult, error: testError } = await window.supabase
        .rpc('create_user_complete', {
          p_user_id: session.user.id, // Usar el mismo ID para evitar conflictos
          p_email: 'test@example.com',
          p_nombre: 'Test User',
          p_role: 'cliente',
          p_tier: '1',
          p_marca_id: null
        });
      
      if (testError) {
        console.log("❌ Error en create_user_complete:", testError.message);
        console.log("🔍 Código:", testError.code);
        console.log("🔍 Detalles:", testError.details);
      } else {
        console.log("✅ Función create_user_complete ejecutada exitosamente");
        console.log("📊 Resultado:", testResult);
      }
    } catch (err) {
      console.log("❌ Excepción en create_user_complete:", err.message);
    }
    
    console.log("\n✅ PRUEBA DE EDICIÓN DE USUARIOS COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarEdicionUsuarios() - Prueba la edición de usuarios");
console.log("\n💡 Ejecuta: probarEdicionUsuarios()");
