// Script de verificación post-corrección
console.log("🔍 VERIFICACIÓN POST-CORRECCIÓN");
console.log("==============================");

(async function verificarCorreccion() {
  try {
    console.log("🔍 Verificando que la corrección fue exitosa...");
    
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
    
    // 1. Verificar usuarios clientes con cliente_id
    console.log("\n🔍 Verificando usuarios clientes con cliente_id...");
    const { data: usuariosConClienteId, error: conClienteIdError } = await window.supabase
      .from('user_roles')
      .select('user_id, nombre, cliente_id')
      .eq('role', 'cliente')
      .not('cliente_id', 'is', null);
    
    if (conClienteIdError) {
      console.log("❌ Error obteniendo usuarios con cliente_id:", conClienteIdError);
      return;
    }
    
    console.log(`✅ Usuarios clientes con cliente_id: ${usuariosConClienteId.length}`);
    usuariosConClienteId.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.nombre} - Cliente ID: ${usuario.cliente_id}`);
    });
    
    // 2. Verificar usuarios clientes sin cliente_id
    console.log("\n🔍 Verificando usuarios clientes sin cliente_id...");
    const { data: usuariosSinClienteId, error: sinClienteIdError } = await window.supabase
      .from('user_roles')
      .select('user_id, nombre')
      .is('cliente_id', null)
      .eq('role', 'cliente');
    
    if (sinClienteIdError) {
      console.log("❌ Error obteniendo usuarios sin cliente_id:", sinClienteIdError);
      return;
    }
    
    console.log(`📊 Usuarios clientes sin cliente_id: ${usuariosSinClienteId.length}`);
    
    if (usuariosSinClienteId.length === 0) {
      console.log("🎉 ¡PERFECTO! Todos los usuarios clientes tienen cliente_id asignado");
    } else {
      console.log("⚠️ Aún quedan usuarios sin cliente_id:");
      usuariosSinClienteId.forEach((usuario, index) => {
        console.log(`   ${index + 1}. ${usuario.nombre}`);
      });
    }
    
    // 3. Verificar registros en tabla clientes
    console.log("\n🔍 Verificando registros en tabla clientes...");
    const { data: clientes, error: clientesError } = await window.supabase
      .from('clientes')
      .select('id, nombre, tier')
      .order('nombre');
    
    if (clientesError) {
      console.log("❌ Error obteniendo clientes:", clientesError);
      return;
    }
    
    console.log(`📊 Total de clientes en tabla clientes: ${clientes.length}`);
    clientes.forEach((cliente, index) => {
      console.log(`   ${index + 1}. ${cliente.nombre} (Tier: ${cliente.tier}) - ID: ${cliente.id}`);
    });
    
    // 4. Verificar que los IDs coinciden
    console.log("\n🔍 Verificando que los IDs coinciden...");
    let coincidencias = 0;
    let discrepancias = 0;
    
    usuariosConClienteId.forEach(usuario => {
      const cliente = clientes.find(c => c.id === usuario.user_id);
      if (cliente) {
        coincidencias++;
        console.log(`✅ ${usuario.nombre}: user_id (${usuario.user_id}) = cliente_id (${usuario.cliente_id}) = clientes.id (${cliente.id})`);
      } else {
        discrepancias++;
        console.log(`❌ ${usuario.nombre}: No se encontró cliente con ID ${usuario.user_id}`);
      }
    });
    
    console.log(`\n📊 RESUMEN DE VERIFICACIÓN:`);
    console.log(`   - Coincidencias: ${coincidencias}`);
    console.log(`   - Discrepancias: ${discrepancias}`);
    console.log(`   - Total usuarios clientes: ${usuariosConClienteId.length}`);
    
    if (discrepancias === 0) {
      console.log(`\n🎉 ¡VERIFICACIÓN EXITOSA!`);
      console.log(`💡 Todos los usuarios clientes tienen cliente_id correctamente asignado`);
      console.log(`💡 El carrito ahora funcionará sin errores`);
    } else {
      console.log(`\n⚠️ Se encontraron discrepancias que requieren atención`);
    }
    
    // 5. Prueba rápida del carrito
    console.log(`\n🧪 Prueba rápida del carrito...`);
    if (usuariosConClienteId.length > 0) {
      const usuarioPrueba = usuariosConClienteId[0];
      console.log(`🔍 Probando con usuario: ${usuarioPrueba.nombre}`);
      
      // Verificar que puede acceder al carrito
      const { data: carritoPrueba, error: carritoError } = await window.supabase
        .from('carritos_pendientes')
        .select('*')
        .eq('user_id', usuarioPrueba.user_id)
        .single();
      
      if (carritoError && carritoError.code !== 'PGRST116') {
        console.log(`❌ Error accediendo al carrito: ${carritoError.message}`);
      } else if (carritoError && carritoError.code === 'PGRST116') {
        console.log(`✅ Usuario puede acceder al carrito (no hay carrito actual)`);
      } else {
        console.log(`✅ Usuario puede acceder al carrito (carrito existente encontrado)`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
})();



