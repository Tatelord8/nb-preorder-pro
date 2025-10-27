// Script para probar específicamente la tabla usuarios después de la corrección
console.log("🔍 PRUEBA TABLA USUARIOS POST-CORRECCIÓN");
console.log("========================================");

window.probarTablaUsuarios = async () => {
  try {
    console.log("🔍 Probando acceso a la tabla usuarios después de la corrección...");
    
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
    
    // Probar acceso a la tabla usuarios
    console.log("\n🔍 Probando acceso a la tabla usuarios...");
    
    // Prueba 1: Conteo de usuarios
    console.log("   - Prueba 1: Conteo de usuarios");
    try {
      const { count, error } = await window.supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito:", count, "usuarios encontrados");
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Prueba 2: Obtener todos los usuarios
    console.log("   - Prueba 2: Obtener todos los usuarios");
    try {
      const { data, error } = await window.supabase
        .from("usuarios")
        .select("*");
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito:", data.length, "usuarios obtenidos");
        console.log("     📋 Datos:", data);
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Prueba 3: Obtener usuarios activos
    console.log("   - Prueba 3: Obtener usuarios activos");
    try {
      const { data, error } = await window.supabase
        .from("usuarios")
        .select("id, email, nombre, activo")
        .eq("activo", true);
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito:", data.length, "usuarios activos");
        console.log("     📋 Usuarios activos:", data);
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Prueba 4: Buscar usuario específico por email
    console.log("   - Prueba 4: Buscar usuario por email");
    try {
      const { data, error } = await window.supabase
        .from("usuarios")
        .select("*")
        .eq("email", session.user.email)
        .single();
      
      if (error) {
        console.log("     ❌ Error:", error.message);
        console.log("     🔍 Código:", error.code);
      } else {
        console.log("     ✅ Éxito: Usuario encontrado");
        console.log("     📋 Usuario actual:", data);
      }
    } catch (err) {
      console.log("     ❌ Excepción:", err.message);
    }
    
    // Comparar con otras tablas
    console.log("\n🔍 Comparando con otras tablas...");
    
    const tables = [
      { name: "usuarios", description: "Usuarios" },
      { name: "productos", description: "Productos" },
      { name: "marcas", description: "Marcas" },
      { name: "clientes", description: "Clientes" }
    ];
    
    for (const table of tables) {
      try {
        const { count, error } = await window.supabase
          .from(table.name)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          console.log(`   ❌ ${table.description}: Error -`, error.message);
        } else {
          console.log(`   ✅ ${table.description}: ${count} registros`);
        }
      } catch (err) {
        console.log(`   ❌ ${table.description}: Excepción -`, err.message);
      }
    }
    
    console.log("\n✅ PRUEBA COMPLETADA");
    
  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarTablaUsuarios() - Prueba el acceso a la tabla usuarios");
console.log("\n💡 Ejecuta: probarTablaUsuarios()");
