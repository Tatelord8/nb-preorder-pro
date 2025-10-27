// Script final para verificar que el superadmin pueda ver todos los datos
console.log("🔍 VERIFICACIÓN FINAL SUPERADMIN");
console.log("===============================");

window.verificacionFinalSuperadmin = async () => {
  try {
    console.log("🔍 Iniciando verificación final del superadmin...");
    
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
    
    // Verificar rol del usuario usando la consulta corregida
    console.log("\n🔍 Verificando rol del usuario (consulta corregida)...");
    
    try {
      const { data: userRole, error } = await window.supabase
        .from("user_roles")
        .select("role, nombre, cliente_id")
        .eq("user_id", session.user.id)
        .single();
      
      if (error) {
        console.log("❌ Error obteniendo rol:", error.message);
        console.log("🔍 Código:", error.code);
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
      
    } catch (err) {
      console.log("❌ Excepción obteniendo rol:", err.message);
      return;
    }
    
    // Verificar acceso a todas las tablas principales
    console.log("\n🔍 Verificando acceso a todas las tablas principales...");
    
    const testTables = [
      { name: "usuarios", description: "Usuarios" },
      { name: "productos", description: "Productos" },
      { name: "marcas", description: "Marcas" },
      { name: "clientes", description: "Clientes" },
      { name: "pedidos", description: "Pedidos" },
      { name: "items_pedido", description: "Items de pedidos" },
      { name: "carritos_pendientes", description: "Carritos pendientes" },
      { name: "vendedores", description: "Vendedores" },
      { name: "user_roles", description: "Roles de usuarios" }
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
          console.log(`   🔍 Código:`, error.code);
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
        }
        
      } catch (err) {
        console.log(`   ❌ Excepción en ${table.name}:`, err.message);
      }
    }
    
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`   - Tablas probadas: ${totalCount}`);
    console.log(`   - Accesos exitosos: ${successCount}`);
    console.log(`   - Accesos fallidos: ${totalCount - successCount}`);
    
    if (successCount === totalCount) {
      console.log(`\n🎉 ¡VERIFICACIÓN COMPLETAMENTE EXITOSA!`);
      console.log(`✅ El superadmin puede acceder a TODAS las tablas`);
      console.log(`✅ El problema de userRole está resuelto`);
      console.log(`✅ El Dashboard debería mostrar todos los datos`);
    } else if (successCount > 0) {
      console.log(`\n⚠️ Verificación parcialmente exitosa`);
      console.log(`✅ El superadmin puede acceder a ${successCount}/${totalCount} tablas`);
    } else {
      console.log(`\n❌ Todas las verificaciones fallaron`);
      console.log(`❌ El superadmin no puede acceder a ninguna tabla`);
    }
    
    console.log("\n✅ VERIFICACIÓN FINAL COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la verificación final:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - verificacionFinalSuperadmin() - Verificación final del superadmin");
console.log("\n💡 Ejecuta: verificacionFinalSuperadmin()");
