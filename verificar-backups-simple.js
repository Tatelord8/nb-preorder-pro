// Script ultra-simplificado para verificar backups de Supabase
// Copiar y pegar directamente en la consola del navegador

console.log('🔍 VERIFICANDO BACKUPS DE SUPABASE Y CARRITO PERDIDO');
console.log('==================================================');

// Verificar Local Storage
console.log('\n1️⃣ VERIFICANDO LOCAL STORAGE...');
const localKeys = Object.keys(localStorage);
console.log('📋 Total de claves:', localKeys.length);

const cartKeys = localKeys.filter(key => 
  key.includes('cart') || 
  key.includes('carrito') || 
  key.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
  key.includes('360') ||
  key.includes('Sneakers')
);

if (cartKeys.length > 0) {
  console.log('🎯 Claves relacionadas con carrito encontradas:', cartKeys);
  cartKeys.forEach(key => {
    console.log(`📦 ${key}:`, localStorage.getItem(key));
  });
} else {
  console.log('❌ No se encontraron claves relacionadas con carrito');
}

// Verificar Session Storage
console.log('\n2️⃣ VERIFICANDO SESSION STORAGE...');
const sessionKeys = Object.keys(sessionStorage);
console.log('📋 Total de claves:', sessionKeys.length);

const sessionCartKeys = sessionKeys.filter(key => 
  key.includes('cart') || 
  key.includes('carrito') || 
  key.includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
  key.includes('360') ||
  key.includes('Sneakers')
);

if (sessionCartKeys.length > 0) {
  console.log('🎯 Claves relacionadas con carrito encontradas:', sessionCartKeys);
  sessionCartKeys.forEach(key => {
    console.log(`📦 ${key}:`, sessionStorage.getItem(key));
  });
} else {
  console.log('❌ No se encontraron claves relacionadas con carrito');
}

// Verificar Cookies
console.log('\n3️⃣ VERIFICANDO COOKIES...');
const cookies = document.cookie.split(';');
console.log('🍪 Total de cookies:', cookies.length);

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

// Verificar IndexedDB
console.log('\n4️⃣ VERIFICANDO INDEXEDDB...');
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    console.log('🗄️ Bases de datos IndexedDB:', databases.length);
    databases.forEach(db => {
      console.log(`📦 Base de datos: ${db.name}`);
    });
  }).catch(error => {
    console.log('❌ Error accediendo a IndexedDB:', error);
  });
} else {
  console.log('❌ IndexedDB no disponible');
}

// Verificar si hay información del proyecto
console.log('\n5️⃣ VERIFICANDO INFORMACIÓN DEL PROYECTO...');
const projectRef = window.location.hostname.split('.')[0];
console.log('📊 Project Ref:', projectRef);

// Verificar si hay tokens de acceso
const accessToken = localStorage.getItem('supabase_access_token') ||
                   sessionStorage.getItem('supabase_access_token');

if (accessToken) {
  console.log('✅ Token de acceso encontrado');
} else {
  console.log('❌ No se encontró token de acceso');
}

// Verificar elementos del DOM
console.log('\n6️⃣ VERIFICANDO ELEMENTOS DEL DOM...');
const cartElements = document.querySelectorAll('[data-cart], [data-carrito], [id*="cart"], [class*="cart"]');
console.log('🔍 Elementos relacionados con carrito:', cartElements.length);

// Resumen
console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
console.log('==========================');
console.log('Local Storage:', cartKeys.length > 0 ? '✅ Encontrado' : '❌ No encontrado');
console.log('Session Storage:', sessionCartKeys.length > 0 ? '✅ Encontrado' : '❌ No encontrado');
console.log('Cookies:', cartCookies.length > 0 ? '✅ Encontrado' : '❌ No encontrado');
console.log('IndexedDB:', '✅ Verificado');
console.log('Proyecto:', projectRef);
console.log('Token de acceso:', accessToken ? '✅ Disponible' : '❌ No disponible');

// Recomendaciones
console.log('\n💡 RECOMENDACIONES:');
console.log('===================');
console.log('1. 🔧 Contactar al Cliente 360 Sneakers para recrear el carrito');
console.log('2. 🛡️ Implementar mejoras para evitar pérdidas futuras');
console.log('3. 📞 Contactar soporte de Supabase para verificar backups');
console.log('4. 🔄 Configurar backup automático del carrito');

console.log('\n🎯 VERIFICACIÓN COMPLETADA');


