// Script para aplicar la migración de carritos desde el frontend
// Este script ejecuta los comandos SQL necesarios para corregir la estructura

console.log("🔧 APLICANDO MIGRACIÓN DE CARRITOS DESDE FRONTEND");
console.log("================================================");

window.aplicarMigracionCarritosFrontend = async function() {
  try {
    console.log("🚀 Iniciando aplicación de migración...");
    
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no disponible");
      return false;
    }
    
    // Verificar si ya está aplicada
    const estructuraOk = await window.verificarEstructuraCarritos();
    if (estructuraOk) {
      console.log("✅ Migración ya aplicada - Estructura correcta");
      return true;
    }
    
    console.log("⚠️ Aplicando migración...");
    
    // 1. Agregar campos faltantes
    console.log("📝 1. Agregando campos faltantes...");
    
    const alterQueries = [
      "ALTER TABLE carritos_pendientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)",
      "ALTER TABLE carritos_pendientes ADD COLUMN IF NOT EXISTS items JSONB",
      "ALTER TABLE carritos_pendientes ADD COLUMN IF NOT EXISTS total_items INTEGER",
      "ALTER TABLE carritos_pendientes ADD COLUMN IF NOT EXISTS total_unidades INTEGER",
      "ALTER TABLE carritos_pendientes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE"
    ];
    
    for (const query of alterQueries) {
      try {
        const { error } = await window.supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️ Error ejecutando: ${query}`, error);
          // Continuar con los siguientes
        } else {
          console.log(`✅ Ejecutado: ${query}`);
        }
      } catch (e) {
        console.log(`⚠️ Error en query: ${query}`, e);
      }
    }
    
    // 2. Crear índices
    console.log("📝 2. Creando índices...");
    
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_user_id ON carritos_pendientes(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_carritos_pendientes_expires_at ON carritos_pendientes(expires_at)"
    ];
    
    for (const query of indexQueries) {
      try {
        const { error } = await window.supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️ Error ejecutando: ${query}`, error);
        } else {
          console.log(`✅ Ejecutado: ${query}`);
        }
      } catch (e) {
        console.log(`⚠️ Error en query: ${query}`, e);
      }
    }
    
    // 3. Verificar resultado
    console.log("🔍 3. Verificando resultado...");
    const nuevaEstructuraOk = await window.verificarEstructuraCarritos();
    
    if (nuevaEstructuraOk) {
      console.log("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE");
      return true;
    } else {
      console.log("❌ Migración incompleta - Verificar manualmente");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error aplicando migración:", error);
    return false;
  }
};

// Función alternativa usando SQL directo (si rpc no está disponible)
window.aplicarMigracionSQLDirecto = async function() {
  try {
    console.log("🔧 Aplicando migración usando SQL directo...");
    
    // Nota: Esta función requiere que el usuario tenga permisos de administrador
    // y que la función exec_sql esté disponible en Supabase
    
    const migrationSQL = `
-- Migración completa de carritos_pendientes
DO $$
BEGIN
  -- Agregar campos faltantes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carritos_pendientes' AND column_name = 'user_id') THEN
    ALTER TABLE carritos_pendientes ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carritos_pendientes' AND column_name = 'items') THEN
    ALTER TABLE carritos_pendientes ADD COLUMN items JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carritos_pendientes' AND column_name = 'total_items') THEN
    ALTER TABLE carritos_pendientes ADD COLUMN total_items INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carritos_pendientes' AND column_name = 'total_unidades') THEN
    ALTER TABLE carritos_pendientes ADD COLUMN total_unidades INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carritos_pendientes' AND column_name = 'expires_at') THEN
    ALTER TABLE carritos_pendientes ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Crear índices si no existen
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'carritos_pendientes' AND indexname = 'idx_carritos_pendientes_user_id') THEN
    CREATE INDEX idx_carritos_pendientes_user_id ON carritos_pendientes(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'carritos_pendientes' AND indexname = 'idx_carritos_pendientes_expires_at') THEN
    CREATE INDEX idx_carritos_pendientes_expires_at ON carritos_pendientes(expires_at);
  END IF;
  
  RAISE NOTICE 'Migración de carritos_pendientes completada exitosamente';
END $$;
    `;
    
    console.log("📝 SQL de migración preparado");
    console.log("⚠️ IMPORTANTE: Ejecutar este SQL en Supabase Dashboard:");
    console.log("   1. Ir a Supabase Dashboard > SQL Editor");
    console.log("   2. Pegar el siguiente SQL:");
    console.log("   3. Ejecutar");
    
    console.log("\n📋 SQL A EJECUTAR:");
    console.log(migrationSQL);
    
    return false; // Requiere ejecución manual
    
  } catch (error) {
    console.error("❌ Error preparando migración:", error);
    return false;
  }
};

