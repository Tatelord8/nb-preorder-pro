// Script específico para diagnosticar problemas con la tabla usuarios
console.log("🔍 DIAGNÓSTICO TABLA USUARIOS");
console.log("=============================");

window.diagnosticarTablaUsuarios = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico específico de la tabla usuarios...");
    
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
      return;
    }
    
    console.log("✅ Datos del usuario:");
    console.log("   - Role:", userRole.role);
    console.log("   - Nombre:", userRole.nombre);
    console.log("   - Cliente ID:", userRole.cliente_id);
    
    // Probar diferentes enfoques para acceder a la tabla usuarios
    console.log("\n🔍 Probando diferentes enfoques para la tabla usuarios...");
    
    // Enfoque 1: Consulta simple de conteo
    console.log("   - Enfoque 1: Consulta simple de conteo");
    try {
      const { count, error } = await window.supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
        console.log("     🔍 Detalles:", error.details);
        console.log("     🔍 Hint:", error.hint);
      } else {
        console.log("     ✅ Éxito:", count, "registros");
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Enfoque 2: Consulta con columnas específicas
    console.log("   - Enfoque 2: Consulta con columnas específicas");
    try {
      const { data, error } = await window.supabase
        .from("usuarios")
        .select("id, email, nombre, activo")
        .limit(5);
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito:", data.length, "filas");
        if (data.length > 0) {
          console.log("     📋 Datos:", data);
        }
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Enfoque 3: Consulta con filtro
    console.log("   - Enfoque 3: Consulta con filtro");
    try {
      const { data, error } = await window.supabase
        .from("usuarios")
        .select("*")
        .eq("activo", true)
        .limit(3);
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito:", data.length, "filas");
        if (data.length > 0) {
          console.log("     📋 Datos:", data);
        }
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Enfoque 4: Verificar estructura de la tabla
    console.log("   - Enfoque 4: Verificar estructura de la tabla");
    try {
      const { data, error } = await window.supabase
        .from("usuarios")
        .select("*")
        .limit(1);
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito: Tabla accesible");
        if (data.length > 0) {
          console.log("     📋 Estructura de la primera fila:", Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Comparar con otras tablas que funcionan
    console.log("\n🔍 Comparando con otras tablas que funcionan...");
    
    const workingTables = ["productos", "marcas", "clientes"];
    
    for (const tableName of workingTables) {
      try {
        const { count, error } = await window.supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          console.log(`   ❌ ${tableName}: Error -`, error.message);
        } else {
          console.log(`   ✅ ${tableName}: ${count} registros`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Excepción -`, err.message);
      }
    }
    
    // Verificar políticas RLS específicas
    console.log("\n🔍 Verificando políticas RLS específicas...");
    try {
      // Intentar una operación que requiera permisos específicos
      const { data, error } = await window.supabase
        .from("usuarios")
        .insert({ email: "test@test.com", nombre: "Test User" })
        .select();
      
      if (error) {
        console.log("   ❌ Error en INSERT (esperado):", error.message);
        console.log("   🔍 Código:", error.code);
      } else {
        console.log("   ✅ INSERT exitoso (inesperado):", data);
      }
    } catch (err) {
      console.log("   ❌ Excepción en INSERT:", err.message);
    }
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarTablaUsuarios() - Diagnostica problemas con la tabla usuarios");
console.log("\n💡 Ejecuta: diagnosticarTablaUsuarios()");
