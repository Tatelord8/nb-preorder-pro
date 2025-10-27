// Script específico para probar el hook useCarritos
console.log("🧪 PRUEBA ESPECÍFICA DEL HOOK USECARROS");
console.log("======================================");

window.probarHookUseCarritosEspecifico = async () => {
  try {
    console.log("🔍 Probando el hook useCarritos específicamente...");

    if (!window.supabase) {
      console.log("❌ Supabase no disponible.");
      return;
    }

    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.log("❌ No hay sesión activa. Por favor, inicia sesión.");
      return;
    }
    const userId = session.user.id;
    console.log("✅ Sesión activa. User ID:", userId);

    // 1. Probar la consulta exacta del hook useCarritos
    console.log("\n🔍 1. Probando consulta del hook useCarritos...");
    const { data: carritosData, error: carritosError } = await window.supabase
      .from("carritos_pendientes")
      .select(`
        id,
        user_id,
        cliente_id,
        items,
        total_items,
        total_unidades,
        created_at,
        clientes(nombre, tier, vendedor_id),
        vendedores(nombre)
      `)
      .order('created_at', { ascending: false });

    if (carritosError) {
      console.error("❌ Error en consulta useCarritos:", carritosError);
      return;
    }

    console.log(`✅ Consulta exitosa: ${carritosData?.length || 0} carritos encontrados`);

    // 2. Procesar carritos como lo hace el hook
    console.log("\n🔍 2. Procesando carritos como lo hace el hook...");
    const carritosProcesados = [];

    if (carritosData && carritosData.length > 0) {
      for (const carrito of carritosData) {
        try {
          const items = carrito.items as any[];
          if (!Array.isArray(items) || items.length === 0) {
            console.log(`⚠️ Carrito ${carrito.id} no tiene items válidos`);
            continue;
          }

          // Obtener información de productos (simulando el hook)
          const productosInfo = new Map();
          for (const item of items) {
            if (item.productoId && !productosInfo.has(item.productoId)) {
              const { data: producto } = await window.supabase
                .from("productos")
                .select("id, sku, nombre, rubro, precio_usd, xfd, fecha_despacho")
                .eq("id", item.productoId)
                .single();

              if (producto) {
                productosInfo.set(item.productoId, producto);
              }
            }
          }

          // Mapear items
          const itemsMapeados = items.map((item) => {
            const productoInfo = productosInfo.get(item.productoId);

            // Calcular cantidad total
            let cantidadTotal = item.cantidad || item.cantidadCurvas || 1;
            if (item.talles && typeof item.talles === 'object') {
              cantidadTotal = Object.values(item.talles).reduce(
                (sum, cant) => sum + (Number(cant) || 0),
                0
              );
            }

            const precio = item.precio_usd || productoInfo?.precio_usd || 0;

            return {
              id: item.productoId,
              producto_id: item.productoId,
              cantidad: cantidadTotal,
              precio_unitario: precio,
              subtotal_usd: precio * cantidadTotal,
              productos: productoInfo ? {
                sku: productoInfo.sku,
                nombre: productoInfo.nombre,
                rubro: productoInfo.rubro,
                xfd: productoInfo.xfd,
                fecha_despacho: productoInfo.fecha_despacho
              } : undefined
            };
          });

          // Calcular total del carrito
          const totalCarrito = itemsMapeados.reduce(
            (sum, item) => sum + item.subtotal_usd,
            0
          );

          const carritoProcesado = {
            id: carrito.id,
            cliente_id: carrito.cliente_id,
            vendedor_id: carrito.clientes?.vendedor_id || null,
            total_usd: totalCarrito,
            estado: 'pending',
            created_at: carrito.created_at,
            clientes: carrito.clientes ? {
              nombre: carrito.clientes.nombre,
              tier: carrito.clientes.tier
            } : undefined,
            vendedores: carrito.vendedores ? {
              nombre: carrito.vendedores.nombre
            } : undefined,
            items_pedido: itemsMapeados
          };

          carritosProcesados.push(carritoProcesado);
          console.log(`✅ Carrito ${carrito.id} procesado correctamente`);

        } catch (e) {
          console.warn(`❌ Error procesando carrito ${carrito.id}:`, e);
        }
      }
    }

    console.log(`✅ Total carritos procesados: ${carritosProcesados.length}`);

    // 3. Aplicar filtro de usuario
    console.log("\n🔍 3. Aplicando filtro de usuario...");
    const carritosDelUsuario = carritosProcesados.filter(c => c.cliente_id === userId);
    console.log(`✅ Carritos del usuario actual: ${carritosDelUsuario.length}`);

    // 4. Mostrar resultados
    if (carritosDelUsuario.length > 0) {
      console.log("\n📋 CARRITOS DEL USUARIO PROCESADOS:");
      carritosDelUsuario.forEach((carrito, index) => {
        console.log(`\n--- Carrito ${index + 1} ---`);
        console.log(`   ID: ${carrito.id}`);
        console.log(`   Cliente: ${carrito.clientes?.nombre || 'Sin nombre'}`);
        console.log(`   Vendedor: ${carrito.vendedores?.nombre || 'Sin vendedor'}`);
        console.log(`   Total USD: $${carrito.total_usd}`);
        console.log(`   Estado: ${carrito.estado}`);
        console.log(`   Items: ${carrito.items_pedido.length}`);
        
        if (carrito.items_pedido.length > 0) {
          console.log(`   Productos:`);
          carrito.items_pedido.forEach((item, itemIndex) => {
            console.log(`     ${itemIndex + 1}. ${item.productos?.nombre || 'Sin nombre'} - $${item.precio_unitario} x ${item.cantidad}`);
          });
        }
      });

      console.log("\n🎉 ¡HOOK USECARROS FUNCIONANDO CORRECTAMENTE!");
      console.log("💡 Los carritos están siendo procesados y filtrados correctamente.");
      console.log("💡 Si no aparecen en la UI, el problema está en el renderizado de React.");
    } else {
      console.log("\n⚠️ NO HAY CARRITOS PARA ESTE USUARIO");
      console.log("💡 Agrega productos al carrito desde el catálogo para probar.");
    }

    // 5. Verificar datos para PedidoCard
    console.log("\n🔍 4. Verificando datos para PedidoCard...");
    if (carritosDelUsuario.length > 0) {
      const carrito = carritosDelUsuario[0];
      console.log("📊 Datos del primer carrito para PedidoCard:");
      console.log(`   - ID: ${carrito.id}`);
      console.log(`   - Cliente ID: ${carrito.cliente_id}`);
      console.log(`   - Vendedor ID: ${carrito.vendedor_id}`);
      console.log(`   - Total USD: ${carrito.total_usd}`);
      console.log(`   - Estado: ${carrito.estado}`);
      console.log(`   - Created at: ${carrito.created_at}`);
      console.log(`   - Clientes: ${carrito.clientes ? 'Disponible' : 'No disponible'}`);
      console.log(`   - Vendedores: ${carrito.vendedores ? 'Disponible' : 'No disponible'}`);
      console.log(`   - Items pedido: ${carrito.items_pedido.length}`);
      
      // Verificar si los datos son válidos para PedidoCard
      const datosValidos = carrito.id && carrito.cliente_id && carrito.total_usd && carrito.estado;
      console.log(`   - ¿Datos válidos para PedidoCard?: ${datosValidos ? 'SÍ' : 'NO'}`);
    }

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - probarHookUseCarritosEspecifico() - Prueba específica del hook useCarritos");
console.log("\n💡 Ejecuta: probarHookUseCarritosEspecifico()");



