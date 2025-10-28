// Script directo para corregir usuarios existentes
console.log("🔧 CORRECCIÓN AUTOMÁTICA DE USUARIOS EXISTENTES");
console.log("==============================================");

// Función para ejecutar la corrección automáticamente
window.ejecutarCorreccionAutomatica = async function() {
  try {
    console.log("🚀 Ejecutando corrección automática...");
    
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
    
    // 1. Obtener todos los usuarios clientes sin cliente_id
    console.log("\n🔍 Buscando usuarios clientes sin cliente_id...");
    const { data: usuariosSinClienteId, error: usuariosError } = await window.supabase
      .from('user_roles')
      .select('*')
      .is('cliente_id', null)
      .eq('role', 'cliente');
    
    if (usuariosError) {
      console.log("❌ Error obteniendo usuarios:", usuariosError);
      return;
    }
    
    console.log(`📊 Encontrados ${usuariosSinClienteId.length} usuarios clientes sin cliente_id`);
    
    if (usuariosSinClienteId.length === 0) {
      console.log("✅ No hay usuarios que corregir");
      return;
    }
    
    // 2. Mostrar usuarios que se van a corregir
    console.log("\n📋 Usuarios que se van a corregir:");
    usuariosSinClienteId.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.nombre} (${usuario.email})`);
    });
    
    // 3. Corregir todos los usuarios de una vez
    console.log("\n🔧 Iniciando corrección masiva...");
    
    let corregidos = 0;
    let errores = 0;
    
    for (const usuario of usuariosSinClienteId) {
      try {
        console.log(`\n🔧 Procesando: ${usuario.nombre}`);
        
        // Verificar si ya existe en clientes
        const { data: clienteExistente, error: clienteError } = await window.supabase
          .from('clientes')
          .select('*')
          .eq('id', usuario.user_id)
          .single();
        
        if (clienteError && clienteError.code !== 'PGRST116') {
          console.log(`❌ Error verificando cliente: ${clienteError.message}`);
          errores++;
          continue;
        }
        
        if (!clienteExistente) {
          console.log(`📝 Creando cliente faltante...`);
          
          // Crear cliente
          const clienteData = {
            id: usuario.user_id,
            nombre: usuario.nombre,
            tier: usuario.tier || '1',
            marca_id: usuario.marca_id,
            vendedor_id: null
          };
          
          const { error: crearClienteError } = await window.supabase
            .from('clientes')
            .insert(clienteData);
          
          if (crearClienteError) {
            console.log(`❌ Error creando cliente: ${crearClienteError.message}`);
            errores++;
            continue;
          }
          
          console.log(`✅ Cliente creado`);
        } else {
          console.log(`✅ Cliente ya existe`);
        }
        
        // Actualizar user_roles con cliente_id
        const { error: updateError } = await window.supabase
          .from('user_roles')
          .update({ cliente_id: usuario.user_id })
          .eq('user_id', usuario.user_id);
        
        if (updateError) {
          console.log(`❌ Error actualizando user_roles: ${updateError.message}`);
          errores++;
          continue;
        }
        
        console.log(`✅ user_roles actualizado con cliente_id: ${usuario.user_id}`);
        corregidos++;
        
      } catch (error) {
        console.log(`❌ Error procesando ${usuario.nombre}:`, error.message);
        errores++;
      }
    }
    
    // 4. Resumen final
    console.log(`\n📊 RESUMEN DE CORRECCIÓN:`);
    console.log(`   - Usuarios corregidos: ${corregidos}`);
    console.log(`   - Errores: ${errores}`);
    console.log(`   - Total procesados: ${usuariosSinClienteId.length}`);
    
    if (corregidos > 0) {
      console.log(`\n🎉 ¡CORRECCIÓN COMPLETADA EXITOSAMENTE!`);
      console.log(`💡 Los usuarios ahora pueden usar el carrito sin problemas`);
      console.log(`💡 El campo cliente_id ahora está correctamente asignado`);
    }
    
    // 5. Verificación final
    console.log(`\n🔍 Verificación final...`);
    const { data: usuariosCorregidos, error: verifyError } = await window.supabase
      .from('user_roles')
      .select('user_id, nombre, cliente_id')
      .eq('role', 'cliente')
      .not('cliente_id', 'is', null);
    
    if (verifyError) {
      console.log(`❌ Error en verificación: ${verifyError.message}`);
      return;
    }
    
    console.log(`✅ Usuarios clientes con cliente_id: ${usuariosCorregidos.length}`);
    usuariosCorregidos.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.nombre} - Cliente ID: ${usuario.cliente_id}`);
    });
    
    // 6. Verificar que no quedan usuarios sin cliente_id
    const { data: usuariosSinCorregir, error: sinCorregirError } = await window.supabase
      .from('user_roles')
      .select('user_id, nombre')
      .is('cliente_id', null)
      .eq('role', 'cliente');
    
    if (sinCorregirError) {
      console.log(`❌ Error verificando usuarios sin corregir: ${sinCorregirError.message}`);
      return;
    }
    
    if (usuariosSinCorregir.length === 0) {
      console.log(`\n🎉 ¡PERFECTO! Todos los usuarios clientes tienen cliente_id asignado`);
    } else {
      console.log(`\n⚠️ Aún quedan ${usuariosSinCorregir.length} usuarios sin corregir:`);
      usuariosSinCorregir.forEach((usuario, index) => {
        console.log(`   ${index + 1}. ${usuario.nombre}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - ejecutarCorreccionAutomatica() - Ejecuta la corrección automática");
console.log("\n💡 Ejecuta: ejecutarCorreccionAutomatica()");