// Función para migrar datos existentes del formato antiguo al nuevo
window.migrarDatosCarritosExistentes = async function() {
  try {
    console.log("🔄 Migrando datos existentes del formato antiguo al nuevo...");
    
    // Verificar si hay datos en formato antiguo
    const { data: oldFormatData, error: oldFormatError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .is('user_id', null)
      .limit(1);
    
    if (oldFormatError) {
      console.log("❌ Error verificando formato antiguo:", oldFormatError);
      return false;
    }
    
    if (!oldFormatData || oldFormatData.length === 0) {
      console.log("✅ No hay datos en formato antiguo para migrar");
      return true;
    }
    
    console.log("⚠️ Datos en formato antiguo encontrados - Iniciando migración...");
    
    // Obtener todos los datos en formato antiguo
    const { data: allOldData, error: allOldError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .is('user_id', null);
    
    if (allOldError) {
      console.log("❌ Error obteniendo datos antiguos:", allOldError);
      return false;
    }
    
    console.log(`📊 Encontrados ${allOldData.length} registros en formato antiguo`);
    
    // Agrupar por cliente_id
    const groupedData = {};
    allOldData.forEach(item => {
      if (!groupedData[item.cliente_id]) {
        groupedData[item.cliente_id] = [];
      }
      groupedData[item.cliente_id].push(item);
    });
    
    console.log(`📦 Agrupados en ${Object.keys(groupedData).length} carritos`);
    
    // Migrar cada grupo
    for (const [clienteId, items] of Object.entries(groupedData)) {
      console.log(`🔄 Migrando carrito para cliente: ${clienteId}`);
      
      // Convertir a nuevo formato
      const newItems = items.map(item => ({
        productoId: item.producto_id,
        curvaId: item.curva_id,
        cantidadCurvas: item.cantidad_curvas,
        talles: item.talles,
        type: item.tipo,
        genero: item.genero,
        opcion: item.opcion,
        precio_usd: item.precio_usd
      }));
      
      const totalItems = newItems.length;
      const totalUnidades = newItems.reduce((total, item) => {
        return total + Object.values(item.talles || {}).reduce((sum, cantidad) => sum + cantidad, 0);
      }, 0);
      
      const newCartData = {
        user_id: clienteId, // Usar cliente_id como user_id temporalmente
        cliente_id: clienteId,
        items: newItems,
        total_items: totalItems,
        total_unidades: totalUnidades,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Insertar nuevo registro
      const { data: insertData, error: insertError } = await window.supabase
        .from('carritos_pendientes')
        .upsert(newCartData)
        .select();
      
      if (insertError) {
        console.log(`❌ Error insertando carrito para ${clienteId}:`, insertError);
        continue;
      }
      
      console.log(`✅ Carrito migrado para ${clienteId}:`, insertData);
      
      // Eliminar registros antiguos
      const { error: deleteError } = await window.supabase
        .from('carritos_pendientes')
        .delete()
        .eq('cliente_id', clienteId)
        .is('user_id', null);
      
      if (deleteError) {
        console.log(`⚠️ Error eliminando registros antiguos para ${clienteId}:`, deleteError);
      } else {
        console.log(`✅ Registros antiguos eliminados para ${clienteId}`);
      }
    }
    
    console.log("🎉 Migración de datos completada");
    return true;
    
  } catch (error) {
    console.error("❌ Error migrando datos:", error);
    return false;
  }
};

console.log("📋 Funciones disponibles:");
console.log("  - aplicarMigracionCarritosFrontend()");
console.log("  - aplicarMigracionSQLDirecto()");
console.log("  - migrarDatosCarritosExistentes()");
console.log("\n🚀 Ejecutar: aplicarMigracionCarritosFrontend()");


