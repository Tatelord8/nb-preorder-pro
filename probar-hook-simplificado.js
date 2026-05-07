// Script para probar una versión simplificada del hook useCarritos
console.log("🧪 PRUEBA DE HOOK USECARROS SIMPLIFICADO");
console.log("==========================================");

window.probarHookSimplificado = async () => {
  try {
    console.log("🔍 Probando versión simplificada del hook...");

    if (!window.supabase) {
      console.log("❌ Supabase no disponible.");
      return;
    }

    // Versión simplificada sin JOINs complejos
    console.log("\n🔍 1. Consulta simplificada (sin JOINs)...");
    const { data: carritosSimple, error: errorSimple } = await window.supabase
      .from("carritos_pendientes")
      .select(`
        id,
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (errorSimple) {
      console.error("❌ Error en consulta simplificada:", errorSimple);
      return;
    }

    console.log(`✅ Consulta simplificada exitosa: ${carritosSimple?.length || 0} carritos`);

    // Versión con JOINs como en el hook original
    console.log("\n🔍 2. Consulta con JOINs (como en el hook original)...");
    const { data: carritosComplejo, error: errorComplejo } = await window.supabase
      .from("carritos_pendientes")
      .select(`
        id,
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        created_at,
        clientes!inner(nombre, tier, vendedor_id),
        vendedores(nombre)
      `)
      .order('created_at', { ascending: false });

    if (errorComplejo) {
      console.error("❌ Error en consulta con JOINs:", errorComplejo);
      console.log("💡 Este es el problema: el JOIN está fallando");
      return;
    }

    console.log(`✅ Consulta con JOINs exitosa: ${carritosComplejo?.length || 0} carritos`);

    // Comparar resultados
    console.log("\n📊 COMPARACIÓN DE RESULTADOS:");
    console.log(`   - Consulta simplificada: ${carritosSimple?.length || 0} carritos`);
    console.log(`   - Consulta con JOINs: ${carritosComplejo?.length || 0} carritos`);

    if (carritosSimple?.length !== carritosComplejo?.length) {
      console.log("⚠️ DIFERENCIA ENCONTRADA: Los JOINs están filtrando algunos carritos");
      
      // Identificar qué carritos se perdieron
      const idsSimple = carritosSimple?.map(c => c.id) || [];
      const idsComplejo = carritosComplejo?.map(c => c.id) || [];
      const perdidos = idsSimple.filter(id => !idsComplejo.includes(id));
      
      if (perdidos.length > 0) {
        console.log(`   - Carritos perdidos en JOIN: ${perdidos.join(', ')}`);
        
        // Investigar por qué se perdieron
        for (const idPerdido of perdidos) {
          const carritoPerdido = carritosSimple?.find(c => c.id === idPerdido);
          if (carritoPerdido) {
            console.log(`   - Carrito ${idPerdido}: cliente_id = ${carritoPerdido.cliente_id}`);
            
            // Verificar si existe en tabla clientes
            const { data: clienteExiste } = await window.supabase
              .from("clientes")
              .select("id, nombre")
              .eq("id", carritoPerdido.cliente_id)
              .maybeSingle();
            
            console.log(`     - ¿Existe en tabla clientes?: ${clienteExiste ? 'SÍ' : 'NO'}`);
            if (clienteExiste) {
              console.log(`     - Cliente: ${clienteExiste.nombre}`);
            }
          }
        }
      }
    } else {
      console.log("✅ No hay diferencias entre las consultas");
    }

    // Mostrar carritos encontrados
    if (carritosComplejo && carritosComplejo.length > 0) {
      console.log("\n📋 CARRITOS ENCONTRADOS:");
      carritosComplejo.forEach((carrito, index) => {
        console.log(`   ${index + 1}. ${carrito.clientes?.nombre || 'Sin nombre'} - ${carrito.total_items} items`);
      });
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarHookSimplificado() - Prueba versiones simplificada y compleja del hook");
console.log("\n💡 Ejecuta: probarHookSimplificado()");











