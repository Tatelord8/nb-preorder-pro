// Script para crear un Layout simplificado de prueba
console.log("🧪 CREANDO LAYOUT SIMPLIFICADO DE PRUEBA");
console.log("=========================================");

window.crearLayoutSimplificado = () => {
  try {
    console.log("🔍 Creando Layout simplificado...");

    // Crear un componente Layout simplificado
    const LayoutSimplificado = `
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LayoutSimplificado = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Gestor de Preventas Optima
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/catalog')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Catálogo
              </button>
              <button
                onClick={() => navigate('/pedidos')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Pedidos
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutSimplificado;
    `;

    console.log("✅ Layout simplificado creado");
    console.log("💡 Este Layout no usa hooks complejos ni servicios de carrito");
    console.log("💡 Si este Layout funciona, el problema está en el Layout original");

    // Crear un componente de prueba simple
    const ComponentePrueba = `
import React from 'react';

const ComponentePrueba = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Componente de Prueba
      </h2>
      <p className="text-gray-600">
        Si puedes ver este mensaje, React está funcionando correctamente.
      </p>
      <div className="mt-4">
        <button 
          onClick={() => alert('¡Funciona!')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Probar Interacción
        </button>
      </div>
    </div>
  );
};

export default ComponentePrueba;
    `;

    console.log("✅ Componente de prueba creado");
    console.log("💡 Este componente es completamente independiente");

    console.log("\n📋 INSTRUCCIONES PARA PROBAR:");
    console.log("1. Crea un archivo temporal con el Layout simplificado");
    console.log("2. Reemplaza temporalmente el Layout original");
    console.log("3. Prueba si las páginas funcionan");
    console.log("4. Si funcionan, el problema está en el Layout original");
    console.log("5. Si no funcionan, el problema está en otro lugar");

    console.log("\n💡 CAUSAS COMUNES DE PÁGINAS EN BLANCO:");
    console.log("   - Errores de JavaScript que rompen React");
    console.log("   - Hooks que fallan silenciosamente");
    console.log("   - Imports circulares o rotos");
    console.log("   - Problemas con Supabase client");
    console.log("   - Errores en useEffect que causan re-renders infinitos");

  } catch (error) {
    console.error("❌ Error creando Layout simplificado:", error);
  }
};

console.log("\n🚀 FUNCIÓN DISPONIBLE:");
console.log("   - crearLayoutSimplificado() - Crea un Layout simplificado para probar");
console.log("\n💡 Ejecuta: crearLayoutSimplificado()");











