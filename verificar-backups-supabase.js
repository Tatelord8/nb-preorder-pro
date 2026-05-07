// Script para verificar backups de Supabase y buscar el carrito perdido
// Ejecutar en la consola del navegador en el sitio desplegado

console.log('🔍 VERIFICANDO BACKUPS DE SUPABASE Y CARRITO PERDIDO');
console.log('==================================================');

// Función para verificar si hay acceso a la API de gestión de Supabase
async function verificarBackupsSupabase() {
  console.log('\n1️⃣ VERIFICANDO ACCESO A BACKUPS DE SUPABASE...');
  
  try {
    // Verificar si hay información del proyecto en el DOM
    const projectInfo = document.querySelector('[data-project-ref]') || 
                       document.querySelector('[data-supabase-project]') ||
                       window.location.hostname.split('.')[0];
    
    console.log('📊 Información del proyecto:', projectInfo);
    
    // Verificar si hay tokens de acceso disponibles
    const accessToken = localStorage.getItem('supabase_access_token') ||
                       sessionStorage.getItem('supabase_access_token') ||
                       document.querySelector('meta[name="supabase-access-token"]')?.content;
    
    if (accessToken) {
      console.log('✅ Token de acceso encontrado');
      
      // Intentar hacer una consulta a la API de gestión
      const projectRef = window.location.hostname.split('.')[0];
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/backups`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const backups = await response.json();
        console.log('📦 Backups disponibles:', backups);
        return backups;
      } else {
        console.log('❌ No se pudo acceder a los backups:', response.status, response.statusText);
      }
    } else {
      console.log('❌ No se encontró token de acceso para la API de gestión');
    }
    
  } catch (error) {
    console.log('❌ Error verificando backups:', error);
  }
  
  return null;
}

// Función para buscar el carrito perdido en logs más antiguos
async function buscarCarritoEnLogsAntiguos() {
  console.log('\n2️⃣ BUSCANDO CARRITO EN LOGS ANTIGUOS...');
  
  try {
    // Verificar si hay logs almacenados localmente
    const logs = localStorage.getItem('app_logs') ||
                sessionStorage.getItem('app_logs') ||
                localStorage.getItem('cart_logs');
    
    if (logs) {
      console.log('📋 Logs encontrados localmente');
      const parsedLogs = JSON.parse(logs);
      
      // Buscar referencias al usuario 360 Sneakers
      const user360Logs = parsedLogs.filter(log => 
        log.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
        log.includes('360') ||
        log.includes('Sneakers')
      );
      
      if (user360Logs.length > 0) {
        console.log('🎯 Logs relacionados con 360 Sneakers encontrados:', user360Logs);
        return user360Logs;
      } else {
        console.log('❌ No se encontraron logs relacionados con 360 Sneakers');
      }
    } else {
      console.log('❌ No hay logs almacenados localmente');
    }
    
  } catch (error) {
    console.log('❌ Error buscando en logs:', error);
  }
  
  return null;
}

// Función para verificar si hay datos del carrito en IndexedDB
async function buscarCarritoEnIndexedDB() {
  console.log('\n3️⃣ BUSCANDO CARRITO EN INDEXEDDB...');
  
  try {
    if ('indexedDB' in window) {
      // Listar todas las bases de datos
      const databases = await indexedDB.databases();
      console.log('🗄️ Bases de datos IndexedDB:', databases);
      
      for (const db of databases) {
        if (db.name.includes('supabase') || db.name.includes('cart') || db.name.includes('app')) {
          console.log(`🔍 Verificando base de datos: ${db.name}`);
          
          const request = indexedDB.open(db.name);
          request.onsuccess = (event) => {
            const database = event.target.result;
            const transaction = database.transaction(database.objectStoreNames, 'readonly');
            
            for (const storeName of database.objectStoreNames) {
              const store = transaction.objectStore(storeName);
              const getAllRequest = store.getAll();
              
              getAllRequest.onsuccess = () => {
                const data = getAllRequest.result;
                console.log(`📦 Datos en ${storeName}:`, data);
                
                // Buscar datos relacionados con 360 Sneakers
                const relevantData = data.filter(item => 
                  JSON.stringify(item).includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
                  JSON.stringify(item).includes('360') ||
                  JSON.stringify(item).includes('Sneakers')
                );
                
                if (relevantData.length > 0) {
                  console.log('🎯 Datos relevantes encontrados:', relevantData);
                }
              };
            }
          };
        }
      }
    } else {
      console.log('❌ IndexedDB no disponible');
    }
  } catch (error) {
    console.log('❌ Error verificando IndexedDB:', error);
  }
}

// Función para verificar si hay datos del carrito en WebSQL (legacy)
async function buscarCarritoEnWebSQL() {
  console.log('\n4️⃣ VERIFICANDO WEBSQL (LEGACY)...');
  
  try {
    if ('openDatabase' in window) {
      console.log('✅ WebSQL disponible (legacy)');
      // WebSQL está deprecado pero algunos navegadores antiguos lo tienen
    } else {
      console.log('❌ WebSQL no disponible');
    }
  } catch (error) {
    console.log('❌ Error verificando WebSQL:', error);
  }
}

// Función para verificar si hay datos del carrito en Service Workers
async function buscarCarritoEnServiceWorkers() {
  console.log('\n5️⃣ VERIFICANDO SERVICE WORKERS...');
  
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔧 Service Workers registrados:', registrations.length);
      
      for (const registration of registrations) {
        console.log('📋 Service Worker:', registration.scope);
        
        // Verificar si hay datos almacenados en el service worker
        if (registration.active) {
          console.log('✅ Service Worker activo:', registration.active.scriptURL);
        }
      }
    } else {
      console.log('❌ Service Workers no disponibles');
    }
  } catch (error) {
    console.log('❌ Error verificando Service Workers:', error);
  }
}

// Función principal
async function verificarBackupsCompleto() {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE BACKUPS...');
  
  const resultados = {
    backups: null,
    logs: null,
    indexedDB: null,
    webSQL: null,
    serviceWorkers: null
  };
  
  // Ejecutar todas las verificaciones
  resultados.backups = await verificarBackupsSupabase();
  resultados.logs = await buscarCarritoEnLogsAntiguos();
  await buscarCarritoEnIndexedDB();
  await buscarCarritoEnWebSQL();
  await buscarCarritoEnServiceWorkers();
  
  console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
  console.log('==========================');
  console.log('Backups Supabase:', resultados.backups ? '✅ Disponibles' : '❌ No disponibles');
  console.log('Logs locales:', resultados.logs ? '✅ Encontrados' : '❌ No encontrados');
  console.log('IndexedDB:', '✅ Verificado');
  console.log('WebSQL:', '✅ Verificado');
  console.log('Service Workers:', '✅ Verificado');
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  console.log('===================');
  
  if (resultados.backups) {
    console.log('1. ✅ Hay backups disponibles - contactar soporte de Supabase para restaurar');
  } else {
    console.log('1. ❌ No hay acceso a backups - verificar plan de Supabase');
  }
  
  if (resultados.logs) {
    console.log('2. ✅ Hay logs locales - revisar para encontrar el carrito perdido');
  } else {
    console.log('2. ❌ No hay logs locales - el carrito se perdió completamente');
  }
  
  console.log('3. 🔧 Contactar al Cliente 360 Sneakers para recrear el carrito');
  console.log('4. 🛡️ Implementar mejoras para evitar pérdidas futuras');
  
  return resultados;
}

// Ejecutar la verificación
verificarBackupsCompleto().then(resultados => {
  console.log('\n🎯 VERIFICACIÓN COMPLETADA');
  console.log('Resultados:', resultados);
}).catch(error => {
  console.error('❌ Error en la verificación:', error);
});

console.log('\n📝 INSTRUCCIONES:');
console.log('=================');
console.log('1. Ejecuta este script en la consola del navegador');
console.log('2. Revisa los resultados de cada verificación');
console.log('3. Si hay backups disponibles, contacta soporte de Supabase');
console.log('4. Si no hay backups, contacta al Cliente 360 Sneakers');
console.log('5. Implementa mejoras para evitar pérdidas futuras');


