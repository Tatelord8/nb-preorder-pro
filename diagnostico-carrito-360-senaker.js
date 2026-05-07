// Script de diagnóstico para encontrar el carrito del Cliente 360 Senaker
// Ejecutar en la consola del navegador en el sitio desplegado

console.log("🔍 DIAGNÓSTICO: Buscando carrito del Cliente 360 Senaker");
console.log("========================================================");

// Función principal de diagnóstico
window.diagnosticarCarrito360Senaker = async function() {
  try {
    console.log("🚀 Iniciando diagnóstico completo...");
    
    // Verificar Supabase
    if (typeof window.supabase === 'undefined') {
      console.log("❌ Supabase no disponible en window.supabase");
      return;
    }
    
    // 1. Buscar usuario por nombre en user_roles
    console.log("\n📋 1. Buscando usuario en user_roles...");
    const { data: userRoles, error: userRolesError } = await window.supabase
      .from('user_roles')
      .select('*')
      .or('nombre.ilike.%360%,nombre.ilike.%Senaker%,nombre.ilike.%360 Senaker%');
    
    if (userRolesError) {
      console.log("❌ Error buscando en user_roles:", userRolesError);
    } else {
      console.log("✅ Resultados en user_roles:", userRoles);
    }
    
    // 2. Buscar cliente por nombre en clientes
    console.log("\n🏢 2. Buscando cliente en tabla clientes...");
    const { data: clientes, error: clientesError } = await window.supabase
      .from('clientes')
      .select('*')
      .or('nombre.ilike.%360%,nombre.ilike.%Senaker%,nombre.ilike.%360 Senaker%');
    
    if (clientesError) {
      console.log("❌ Error buscando en clientes:", clientesError);
    } else {
      console.log("✅ Resultados en clientes:", clientes);
    }
    
    // 3. Verificar estructura de carritos_pendientes
    console.log("\n🛒 3. Verificando estructura de carritos_pendientes...");
    const { data: cartStructure, error: cartStructureError } = await window.supabase
      .from('carritos_pendientes')
      .select('*')
      .limit(1);
    
    if (cartStructureError) {
      console.log("❌ Error verificando estructura:", cartStructureError);
    } else {
      console.log("✅ Estructura de carritos_pendientes:", cartStructure);
      if (cartStructure && cartStructure.length > 0) {
        console.log("📊 Campos disponibles:", Object.keys(cartStructure[0]));
      }
    }
    
    // 4. Buscar todos los carritos existentes
    console.log("\n🔍 4. Buscando todos los carritos existentes...");
    const { data: allCarts, error: allCartsError } = await window.supabase
      .from('carritos_pendientes')
      .select(`
        *,
        clientes(nombre, tier),
        user_roles(nombre, role)
      `)
      .order('created_at', { ascending: false });
    
    if (allCartsError) {
      console.log("❌ Error obteniendo carritos:", allCartsError);
    } else {
      console.log("✅ Carritos encontrados:", allCarts?.length || 0);
      allCarts?.forEach((cart, index) => {
        console.log(`   ${index + 1}. User ID: ${cart.user_id}, Cliente ID: ${cart.cliente_id}`);
        console.log(`      Cliente: ${cart.clientes?.nombre || 'N/A'}`);
        console.log(`      Usuario: ${cart.user_roles?.nombre || 'N/A'}`);
        console.log(`      Items: ${cart.items ? JSON.parse(cart.items).length : 0}`);
        console.log(`      Creado: ${cart.created_at}`);
        console.log("      ---");
      });
    }
    
    // 5. Verificar Local Storage
    console.log("\n💾 5. Verificando Local Storage...");
    const cartKeys = Object.keys(localStorage).filter(key => key.startsWith('cartItems_'));
    console.log("✅ Claves de carrito en Local Storage:", cartKeys);
    
    cartKeys.forEach(key => {
      try {
        const cartData = JSON.parse(localStorage.getItem(key));
        console.log(`   ${key}:`, cartData);
      } catch (e) {
        console.log(`   ${key}: Error al parsear -`, e.message);
      }
    });
    
    // 6. Buscar específicamente por "360" o "Senaker"
    console.log("\n🎯 6. Búsqueda específica por '360' o 'Senaker'...");
    
    // Buscar en user_roles
    const { data: specificUsers, error: specificUsersError } = await window.supabase
      .from('user_roles')
      .select('*')
      .or('nombre.ilike.%360%,nombre.ilike.%Senaker%');
    
    if (specificUsersError) {
      console.log("❌ Error en búsqueda específica:", specificUsersError);
    } else {
      console.log("✅ Usuarios específicos encontrados:", specificUsers);
      
      // Para cada usuario encontrado, buscar su carrito
      for (const user of specificUsers || []) {
        console.log(`\n🔍 Buscando carrito para usuario: ${user.nombre} (ID: ${user.user_id})`);
        
        // Buscar por user_id
        const { data: cartByUserId, error: cartByUserIdError } = await window.supabase
          .from('carritos_pendientes')
          .select('*')
          .eq('user_id', user.user_id);
        
        if (cartByUserIdError) {
          console.log("❌ Error buscando por user_id:", cartByUserIdError);
        } else {
          console.log("✅ Carrito por user_id:", cartByUserId);
        }
        
        // Buscar por cliente_id
        if (user.cliente_id) {
          const { data: cartByClienteId, error: cartByClienteIdError } = await window.supabase
            .from('carritos_pendientes')
            .select('*')
            .eq('cliente_id', user.cliente_id);
          
          if (cartByClienteIdError) {
            console.log("❌ Error buscando por cliente_id:", cartByClienteIdError);
          } else {
            console.log("✅ Carrito por cliente_id:", cartByClienteId);
          }
        }
        
        // Verificar Local Storage específico
        const userCartKey = `cartItems_${user.user_id}`;
        const userCartData = localStorage.getItem(userCartKey);
        console.log(`✅ Local Storage para ${user.nombre}:`, userCartData ? JSON.parse(userCartData) : 'No encontrado');
      }
    }
    
    console.log("\n✅ Diagnóstico completado");
    
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
};

// Función para recuperar carrito desde Local Storage
window.recuperarCarritoDesdeLocalStorage = function(userId) {
  try {
    console.log(`🔧 Recuperando carrito desde Local Storage para usuario: ${userId}`);
    
    const cartKey = `cartItems_${userId}`;
    const cartData = localStorage.getItem(cartKey);
    
    if (!cartData) {
      console.log("❌ No se encontró carrito en Local Storage");
      return null;
    }
    
    const parsedCart = JSON.parse(cartData);
    console.log("✅ Carrito encontrado en Local Storage:", parsedCart);
    
    return parsedCart;
  } catch (error) {
    console.error("❌ Error recuperando carrito:", error);
    return null;
  }
};

// Función para restaurar carrito a Supabase
window.restaurarCarritoASupabase = async function(userId, cartData) {
  try {
    console.log(`💾 Restaurando carrito a Supabase para usuario: ${userId}`);
    
    if (!cartData || !Array.isArray(cartData)) {
      console.log("❌ Datos de carrito inválidos");
      return false;
    }
    
    // Calcular totales
    const totalItems = cartData.length;
    const totalUnidades = cartData.reduce((total, item) => {
      return total + Object.values(item.talles || {}).reduce((sum, cantidad) => sum + cantidad, 0);
    }, 0);
    
    const cartRecord = {
      user_id: userId,
      cliente_id: userId, // Asumir que user_id = cliente_id por ahora
      items: cartData,
      total_items: totalItems,
      total_unidades: totalUnidades,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log("📦 Datos a insertar:", cartRecord);
    
    const { data, error } = await window.supabase
      .from('carritos_pendientes')
      .upsert(cartRecord)
      .select();
    
    if (error) {
      console.log("❌ Error restaurando carrito:", error);
      return false;
    }
    
    console.log("✅ Carrito restaurado exitosamente:", data);
    return true;
    
  } catch (error) {
    console.error("❌ Error inesperado restaurando carrito:", error);
    return false;
  }
};

console.log("📋 Funciones disponibles:");
console.log("  - diagnosticarCarrito360Senaker()");
console.log("  - recuperarCarritoDesdeLocalStorage(userId)");
console.log("  - restaurarCarritoASupabase(userId, cartData)");
console.log("\n🚀 Ejecutar: diagnosticarCarrito360Senaker()");


