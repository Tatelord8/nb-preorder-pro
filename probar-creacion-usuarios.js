// Script para probar la creación de usuarios después de la corrección
console.log("🔍 PRUEBA CREACIÓN DE USUARIOS");
console.log("==============================");

window.probarCreacionUsuarios = async () => {
  try {
    console.log("🔍 Probando creación de usuarios...");
    
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
        console.log("💡 Necesitas hacer login como superadmin para crear usuarios");
        return;
      }
      
      console.log("✅ Usuario es SUPERADMIN");
      
    } catch (err) {
      console.log("❌ Excepción obteniendo rol:", err.message);
      return;
    }
    
    // Probar la función create_user_complete con datos de prueba
    console.log("\n🔍 Probando función create_user_complete...");
    
    try {
      // Generar un email único para la prueba
      const testEmail = `test-${Date.now()}@example.com`;
      const testUserId = crypto.randomUUID();
      
      console.log("📧 Email de prueba:", testEmail);
      console.log("🆔 User ID de prueba:", testUserId);
      
      const { data: testResult, error: testError } = await window.supabase
        .rpc('create_user_complete', {
          p_user_id: testUserId,
          p_email: testEmail,
          p_nombre: 'Usuario de Prueba',
          p_role: 'cliente',
          p_tier: '1',
          p_marca_id: null
        });
      
      if (testError) {
        console.log("❌ Error en create_user_complete:", testError.message);
        console.log("🔍 Código:", testError.code);
        console.log("🔍 Detalles:", testError.details);
        console.log("🔍 Hint:", testError.hint);
      } else {
        console.log("✅ Función create_user_complete ejecutada exitosamente");
        console.log("📊 Resultado:", testResult);
        
        // Verificar que el usuario se creó correctamente
        console.log("\n🔍 Verificando que el usuario se creó...");
        
        const { data: usuarioCreado, error: usuarioError } = await window.supabase
          .from("usuarios")
          .select("*")
          .eq("id", testUserId)
          .single();
        
        if (usuarioError) {
          console.log("❌ Error verificando usuario creado:", usuarioError.message);
        } else {
          console.log("✅ Usuario creado en tabla usuarios:", usuarioCreado);
        }
        
        const { data: userRoleCreado, error: roleError } = await window.supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", testUserId)
          .single();
        
        if (roleError) {
          console.log("❌ Error verificando user_role creado:", roleError.message);
        } else {
          console.log("✅ User role creado:", userRoleCreado);
        }
        
        // Limpiar el usuario de prueba
        console.log("\n🧹 Limpiando usuario de prueba...");
        
        const { error: deleteRoleError } = await window.supabase
          .from("user_roles")
          .delete()
          .eq("user_id", testUserId);
        
        if (deleteRoleError) {
          console.log("⚠️ Error eliminando user_role:", deleteRoleError.message);
        } else {
          console.log("✅ User role eliminado");
        }
        
        const { error: deleteUserError } = await window.supabase
          .from("usuarios")
          .delete()
          .eq("id", testUserId);
        
        if (deleteUserError) {
          console.log("⚠️ Error eliminando usuario:", deleteUserError.message);
        } else {
          console.log("✅ Usuario eliminado");
        }
      }
    } catch (err) {
      console.log("❌ Excepción en create_user_complete:", err.message);
    }
    
    // Probar creación de cliente con vendedor
    console.log("\n🔍 Probando creación de cliente con vendedor...");
    
    try {
      // Obtener un vendedor para la prueba
      const { data: vendedores, error: vendedoresError } = await window.supabase
        .from("vendedores")
        .select("id, nombre")
        .limit(1);
      
      if (vendedoresError) {
        console.log("❌ Error obteniendo vendedores:", vendedoresError.message);
      } else if (vendedores && vendedores.length > 0) {
        const vendedor = vendedores[0];
        console.log("✅ Vendedor encontrado:", vendedor.nombre);
        
        // Generar datos de prueba para cliente
        const testClienteEmail = `cliente-${Date.now()}@example.com`;
        const testClienteId = crypto.randomUUID();
        
        console.log("📧 Email de cliente de prueba:", testClienteEmail);
        console.log("🆔 Cliente ID de prueba:", testClienteId);
        
        // Crear usuario cliente
        const { data: clienteResult, error: clienteError } = await window.supabase
          .rpc('create_user_complete', {
            p_user_id: testClienteId,
            p_email: testClienteEmail,
            p_nombre: 'Cliente de Prueba',
            p_role: 'cliente',
            p_tier: '2',
            p_marca_id: null
          });
        
        if (clienteError) {
          console.log("❌ Error creando cliente:", clienteError.message);
        } else {
          console.log("✅ Cliente creado exitosamente");
          
          // Crear registro en tabla clientes
          const { error: clienteTableError } = await window.supabase
            .from("clientes")
            .insert({
              id: testClienteId,
              nombre: 'Cliente de Prueba',
              tier: '2',
              vendedor_id: vendedor.id,
              marca_id: null
            });
          
          if (clienteTableError) {
            console.log("❌ Error creando registro en clientes:", clienteTableError.message);
          } else {
            console.log("✅ Registro en tabla clientes creado");
          }
          
          // Limpiar cliente de prueba
          console.log("\n🧹 Limpiando cliente de prueba...");
          
          await window.supabase.from("clientes").delete().eq("id", testClienteId);
          await window.supabase.from("user_roles").delete().eq("user_id", testClienteId);
          await window.supabase.from("usuarios").delete().eq("id", testClienteId);
          
          console.log("✅ Cliente de prueba eliminado");
        }
      } else {
        console.log("⚠️ No hay vendedores disponibles para la prueba");
      }
    } catch (err) {
      console.log("❌ Excepción en prueba de cliente:", err.message);
    }
    
    console.log("\n✅ PRUEBA DE CREACIÓN DE USUARIOS COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarCreacionUsuarios() - Prueba la creación de usuarios");
console.log("\n💡 Ejecuta: probarCreacionUsuarios()");
