// Script para corregir usuarios existentes sin cliente_id
console.log("🔧 CORRECCIÓN DE USUARIOS EXISTENTES SIN CLIENTE_ID");
console.log("=================================================");

// Función para corregir usuarios existentes
window.corregirUsuariosExistentes = async function() {
  try {
    console.log("🔍 Iniciando corrección de usuarios existentes...");
    
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
    
    // 1. Obtener todos los usuarios sin cliente_id
    console.log("\n🔍 Buscando usuarios sin cliente_id...");
    const { data: usuariosSinClienteId, error: usuariosError } = await window.supabase
      .from('user_roles')
      .select('*')
      .is('cliente_id', null)
      .eq('role', 'cliente');
    
    if (usuariosError) {
      console.log("❌ Error obteniendo usuarios:", usuariosError);
      return;
    }
    
    console.log(`📊 Encontrados ${usuariosSinClienteId.length} usuarios sin cliente_id`);
    
    if (usuariosSinClienteId.length === 0) {
      console.log("✅ No hay usuarios que corregir");
      return;
    }
    
    // 2. Mostrar usuarios que necesitan corrección
    console.log("\n📋 Usuarios que necesitan corrección:");
    usuariosSinClienteId.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.nombre} (${usuario.email}) - ID: ${usuario.user_id}`);
    });
    
    // 3. Corregir cada usuario
    let corregidos = 0;
    let errores = 0;
    
    for (const usuario of usuariosSinClienteId) {
      try {
        console.log(`\n🔧 Corrigiendo usuario: ${usuario.nombre}`);
        
        // Verificar si ya existe en clientes
        const { data: clienteExistente, error: clienteError } = await window.supabase
          .from('clientes')
          .select('*')
          .eq('id', usuario.user_id)
          .single();
        
        if (clienteError && clienteError.code !== 'PGRST116') {
          console.log(`❌ Error verificando cliente existente: ${clienteError.message}`);
          errores++;
          continue;
        }
        
        if (clienteExistente) {
          console.log(`✅ Cliente ya existe, solo actualizando user_roles`);
        } else {
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
        
        console.log(`✅ user_roles actualizado con cliente_id`);
        corregidos++;
        
      } catch (error) {
        console.log(`❌ Error procesando usuario ${usuario.nombre}:`, error.message);
        errores++;
      }
    }
    
    // 4. Resumen final
    console.log(`\n📊 RESUMEN DE CORRECCIÓN:`);
    console.log(`   - Usuarios corregidos: ${corregidos}`);
    console.log(`   - Errores: ${errores}`);
    console.log(`   - Total procesados: ${usuariosSinClienteId.length}`);
    
    if (corregidos > 0) {
      console.log(`\n🎉 ¡Corrección completada exitosamente!`);
      console.log(`💡 Los usuarios ahora pueden usar el carrito sin problemas`);
    }
    
    // 5. Verificar corrección
    console.log(`\n🔍 Verificando corrección...`);
    const { data: usuariosCorregidos, error: verifyError } = await window.supabase
      .from('user_roles')
      .select('user_id, nombre, cliente_id')
      .eq('role', 'cliente')
      .not('cliente_id', 'is', null);
    
    if (verifyError) {
      console.log(`❌ Error verificando corrección: ${verifyError.message}`);
      return;
    }
    
    console.log(`✅ Usuarios con cliente_id: ${usuariosCorregidos.length}`);
    usuariosCorregidos.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.nombre} - Cliente ID: ${usuario.cliente_id}`);
    });
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

// Función para verificar el estado actual
window.verificarEstadoUsuarios = async function() {
  try {
    console.log("🔍 Verificando estado actual de usuarios...");
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.log("❌ No hay sesión");
      return;
    }
    
    // Obtener todos los usuarios
    const { data: todosUsuarios, error: usuariosError } = await window.supabase
      .from('user_roles')
      .select('user_id, nombre, role, cliente_id')
      .order('role');
    
    if (usuariosError) {
      console.log("❌ Error obteniendo usuarios:", usuariosError);
      return;
    }
    
    console.log(`📊 Total de usuarios: ${todosUsuarios.length}`);
    console.log(`\n📋 Estado por rol:`);
    
    const porRol = todosUsuarios.reduce((acc, usuario) => {
      if (!acc[usuario.role]) {
        acc[usuario.role] = { total: 0, conClienteId: 0, sinClienteId: 0 };
      }
      acc[usuario.role].total++;
      if (usuario.cliente_id) {
        acc[usuario.role].conClienteId++;
      } else {
        acc[usuario.role].sinClienteId++;
      }
      return acc;
    }, {});
    
    Object.entries(porRol).forEach(([rol, stats]) => {
      console.log(`   ${rol}:`);
      console.log(`     - Total: ${stats.total}`);
      console.log(`     - Con cliente_id: ${stats.conClienteId}`);
      console.log(`     - Sin cliente_id: ${stats.sinClienteId}`);
    });
    
    // Mostrar usuarios problemáticos
    const usuariosProblematicos = todosUsuarios.filter(u => u.role === 'cliente' && !u.cliente_id);
    if (usuariosProblematicos.length > 0) {
      console.log(`\n⚠️ Usuarios clientes sin cliente_id:`);
      usuariosProblematicos.forEach((usuario, index) => {
        console.log(`   ${index + 1}. ${usuario.nombre} (${usuario.user_id})`);
      });
    } else {
      console.log(`\n✅ Todos los usuarios clientes tienen cliente_id`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

console.log("\n🚀 FUNCIONES DISPONIBLES:");
console.log("   - verificarEstadoUsuarios() - Verifica el estado actual de usuarios");
console.log("   - corregirUsuariosExistentes() - Corrige usuarios existentes sin cliente_id");
console.log("\n💡 Ejecuta: verificarEstadoUsuarios()");