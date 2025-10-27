// Script para diagnosticar la estructura de datos de user_roles
console.log("🔍 DIAGNÓSTICO ESTRUCTURA USER_ROLES");
console.log("====================================");

window.diagnosticarEstructuraUserRoles = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de la estructura de user_roles...");
    
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
    
    // Verificar estructura de la tabla user_roles
    console.log("\n🔍 Verificando estructura de la tabla user_roles...");
    
    try {
      const { data: allRoles, error: allRolesError } = await window.supabase
        .from("user_roles")
        .select("*");
      
      if (allRolesError) {
        console.log("❌ Error obteniendo todos los roles:", allRolesError.message);
      } else {
        console.log("✅ Estructura de user_roles:");
        console.log("📋 Columnas disponibles:", Object.keys(allRoles[0] || {}));
        console.log("📊 Total registros:", allRoles.length);
        
        allRoles.forEach((role, index) => {
          console.log(`\n   ${index + 1}. Usuario: ${role.nombre || 'Sin nombre'}`);
          console.log(`      - ID: ${role.id}`);
          console.log(`      - User ID: ${role.user_id}`);
          console.log(`      - Role: ${role.role}`);
          console.log(`      - Cliente ID: ${role.cliente_id}`);
          console.log(`      - Marca ID: ${role.marca_id}`);
          console.log(`      - Tier: ${role.tier} (tipo: ${typeof role.tier})`);
          console.log(`      - Created: ${role.created_at}`);
        });
      }
    } catch (err) {
      console.log("❌ Excepción obteniendo estructura:", err.message);
    }
    
    // Verificar estructura de la tabla tiers
    console.log("\n🔍 Verificando estructura de la tabla tiers...");
    
    try {
      const { data: allTiers, error: allTiersError } = await window.supabase
        .from("tiers")
        .select("*");
      
      if (allTiersError) {
        console.log("❌ Error obteniendo tiers:", allTiersError.message);
      } else {
        console.log("✅ Estructura de tiers:");
        console.log("📋 Columnas disponibles:", Object.keys(allTiers[0] || {}));
        console.log("📊 Total registros:", allTiers.length);
        
        allTiers.forEach((tier, index) => {
          console.log(`\n   ${index + 1}. Tier: ${tier.nombre}`);
          console.log(`      - ID: ${tier.id}`);
          console.log(`      - Número: ${tier.numero} (tipo: ${typeof tier.numero})`);
          console.log(`      - Descripción: ${tier.descripcion}`);
          console.log(`      - Orden: ${tier.orden}`);
        });
      }
    } catch (err) {
      console.log("❌ Excepción obteniendo tiers:", err.message);
    }
    
    // Probar consulta del usuario actual
    console.log("\n🔍 Probando consulta del usuario actual...");
    
    try {
      const { data: currentUserRole, error: currentUserError } = await window.supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (currentUserError) {
        console.log("❌ Error obteniendo rol del usuario actual:", currentUserError.message);
        console.log("🔍 Código:", currentUserError.code);
      } else {
        console.log("✅ Rol del usuario actual:");
        console.log("📋 Datos:", currentUserRole);
        
        if (currentUserRole.tier) {
          console.log("🎯 Tier del usuario:", currentUserRole.tier);
          console.log("🔍 Tipo de tier:", typeof currentUserRole.tier);
        } else {
          console.log("⚠️ Usuario no tiene tier asignado");
        }
      }
    } catch (err) {
      console.log("❌ Excepción obteniendo rol del usuario actual:", err.message);
    }
    
    console.log("\n✅ DIAGNÓSTICO COMPLETADO");
    
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarEstructuraUserRoles() - Diagnostica la estructura de user_roles");
console.log("\n💡 Ejecuta: diagnosticarEstructuraUserRoles()");
