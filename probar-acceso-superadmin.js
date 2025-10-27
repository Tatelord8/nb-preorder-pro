// Script para probar acceso del superadmin después de las correcciones
console.log("🔍 PRUEBA DE ACCESO SUPERADMIN POST-CORRECCIÓN");
console.log("==============================================");

window.probarAccesoSuperadmin = async () => {
  try {
    console.log("🔍 Iniciando prueba de acceso del superadmin...");
    
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
      console.log("🔍 Detalles del error:", {
        code: roleError.code,
        message: roleError.message,
        details: roleError.details,
        hint: roleError.hint
      });
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
    
    // Probar acceso a diferentes tablas
    console.log("\n🔍 Probando acceso a tablas principales...");
    
    const testTables = [
      { name: "user_roles", description: "Roles de usuarios" },
      { name: "clientes", description: "Clientes" },
      { name: "productos", description: "Productos" },
      { name: "pedidos", description: "Pedidos" },
      { name: "marcas", description: "Marcas" },
      { name: "items_pedido", description: "Items de pedidos" },
      { name: "carritos_pendientes", description: "Carritos pendientes" },
      { name: "usuarios", description: "Usuarios" },
      { name: "vendedores", description: "Vendedores" }
    ];
    
    let successCount = 0;
    let totalCount = testTables.length;
    
    for (const table of testTables) {
      try {
        console.log(`\n📊 Probando ${table.name} (${table.description})...`);
        
        // Probar consulta de conteo
        const { count, error } = await window.supabase
          .from(table.name)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          console.log(`   ❌ Error en ${table.name}:`, error.message);
          if (error.code) {
            console.log(`   🔍 Código de error:`, error.code);
          }
        } else {
          console.log(`   ✅ Éxito en ${table.name}: ${count} registros`);
          successCount++;
        }
        
        // Probar consulta de datos (solo las primeras 3 filas)
        const { data, error: dataError } = await window.supabase
          .from(table.name)
          .select("*")
          .limit(3);
        
        if (dataError) {
          console.log(`   ❌ Error obteniendo datos de ${table.name}:`, dataError.message);
        } else {
          console.log(`   ✅ Datos obtenidos de ${table.name}: ${data.length} filas`);
          if (data.length > 0) {
            console.log(`   📋 Primera fila:`, data[0]);
          }
        }
        
      } catch (err) {
        console.log(`   ❌ Excepción en ${table.name}:`, err.message);
      }
    }
    
    console.log(`\n📊 RESUMEN DE PRUEBAS:`);
    console.log(`   - Tablas probadas: ${totalCount}`);
    console.log(`   - Accesos exitosos: ${successCount}`);
    console.log(`   - Accesos fallidos: ${totalCount - successCount}`);
    
    if (successCount === totalCount) {
      console.log(`\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!`);
      console.log(`✅ El superadmin puede acceder a todas las tablas`);
    } else if (successCount > 0) {
      console.log(`\n⚠️ Acceso parcial exitoso`);
      console.log(`✅ El superadmin puede acceder a ${successCount}/${totalCount} tablas`);
    } else {
      console.log(`\n❌ Todas las pruebas fallaron`);
      console.log(`❌ El superadmin no puede acceder a ninguna tabla`);
    }
    
    console.log("\n✅ PRUEBA COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarAccesoSuperadmin() - Prueba el acceso del superadmin");
console.log("\n💡 Ejecuta: probarAccesoSuperadmin()");
