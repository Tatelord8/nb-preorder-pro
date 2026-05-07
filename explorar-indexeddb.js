// Script para explorar las bases de datos IndexedDB encontradas
// Copiar y pegar directamente en la consola del navegador

console.log('🔍 EXPLORANDO BASES DE DATOS INDEXEDDB PARA ENCONTRAR EL CARRITO PERDIDO');
console.log('=====================================================================');

// Función para explorar una base de datos específica
async function explorarBaseDatos(nombreDB) {
  console.log(`\n📦 EXPLORANDO BASE DE DATOS: ${nombreDB}`);
  console.log('='.repeat(50));
  
  try {
    const request = indexedDB.open(nombreDB);
    
    request.onsuccess = (event) => {
      const database = event.target.result;
      console.log(`✅ Base de datos ${nombreDB} abierta exitosamente`);
      console.log(`📊 Versión: ${database.version}`);
      console.log(`📋 Object Stores: ${database.objectStoreNames.length}`);
      
      // Listar todos los object stores
      for (let i = 0; i < database.objectStoreNames.length; i++) {
        const storeName = database.objectStoreNames[i];
        console.log(`\n🗂️ Object Store: ${storeName}`);
        
        // Crear transacción para leer datos
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        // Obtener todos los datos
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const data = getAllRequest.result;
          console.log(`📊 Total de registros: ${data.length}`);
          
          if (data.length > 0) {
            console.log('📋 Primeros registros:');
            data.slice(0, 3).forEach((item, index) => {
              console.log(`  ${index + 1}.`, item);
            });
            
            // Buscar específicamente el usuario 360 Sneakers
            const user360Data = data.filter(item => 
              JSON.stringify(item).includes('67b53cea-86b3-4d1d-b0dc-d23d6b3dfd40') ||
              JSON.stringify(item).includes('360') ||
              JSON.stringify(item).includes('Sneakers')
            );
            
            if (user360Data.length > 0) {
              console.log(`\n🎯 ¡ENCONTRADO! Datos del Cliente 360 Sneakers:`);
              user360Data.forEach((item, index) => {
                console.log(`  ${index + 1}.`, item);
              });
            } else {
              console.log('❌ No se encontraron datos del Cliente 360 Sneakers');
            }
          } else {
            console.log('❌ No hay datos en este object store');
          }
        };
        
        getAllRequest.onerror = () => {
          console.log(`❌ Error leyendo datos del object store ${storeName}`);
        };
      }
      
      database.close();
    };
    
    request.onerror = () => {
      console.log(`❌ Error abriendo la base de datos ${nombreDB}`);
    };
    
  } catch (error) {
    console.log(`❌ Error explorando ${nombreDB}:`, error);
  }
}

// Función para explorar todas las bases de datos
async function explorarTodasLasBasesDatos() {
  console.log('🚀 INICIANDO EXPLORACIÓN DE TODAS LAS BASES DE DATOS...');
  
  const basesDatos = ['carrito', 'cart', 'preorder', 'shopping'];
  
  for (const nombreDB of basesDatos) {
    await explorarBaseDatos(nombreDB);
    // Pequeña pausa para evitar conflictos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎯 EXPLORACIÓN COMPLETADA');
  console.log('========================');
  console.log('Revisa los resultados arriba para encontrar el carrito perdido');
}

// Ejecutar la exploración
explorarTodasLasBasesDatos().catch(error => {
  console.error('❌ Error en la exploración:', error);
});

console.log('\n📝 INSTRUCCIONES:');
console.log('=================');
console.log('1. Este script explorará todas las bases de datos IndexedDB');
console.log('2. Buscará específicamente datos del Cliente 360 Sneakers');
console.log('3. Revisa los resultados para encontrar el carrito perdido');
console.log('4. Si encuentras datos, podremos restaurarlos');


