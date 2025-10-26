  ---
  📋 REPORTE DE AUDITORÍA - Gestor de Preventas Optima

  🎯 RESUMEN EJECUTIVO

  Tu proyecto es funcionalmente sólido pero tiene inconsistencias críticas de configuración y oportunidades significativas de mejora arquitectónica. El sistema funciona, pero necesita
  reestructuración para escalar y mantener de manera profesional.

  ---
  🚨 INCONSISTENCIAS CRÍTICAS ENCONTRADAS

  1. CONFLICTO DE CREDENCIALES SUPABASE (Severidad: CRÍTICA)

  Problema: Existen 3 URLs diferentes de Supabase en el proyecto:

  - .env: https://jhsrplkxvcxyoqyfogaa.supabase.co
  - client.ts (HARDCODED): https://oszmlmscckrbfnjrveet.supabase.co
  - README.md: https://oszmlmscckrbfnjrveet.supabase.co

  Impacto:
  - El cliente de Supabase NO está usando las variables de entorno
  - Las credenciales están hardcodeadas en src/integrations/supabase/client.ts:7-8
  - Esto hace imposible cambiar de entorno (dev/staging/prod)
  - Riesgo de seguridad al exponer credenciales en el código

  Ubicación: src/integrations/supabase/client.ts:7-8

  ---
  2. DUPLICACIÓN DE STORAGE EN LOCALSTORAGE (Severidad: ALTA)

  Problema: Se usan dos keys diferentes para almacenar el carrito:
  - cartItems_${userId} - Contiene array de CartItems
  - cart_${userId} - Contiene array de productIds

  Impacto:
  - Duplicación de datos
  - Inconsistencias potenciales entre ambas estructuras
  - Complejidad innecesaria en Cart.tsx (líneas 296-325)

  Ubicación:
  - src/pages/Cart.tsx:296-325
  - src/components/Layout.tsx:114-124

  ---
  3. VIOLACIÓN DEL PRINCIPIO DE RESPONSABILIDAD ÚNICA (Severidad: ALTA)

  Problema: Pedidos.tsx tiene 1,119 líneas con múltiples responsabilidades:
  - Leer localStorage directamente (líneas 159-263)
  - Lógica de negocio de reportes (líneas 300-546)
  - Generación de Excel (líneas 587-723)
  - Renderizado de UI (líneas 736-1116)
  - Iteración sobre todos los keys de localStorage del browser

  Impacto:
  - Difícil de testear
  - Difícil de mantener
  - Lógica acoplada
  - Iteración insegura sobre localStorage completo

  Ubicación: src/pages/Pedidos.tsx

  ---
  4. FALTA DE CAPA DE SERVICIOS (Severidad: MEDIA)

  Problema: Todas las llamadas a Supabase están directamente en los componentes

  Ejemplos:
  // En Cart.tsx:42
  const { data: { session } } = await supabase.auth.getSession();

  // En Pedidos.tsx:104
  const { data: pedidosData } = await supabase.from("pedidos").select(...)

  Impacto:
  - Código duplicado en múltiples componentes
  - Difícil de cambiar la fuente de datos
  - Sin caché centralizado
  - Sin manejo de errores consistente

  ---
  5. MANEJO INCONSISTENTE DE ROLES (Severidad: MEDIA)

  Problema: En Layout.tsx, la lógica de permisos puede fallar si userRole está vacío:

  // Layout.tsx:204-215
  if (!userRole) {
    console.log("🔍 Debug Layout - userRole vacío, NO mostrando Productos");
    return false;
  }

  Impacto:
  - Usuarios válidos podrían no ver opciones del menú temporalmente
  - Condiciones de carrera durante la carga inicial
  - Experiencia de usuario inconsistente

  Ubicación: src/components/Layout.tsx:204-215

  ---
  6. USO MÍNIMO DE REACT QUERY (Severidad: BAJA)

  Problema: Tienes @tanstack/react-query instalado pero casi no se usa

  Impacto:
  - Reinventas la rueda con useEffect + useState
  - Sin caché automático
  - Sin invalidación de queries
  - Sin estados de loading/error optimizados

  Ubicación: package.json:43 (instalado), pero no usado en componentes

  ---
  7. TIPADO DÉBIL CON ANY (Severidad: BAJA)

  Problema: Múltiples interfaces usan any:

  // Pedidos.tsx:156
  const carritosEncontrados: any[] = [];

  // Cart.tsx:33
  const [clienteInfo, setClienteInfo] = useState<any>(null);

  Impacto:
  - Pérdida de type safety
  - Errores en tiempo de ejecución
  - Autocompletado pobre en el IDE

  ---
  8. RUTAS SIN PROTECCIÓN BASADA EN ROLES (Severidad: MEDIA)

  Problema: En App.tsx, las rutas están envueltas en <Layout> pero no hay guards de ruta basados en roles

  Impacto:
  - Un cliente podría acceder a /productos escribiendo la URL directamente
  - La validación solo ocurre dentro del componente
  - Riesgo de seguridad menor (RLS en DB protege, pero UX mala)

  Ubicación: src/App.tsx:62-107

  ---
  ✅ COSAS QUE ESTÁN BIEN HECHAS

  1. Row Level Security (RLS) en Supabase - Excelente seguridad a nivel de DB
  2. Migraciones SQL organizadas y versionadas
  3. shadcn-ui para componentes - Buena elección de UI library
  4. TypeScript - Buena base (aunque con muchos any)
  5. Estructura de carpetas - Clara separación de pages/components/utils
  6. Sistema de curvas predefinidas - Implementación inteligente para talles
  7. Excel export - Funcionalidad útil con XLSX
  8. Git commits descriptivos y regulares

  ---
  🔧 PLAN DE MEJORA Y REESTRUCTURACIÓN

  FASE 1: CORRECCIONES CRÍTICAS (1-2 días)

  1.1 Arreglar configuración de Supabase

  Archivo: src/integrations/supabase/client.ts

  Cambio:
  // ❌ ANTES (hardcoded)
  const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbG...";

  // ✅ DESPUÉS (desde .env)
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  Verificar: Actualizar .env con las credenciales correctas (actualmente inconsistente)

  ---
  1.2 Consolidar localStorage del carrito

  Archivos: Cart.tsx, Layout.tsx, ProductDetail.tsx, Pedidos.tsx

  Cambio: Eliminar cart_${userId} y usar solo cartItems_${userId}

  Beneficio: Elimina duplicación, simplifica código

  ---
  1.3 Agregar Route Guards

  Crear archivo: src/components/ProtectedRoute.tsx

  interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
  }

  const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    // Verificar rol del usuario
    // Redirigir si no autorizado
    return <>{children}</>;
  };

  Uso en App.tsx:
  <Route path="/productos" element={
    <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
      <SidebarProvider><Layout><Productos /></Layout></SidebarProvider>
    </ProtectedRoute>
  } />

  ---
  FASE 2: REFACTORIZACIÓN ARQUITECTÓNICA (3-5 días)

  2.1 Crear capa de servicios

  Nueva estructura:
  src/
  ├── services/
  │   ├── auth.service.ts       # Autenticación
  │   ├── productos.service.ts  # CRUD productos
  │   ├── pedidos.service.ts    # CRUD pedidos
  │   ├── clientes.service.ts   # CRUD clientes
  │   ├── cart.service.ts       # Lógica del carrito
  │   └── reports.service.ts    # Generación de reportes

  Ejemplo (productos.service.ts):
  export class ProductosService {
    static async getAll(filters?: ProductFilters) {
      const query = supabase.from('productos').select('*');
      // Aplicar filtros
      return query;
    }

    static async getById(id: string) {
      return supabase.from('productos').select('*').eq('id', id).single();
    }

    static async create(producto: NewProducto) {
      return supabase.from('productos').insert(producto);
    }
  }

  ---
  2.2 Implementar React Query

  Ejemplo de hook (src/hooks/useProductos.ts):
  export const useProductos = (filters?: ProductFilters) => {
    return useQuery({
      queryKey: ['productos', filters],
      queryFn: () => ProductosService.getAll(filters),
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  Uso en componente:
  const { data: productos, isLoading, error } = useProductos({ tier: userTier });

  Beneficios:
  - Caché automático
  - Refetch en background
  - Estados de loading/error consistentes
  - Invalidación automática

  ---
  2.3 Refactorizar Pedidos.tsx

  Dividir en:
  1. Pedidos.tsx (UI y orquestación)
  2. src/services/reports.service.ts (lógica de reportes)
  3. src/services/cart-storage.service.ts (lectura de carritos)
  4. src/utils/excel-generator.ts (generación de Excel)
  5. src/hooks/usePedidosReport.ts (React Query hook)

  Resultado: Pedidos.tsx pasa de 1,119 líneas a ~300 líneas

  ---
  2.4 Mejorar tipado

  Crear tipos estrictos (src/types/index.ts):
  export interface CartItem {
    productoId: string;
    curvaId: string | null;
    cantidadCurvas: number;
    talles: Record<string, number>;
    type: 'predefined' | 'custom';
  }

  export interface ClienteInfo {
    id: string;
    nombre: string;
    tier: string;
    vendedor?: {
      id: string;
      nombre: string;
    };
  }

  Reemplazar todos los any con tipos específicos

  ---
  FASE 3: OPTIMIZACIONES (2-3 días)

  3.1 Implementar caché de productos

  Usar React Query con stale time para evitar refetch constante

  3.2 Lazy loading de rutas

  const Productos = lazy(() => import('./pages/Productos'));
  const Pedidos = lazy(() => import('./pages/Pedidos'));

  3.3 Virtualización para listas largas

  Instalar: @tanstack/react-virtual

  Usar en: Catalog.tsx, Pedidos.tsx cuando hay muchos items

  3.4 Optimizar Excel generation

  Mover la generación de Excel a un Web Worker para no bloquear el UI

  ---
  🗄️ SOLUCIONES PARA ACCESO A LA BASE DE DATOS

  OPCIÓN 1: Supabase Studio (RECOMENDADO)

  Acceso directo a la DB desde el navegador

  Pasos:
  1. Ve a https://supabase.com
  2. Inicia sesión con tu cuenta
  3. Selecciona tu proyecto: oszmlmscckrbfnjrveet
  4. Ve a Table Editor en el menú lateral
  5. Puedes ver/editar todas las tablas directamente

  Ventajas:
  - No requiere instalación
  - Interface gráfica amigable
  - Ejecutar SQL queries en tiempo real
  - Ver RLS policies y funciones

  Para compartir conmigo:
  1. Ve a Table Editor → Selecciona tabla → Click "Export to SQL"
  2. Copia el SQL y pégalo aquí
  3. O comparte screenshots de la estructura

  ---
  OPCIÓN 2: SQL Editor de Supabase

  Ejecutar queries personalizadas

  Pasos:
  1. En Supabase Dashboard, ve a SQL Editor
  2. Ejecuta queries como:

  -- Ver estructura de tabla
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'productos';

  -- Contar registros
  SELECT COUNT(*) FROM productos;

  -- Ver sample data
  SELECT * FROM productos LIMIT 10;

  -- Ver relaciones
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'productos';

  3. Copia los resultados y compártelos conmigo

  ---
  OPCIÓN 3: Conexión directa con cliente PostgreSQL

  Si prefieres usar herramientas de escritorio

  Pasos:
  1. En Supabase Dashboard → Settings → Database
  2. Copia la Connection String
  3. Usa un cliente como:
    - TablePlus (Mac/Windows)
    - DBeaver (Cross-platform)
    - pgAdmin (Cross-platform)
    - DataGrip (JetBrains, de pago)

  Connection details:
  Host: db.oszmlmscckrbfnjrveet.supabase.co
  Port: 5432
  Database: postgres
  User: postgres
  Password: [tu password de Supabase]

  4. Exporta el schema completo como SQL
    
  ---
  OPCIÓN 4: Crear script de diagnóstico

  Puedo crear un script que ejecute en tu proyecto y genere un reporte

  Crear archivo: scripts/db-diagnostic.js

  import { createClient } from '@supabase/supabase-js';

  const supabase = createClient(
    'https://oszmlmscckrbfnjrveet.supabase.co',
    'tu_anon_key'
  );

  const diagnostic = async () => {
    const tables = ['productos', 'clientes', 'pedidos', 'vendedores', 'marcas'];

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      console.log(`\n📊 Tabla: ${table}`);
      console.log(`   Registros: ${count}`);

      // Sample data
      const { data: sample } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sample && sample[0]) {
        console.log(`   Columnas: ${Object.keys(sample[0]).join(', ')}`);
      }
    }
  };

  diagnostic();

  Ejecutar:
  node scripts/db-diagnostic.js > db-report.txt

  Y comparte el archivo db-report.txt conmigo

  ---
  📝 DOCUMENTACIÓN QUE NECESITO PARA REESTRUCTURAR

  Para ayudarte a reestructurar sin romper lo que funciona, necesito:

  1. Schema completo de la base de datos

  - Estructura de todas las tablas
  - Relaciones (foreign keys)
  - Índices
  - RLS policies activas

  Obtener con:
  -- En Supabase SQL Editor
  SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;

  2. Datos de ejemplo de cada tabla

  - 2-3 registros de ejemplo de cada tabla
  - Para entender las relaciones reales

  Obtener con:
  SELECT * FROM productos LIMIT 3;
  SELECT * FROM clientes LIMIT 3;
  SELECT * FROM pedidos LIMIT 3;
  -- etc...

  3. Flujos de negocio críticos

  - ¿Cómo se crea un pedido completo (paso a paso)?
  - ¿Cómo se asigna un cliente a un vendedor?
  - ¿Qué hace que un producto sea "Game Plan"?
  - ¿Qué estados puede tener un pedido y qué significan?

  4. Permisos RLS

  - Para cada tabla, qué puede hacer cada rol

  Obtener con:
  SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
  FROM pg_policies
  WHERE schemaname = 'public';

  ---
  🎯 PRÓXIMOS PASOS SUGERIDOS

  Paso 1: Dame acceso a la estructura de DB

  Usa cualquiera de las opciones anteriores para compartirme:
  - Schema de tablas
  - Sample data
  - RLS policies

  Paso 2: Priorizar fixes

  Decidimos juntos qué arreglar primero:
  - Urgente: Credenciales de Supabase
  - Importante: Refactorizar Pedidos.tsx
  - Mejorable: Implementar React Query

  Paso 3: Implementación gradual

  - Hacemos PRs pequeños y testeables
  - No rompemos funcionalidad existente
  - Agregamos tests para nuevas features

  ---
  ⚠️ ADVERTENCIAS IMPORTANTES

  1. No ejecutes migraciones destructivas sin backup
  2. El .env actual tiene credenciales inconsistentes - verifica cuál es la correcta
  3. Pedidos.tsx itera sobre TODO el localStorage - esto es un riesgo de privacidad
  4. No hay rollback si borramos datos del localStorage

  ---
  📊 MÉTRICAS DEL PROYECTO

  - Total archivos TypeScript: ~50
  - Líneas de código: ~15,000
  - Componentes React: ~30
  - Páginas: 15
  - Rutas: 18
  - Tablas DB: 10+
  - Deuda técnica estimada: Media-Alta

  ---