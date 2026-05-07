// Script simplificado para verificar backups de Supabase
// Ejecutar directamente en la consola del navegador

console.log('🔍 VERIFICANDO BACKUPS DE SUPABASE Y CARRITO PERDIDO');
console.log('==================================================');

// Función para verificar backups de Supabase
async function verificarBackupsSupabase() {
  console.log('\n1️⃣ VERIFICANDO ACCESO A BACKUPS DE SUPABASE...');
  
  try {
    // Obtener información del proyecto desde la URL
    const projectRef = window.location.hostname.split('.')[0];
    console.log('📊 Project Ref:', projectRef);
    
    // Verificar si hay tokens de acceso en localStorage
    const accessToken = localStorage.getItem('supabase_access_token') ||
                       sessionStorage.getItem('supabase_access_token');
    
    if (accessToken) {
      console.log('✅ Token de acceso encontrado');
      
      // Intentar hacer una consulta a la API de gestión
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
      console.log('💡 Necesitas un token de acceso de Supabase para verificar backups');
    }
    
  } catch (error) {
    console.log('❌ Error verificando backups:', error);
  }
  
  return null;
}

// Función para buscar el carrito perdido en Local Storage
function buscarCarritoEnLocalStorage() {
  console.log('\n2️⃣ BUSCANDO CARRITO EN LOCAL STORAGE...');
  
  try {
    const keys = Object.keys(localStorage);
    console.log('📋 Total de claves en Local Storage:', keys.length);
    
    // Buscar claves relacionadas con carrito
    const cartKeys = keys.filter(key => 
      key.includes('cart') || 
      key.includes('carrito') || 
      key.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
      key.includes('360') ||
      key.includes('Sneakers')
    );
    
    if (cartKeys.length > 0) {
      console.log('🎯 Claves relacionadas con carrito encontradas:', cartKeys);
      
      cartKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
      });
      
      return cartKeys;
    } else {
      console.log('❌ No se encontraron claves relacionadas con carrito');
    }
    
  } catch (error) {
    console.log('❌ Error buscando en Local Storage:', error);
  }
  
  return null;
}

// Función para buscar el carrito perdido en Session Storage
function buscarCarritoEnSessionStorage() {
  console.log('\n3️⃣ BUSCANDO CARRITO EN SESSION STORAGE...');
  
  try {
    const keys = Object.keys(sessionStorage);
    console.log('📋 Total de claves en Session Storage:', keys.length);
    
    // Buscar claves relacionadas con carrito
    const cartKeys = keys.filter(key => 
      key.includes('cart') || 
      key.includes('carrito') || 
      key.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
      key.includes('360') ||
      key.includes('Sneakers')
    );
    
    if (cartKeys.length > 0) {
      console.log('🎯 Claves relacionadas con carrito encontradas:', cartKeys);
      
      cartKeys.forEach(key => {
        const value = sessionStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
      });
      
      return cartKeys;
    } else {
      console.log('❌ No se encontraron claves relacionadas con carrito');
    }
    
  } catch (error) {
    console.log('❌ Error buscando en Session Storage:', error);
  }
  
  return null;
}

// Función para verificar si hay datos del carrito en IndexedDB
async function buscarCarritoEnIndexedDB() {
  console.log('\n4️⃣ BUSCANDO CARRITO EN INDEXEDDB...');
  
  try {
    if ('indexedDB' in window) {
      // Listar todas las bases de datos
      const databases = await indexedDB.databases();
      console.log('🗄️ Bases de datos IndexedDB:', databases.length);
      
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
                console.log(`📦 Datos en ${storeName}:`, data.length, 'registros');
                
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

// Función para verificar si hay datos del carrito en Cookies
function buscarCarritoEnCookies() {
  console.log('\n5️⃣ BUSCANDO CARRITO EN COOKIES...');
  
  try {
    const cookies = document.cookie.split(';');
    console.log('🍪 Total de cookies:', cookies.length);
    
    // Buscar cookies relacionadas con carrito
    const cartCookies = cookies.filter(cookie => 
      cookie.includes('cart') || 
      cookie.includes('carrito') || 
      cookie.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
      cookie.includes('360') ||
      cookie.includes('Sneakers')
    );
    
    if (cartCookies.length > 0) {
      console.log('🎯 Cookies relacionadas con carrito encontradas:', cartCookies);
    } else {
      console.log('❌ No se encontraron cookies relacionadas con carrito');
    }
    
  } catch (error) {
    console.log('❌ Error buscando en cookies:', error);
  }
}

// Función para verificar si hay datos del carrito en el DOM
function buscarCarritoEnDOM() {
  console.log('\n6️⃣ BUSCANDO CARRITO EN EL DOM...');
  
  try {
    // Buscar elementos que contengan información del carrito
    const cartElements = document.querySelectorAll('[data-cart], [data-carrito], [id*="cart"], [class*="cart"]');
    console.log('🔍 Elementos relacionados con carrito:', cartElements.length);
    
    cartElements.forEach((element, index) => {
      console.log(`📦 Elemento ${index + 1}:`, element);
    });
    
    // Buscar scripts que contengan información del carrito
    const scripts = document.querySelectorAll('script');
    let cartScripts = 0;
    
    scripts.forEach(script => {
      if (script.textContent.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
          script.textContent.includes('360') ||
          script.textContent.includes('Sneakers')) {
        cartScripts++;
        console.log('🎯 Script con información del carrito encontrado');
      }
    });
    
    console.log('📜 Scripts con información del carrito:', cartScripts);
    
  } catch (error) {
    console.log('❌ Error buscando en el DOM:', error);
  }
}

// Función principal
async function verificarBackupsCompleto() {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE BACKUPS...');
  
  const resultados = {
    backups: null,
    localStorage: null,
    sessionStorage: null,
    indexedDB: null,
    cookies: null,
    dom: null
  };
  
  // Ejecutar todas las verificaciones
  resultados.backups = await verificarBackupsSupabase();
  resultados.localStorage = buscarCarritoEnLocalStorage();
  resultados.sessionStorage = buscarCarritoEnSessionStorage();
  await buscarCarritoEnIndexedDB();
  buscarCarritoEnCookies();
  buscarCarritoEnDOM();
  
  console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
  console.log('==========================');
  console.log('Backups Supabase:', resultados.backups ? '✅ Disponibles' : '❌ No disponibles');
  console.log('Local Storage:', resultados.localStorage ? '✅ Encontrado' : '❌ No encontrado');
  console.log('Session Storage:', resultados.sessionStorage ? '✅ Encontrado' : '❌ No encontrado');
  console.log('IndexedDB:', '✅ Verificado');
  console.log('Cookies:', '✅ Verificado');
  console.log('DOM:', '✅ Verificado');
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  console.log('===================');
  
  if (resultados.backups) {
    console.log('1. ✅ Hay backups disponibles - contactar soporte de Supabase para restaurar');
  } else {
    console.log('1. ❌ No hay acceso a backups - verificar plan de Supabase');
  }
  
  if (resultados.localStorage || resultados.sessionStorage) {
    console.log('2. ✅ Hay datos locales - revisar para encontrar el carrito perdido');
  } else {
    console.log('2. ❌ No hay datos locales - el carrito se perdió completamente');
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
console.log('1. Este script se ejecutó en la consola del navegador');
console.log('2. Revisa los resultados de cada verificación');
console.log('3. Si hay backups disponibles, contacta soporte de Supabase');
console.log('4. Si no hay backups, contacta al Cliente 360 Sneakers');
console.log('5. Implementa mejoras para evitar pérdidas futuras');


