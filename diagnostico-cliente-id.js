// Script para diagnosticar el problema de cliente_id
console.log("🔍 DIAGNÓSTICO DE CLIENTE_ID");
console.log("===========================");

// Función para diagnosticar el problema
window.diagnosticarClienteId = async function() {
  try {
    console.log("🔍 Iniciando diagnóstico de cliente_id...");
    
    // Verificar Supabase
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no disponible");
      return;
    }
    
    // Obtener sesión
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Error de sesión:", sessionError);
      return;
    }
    
    if (!session) {
      console.log("❌ No hay sesión activa");
      return;
    }
    
    console.log("✅ Sesión activa:", session.user.email);
    console.log("🆔 User ID:", session.user.id);
    
    // 1. Verificar user_roles
    console.log("\n🔍 Verificando user_roles...");
    const { data: userRole, error: userRoleError } = await window.supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (userRoleError) {
      console.log("❌ Error obteniendo user_roles:", userRoleError);
      return;
    }
    
    console.log("✅ user_roles encontrado:");
    console.log("   - ID:", userRole.id);
    console.log("   - Role:", userRole.role);
    console.log("   - Nombre:", userRole.nombre);
    console.log("   - Cliente ID:", userRole.cliente_id);
    console.log("   - Marca ID:", userRole.marca_id);
    console.log("   - Tier:", userRole.tier);
    
    // 2. Verificar si existe en clientes
    if (userRole.cliente_id) {
      console.log("\n🔍 Verificando tabla clientes...");
      const { data: cliente, error: clienteError } = await window.supabase
        .from('clientes')
        .select('*')
        .eq('id', userRole.cliente_id)
        .single();
      
      if (clienteError) {
        console.log("❌ Error obteniendo cliente:", clienteError);
      } else {
        console.log("✅ Cliente encontrado:");
        console.log("   - ID:", cliente.id);
        console.log("   - Nombre:", cliente.nombre);
        console.log("   - Tier:", cliente.tier);
        console.log("   - Vendedor ID:", cliente.vendedor_id);
        console.log("   - Marca ID:", cliente.marca_id);
      }
    } else {
      console.log("\n⚠️ PROBLEMA IDENTIFICADO:");
      console.log("   - El usuario NO tiene cliente_id asociado");
      console.log("   - Esto impide guardar el carrito en Supabase");
      
      // 3. Verificar si el usuario debería ser cliente
      if (userRole.role === 'cliente') {
        console.log("\n🔧 SOLUCIÓN NECESARIA:");
        console.log("   - El usuario tiene rol 'cliente' pero no tiene cliente_id");
        console.log("   - Necesitamos crear un registro en la tabla 'clientes'");
        
        // Proponer solución
        console.log("\n💡 SOLUCIÓN PROPUESTA:");
        console.log("   1. Crear registro en tabla 'clientes'");
        console.log("   2. Actualizar user_roles con el cliente_id");
        console.log("   3. O cambiar el rol del usuario");
        
        // Mostrar datos para crear cliente
        console.log("\n📝 Datos para crear cliente:");
        console.log("   - ID:", session.user.id);
        console.log("   - Nombre:", userRole.nombre);
        console.log("   - Tier:", userRole.tier || '1');
        console.log("   - Marca ID:", userRole.marca_id);
        
      } else {
        console.log("\n🔧 SOLUCIÓN NECESARIA:");
        console.log("   - El usuario tiene rol:", userRole.role);
        console.log("   - Los usuarios admin/superadmin no necesitan cliente_id");
        console.log("   - Necesitamos modificar la lógica del carrito");
      }
    }
    
    // 4. Verificar todos los usuarios
    console.log("\n🔍 Verificando todos los usuarios...");
    const { data: allUsers, error: allUsersError } = await window.supabase
      .from('user_roles')
      .select('user_id, role, nombre, cliente_id')
      .order('role');
    
    if (allUsersError) {
      console.log("❌ Error obteniendo todos los usuarios:", allUsersError);
      return;
    }
    
    console.log("📊 Resumen de usuarios:");
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nombre} (${user.role}) - Cliente ID: ${user.cliente_id || 'N/A'}`);
    });
    
    console.log("\n--- Diagnóstico completado ---");
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

// Función para crear cliente faltante
window.crearClienteFaltante = async function() {
  try {
    console.log("🔧 Creando cliente faltante...");
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.log("❌ No hay sesión");
      return;
    }
    
    // Obtener datos del usuario
    const { data: userRole, error: userRoleError } = await window.supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (userRoleError || !userRole) {
      console.log("❌ Error obteniendo user_roles:", userRoleError);
      return;
    }
    
    if (userRole.cliente_id) {
      console.log("✅ El usuario ya tiene cliente_id:", userRole.cliente_id);
      return;
    }
    
    if (userRole.role !== 'cliente') {
      console.log("⚠️ El usuario no es cliente, rol:", userRole.role);
      return;
    }
    
    // Crear cliente
    const clienteData = {
      id: session.user.id,
      nombre: userRole.nombre,
      tier: userRole.tier || '1',
      marca_id: userRole.marca_id,
      vendedor_id: null // Se puede asignar después
    };
    
    console.log("📝 Creando cliente con datos:", clienteData);
    
    const { data: newCliente, error: clienteError } = await window.supabase
      .from('clientes')
      .insert(clienteData)
      .select()
      .single();
    
    if (clienteError) {
      console.log("❌ Error creando cliente:", clienteError);
      return;
    }
    
    console.log("✅ Cliente creado:", newCliente);
    
    // Actualizar user_roles con cliente_id
    const { error: updateError } = await window.supabase
      .from('user_roles')
      .update({ cliente_id: session.user.id })
      .eq('user_id', session.user.id);
    
    if (updateError) {
      console.log("❌ Error actualizando user_roles:", updateError);
      return;
    }
    
    console.log("✅ user_roles actualizado con cliente_id");
    console.log("🎉 ¡Cliente creado exitosamente!");
    console.log("💡 Ahora puedes agregar productos al carrito");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIONES DISPONIBLES:");
console.log("   - diagnosticarClienteId() - Diagnostica el problema de cliente_id");
console.log("   - crearClienteFaltante() - Crea el cliente faltante");
console.log("\n💡 Ejecuta: diagnosticarClienteId()");




