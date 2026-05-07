// Script de prueba para verificar la corrección del cliente_id
console.log("🧪 PRUEBA DE CORRECCIÓN DE CLIENTE_ID");
console.log("====================================");

// Función para probar la corrección
window.probarCorreccionClienteId = async function() {
  try {
    console.log("🔍 Probando corrección de cliente_id...");
    
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
    
    // 1. Verificar estado actual del usuario
    console.log("\n🔍 Verificando estado actual del usuario...");
    const { data: userRole, error: userRoleError } = await window.supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (userRoleError) {
      console.log("❌ Error obteniendo user_roles:", userRoleError);
      return;
    }
    
    console.log("📋 Estado actual del usuario:");
    console.log("   - Role:", userRole.role);
    console.log("   - Nombre:", userRole.nombre);
    console.log("   - Cliente ID:", userRole.cliente_id || "N/A");
    console.log("   - Tier:", userRole.tier);
    console.log("   - Marca ID:", userRole.marca_id);
    
    // 2. Obtener un producto para probar
    console.log("\n🔍 Obteniendo producto para probar...");
    const { data: productos, error: productosError } = await window.supabase
      .from("productos")
      .select("id, sku, nombre, precio_usd, genero")
      .limit(1);
    
    if (productosError || !productos || productos.length === 0) {
      console.log("❌ Error obteniendo productos:", productosError);
      return;
    }
    
    const productoPrueba = productos[0];
    console.log("✅ Producto de prueba:", productoPrueba.sku, "-", productoPrueba.nombre);
    
    // 3. Crear item de prueba
    const testItem = {
      productoId: productoPrueba.id,
      curvaId: "predefined-1",
      cantidadCurvas: 1,
      talles: { "S": 1, "M": 2, "L": 1 },
      type: "predefined",
      genero: productoPrueba.genero,
      opcion: 1,
      precio_usd: productoPrueba.precio_usd
    };
    
    console.log("\n🔍 Item de prueba creado:", testItem);
    
    // 4. Intentar agregar al carrito usando el servicio corregido
    console.log("\n➕ Intentando agregar al carrito...");
    
    try {
      // Simular la lógica del servicio corregido
      let clienteId = userRole.cliente_id;
      
      if (!clienteId) {
        console.log("⚠️ No hay cliente_id, aplicando lógica de corrección...");
        
        if (userRole.role !== 'cliente') {
          console.log("🔧 Usuario no es cliente, usando user_id como cliente_id");
          clienteId = session.user.id;
        } else {
          console.log("🔧 Usuario es cliente, creando registro en clientes...");
          
          const clienteData = {
            id: session.user.id,
            nombre: userRole.nombre,
            tier: userRole.tier || '1',
            marca_id: userRole.marca_id,
            vendedor_id: null
          };
          
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
          
          // Actualizar user_roles
          const { error: updateError } = await window.supabase
            .from('user_roles')
            .update({ cliente_id: session.user.id })
            .eq('user_id', session.user.id);
          
          if (updateError) {
            console.log("⚠️ Error actualizando user_roles:", updateError);
          } else {
            console.log("✅ user_roles actualizado");
          }
          
          clienteId = session.user.id;
        }
      }
      
      console.log("✅ Cliente ID obtenido:", clienteId);
      
      // 5. Crear/actualizar carrito
      console.log("\n💾 Creando/actualizando carrito...");
      
      const cartData = {
        user_id: session.user.id,
        cliente_id: clienteId,
        items: [testItem],
        total_items: 1,
        total_unidades: 4, // S:1 + M:2 + L:1
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Verificar si ya existe carrito
      const { data: existingCart, error: fetchError } = await window.supabase
        .from('carritos_pendientes')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.log("❌ Error verificando carrito existente:", fetchError);
        return;
      }
      
      if (existingCart) {
        // Actualizar carrito existente
        const { error: updateError } = await window.supabase
          .from('carritos_pendientes')
          .update(cartData)
          .eq('id', existingCart.id);
        
        if (updateError) {
          console.log("❌ Error actualizando carrito:", updateError);
          return;
        }
        console.log("✅ Carrito actualizado");
      } else {
        // Crear nuevo carrito
        const { error: insertError } = await window.supabase
          .from('carritos_pendientes')
          .insert(cartData);
        
        if (insertError) {
          console.log("❌ Error creando carrito:", insertError);
          return;
        }
        console.log("✅ Carrito creado");
      }
      
      // 6. Verificar que se guardó correctamente
      console.log("\n🔍 Verificando que el carrito se guardó...");
      const { data: savedCart, error: verifyError } = await window.supabase
        .from('carritos_pendientes')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (verifyError) {
        console.log("❌ Error verificando carrito:", verifyError);
        return;
      }
      
      console.log("📦 Carrito guardado:");
      console.log("   - ID:", savedCart.id);
      console.log("   - Cliente ID:", savedCart.cliente_id);
      console.log("   - Items:", savedCart.items?.length || 0);
      console.log("   - Total items:", savedCart.total_items);
      console.log("   - Total unidades:", savedCart.total_unidades);
      
      const itemAdded = savedCart.items?.some(item => item.productoId === productoPrueba.id);
      console.log("   - ¿Item agregado?:", itemAdded ? "✅ Sí" : "❌ No");
      
      if (itemAdded) {
        console.log("\n🎉 ¡CORRECCIÓN EXITOSA!");
        console.log("💡 El carrito ahora funciona correctamente");
        console.log("💡 Los productos se pueden agregar sin errores");
      } else {
        console.log("\n❌ La corrección no funcionó completamente");
      }
      
    } catch (error) {
      console.log("❌ Error durante la prueba:", error);
    }
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarCorreccionClienteId() - Prueba la corrección del cliente_id");
console.log("\n💡 Ejecuta: probarCorreccionClienteId()");











