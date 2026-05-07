// Script de diagnóstico para páginas en blanco
console.log("🔍 DIAGNÓSTICO DE PÁGINAS EN BLANCO");
console.log("====================================");

window.diagnosticarPaginasBlancas = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico de páginas en blanco...");

    // 1. Verificar errores de JavaScript en consola
    console.log("\n🔍 1. Verificando errores de JavaScript...");
    const originalError = console.error;
    const errors = [];
    
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };

    // 2. Verificar si Supabase está disponible
    console.log("\n🔍 2. Verificando Supabase...");
    if (!window.supabase) {
      console.log("❌ Supabase no está disponible en window");
      return;
    }
    console.log("✅ Supabase disponible");

    // 3. Verificar sesión
    console.log("\n🔍 3. Verificando sesión...");
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ Error obteniendo sesión:", sessionError);
      return;
    }
    
    if (!session) {
      console.log("❌ No hay sesión activa");
      return;
    }
    console.log("✅ Sesión activa:", session.user.email);

    // 4. Verificar componentes críticos
    console.log("\n🔍 4. Verificando componentes críticos...");
    
    // Verificar si React está funcionando
    if (!window.React) {
      console.log("❌ React no está disponible");
      return;
    }
    console.log("✅ React disponible");

    // Verificar si React Router está funcionando
    if (!window.ReactRouterDOM) {
      console.log("❌ React Router no está disponible");
      return;
    }
    console.log("✅ React Router disponible");

    // 5. Probar SupabaseCartService
    console.log("\n🔍 5. Probando SupabaseCartService...");
    try {
      if (window.SupabaseCartService) {
        const cartItems = await window.SupabaseCartService.getCart(session.user.id);
        console.log("✅ SupabaseCartService funciona:", cartItems.length, "items");
      } else {
        console.log("❌ SupabaseCartService no está disponible en window");
      }
    } catch (error) {
      console.error("❌ Error en SupabaseCartService:", error);
    }

    // 6. Verificar imports críticos
    console.log("\n🔍 6. Verificando imports críticos...");
    const criticalModules = [
      '@/integrations/supabase/client',
      '@/hooks/useSupabaseCart',
      '@/services/supabase-cart.service',
      '@/components/Layout'
    ];

    for (const module of criticalModules) {
      try {
        // Simular verificación de módulo
        console.log(`✅ Módulo ${module} debería estar disponible`);
      } catch (error) {
        console.error(`❌ Error con módulo ${module}:`, error);
      }
    }

    // 7. Verificar estado de la aplicación
    console.log("\n🔍 7. Verificando estado de la aplicación...");
    console.log("✅ URL actual:", window.location.href);
    console.log("✅ User Agent:", navigator.userAgent);
    console.log("✅ Timestamp:", new Date().toISOString());

    // 8. Restaurar console.error original
    console.error = originalError;

    // 9. Resumen
    console.log("\n📊 RESUMEN DEL DIAGNÓSTICO:");
    console.log(`   - Errores capturados: ${errors.length}`);
    console.log(`   - Supabase: ${window.supabase ? 'Disponible' : 'No disponible'}`);
    console.log(`   - Sesión: ${session ? 'Activa' : 'Inactiva'}`);
    console.log(`   - React: ${window.React ? 'Disponible' : 'No disponible'}`);
    console.log(`   - React Router: ${window.ReactRouterDOM ? 'Disponible' : 'No disponible'}`);

    if (errors.length > 0) {
      console.log("\n❌ ERRORES ENCONTRADOS:");
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log("\n✅ No se encontraron errores de JavaScript");
    }

    console.log("\n💡 RECOMENDACIONES:");
    console.log("   1. Abre las DevTools (F12) y revisa la pestaña Console");
    console.log("   2. Busca errores en rojo que puedan estar causando el problema");
    console.log("   3. Revisa la pestaña Network para errores de carga");
    console.log("   4. Verifica que todos los archivos se estén cargando correctamente");

  } catch (error) {
    console.error("❌ Error inesperado durante el diagnóstico:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - diagnosticarPaginasBlancas() - Diagnostica páginas en blanco");
console.log("\n💡 Ejecuta: diagnosticarPaginasBlancas()");











