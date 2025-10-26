import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Tag, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Activity,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingDown,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface DashboardStats {
  totalUsers: number;
  totalMarcas: number;
  totalProductos: number;
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosAutorizados: number;
  ingresosTotales: number;
  usuariosActivos: number;
}

interface SKUData {
  sku: string;
  nombre: string;
  rubro: string;
  cantidad?: number; // Para SKUs más seleccionados
  cantidadTotal?: number; // Cantidad total de unidades seleccionadas
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMarcas: 0,
    totalProductos: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosAutorizados: 0,
    ingresosTotales: 0,
    usuariosActivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [skuNoSeleccionados, setSkuNoSeleccionados] = useState<{
    calzados: SKUData[];
    prendas: SKUData[];
  }>({
    calzados: [],
    prendas: []
  });
  const [skuMasSeleccionados, setSkuMasSeleccionados] = useState<{
    calzados: SKUData[];
    prendas: SKUData[];
  }>({
    calzados: [],
    prendas: []
  });
  const [loadingSKUData, setLoadingSKUData] = useState(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return false;
    }

    // Check if user is superadmin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "superadmin")
      .single();

    if (!userRole) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos de superadmin",
        variant: "destructive",
      });
      navigate("/catalog");
      return false;
    }

    setLoading(false);
    return true;
  }, [navigate, toast]);

  const loadSKUData = useCallback(async () => {
    try {
      setLoadingSKUData(true);

      // 1. Obtener todos los productos
      const { data: todosProductos, error: productosError } = await supabase
        .from("productos")
        .select("id, sku, nombre, rubro");

      if (productosError) throw productosError;

      // 2. Obtener todos los productos que han sido seleccionados (de pedidos finalizados y carritos)
      const { data: productosSeleccionados } = await supabase
        .from("items_pedido")
        .select("producto_id, cantidad");

      // Obtener productos en carritos sin confirmar
      const productoIdsEnCarritos = new Set<string>();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cartItems_")) {
          try {
            const cartData = localStorage.getItem(key);
            if (cartData) {
              const items = JSON.parse(cartData);
              items.forEach((item: any) => {
                if (item.productoId) {
                  productoIdsEnCarritos.add(item.productoId);
                }
              });
            }
          } catch (e) {
            console.warn(`Error parsing cart ${key}:`, e);
          }
        }
      }

      // Crear un Set con todos los IDs de productos que han sido seleccionados
      const productosSeleccionadosIds = new Set<string>();
      
      if (productosSeleccionados) {
        productosSeleccionados.forEach((item: any) => {
          productosSeleccionadosIds.add(item.producto_id);
        });
      }
      
      productoIdsEnCarritos.forEach(id => productosSeleccionadosIds.add(id));

      // 3. Separar productos no seleccionados por rubro
      const calzadosNoSeleccionados: SKUData[] = [];
      const prendasNoSeleccionados: SKUData[] = [];

      todosProductos?.forEach((producto: any) => {
        if (!productosSeleccionadosIds.has(producto.id)) {
          const skuData: SKUData = {
            sku: producto.sku,
            nombre: producto.nombre,
            rubro: producto.rubro
          };

          if (producto.rubro?.toLowerCase() === 'calzados') {
            calzadosNoSeleccionados.push(skuData);
          } else if (producto.rubro?.toLowerCase() === 'prendas') {
            prendasNoSeleccionados.push(skuData);
          }
        }
      });

      setSkuNoSeleccionados({
        calzados: calzadosNoSeleccionados,
        prendas: prendasNoSeleccionados
      });

      // 4. Calcular SKUs más seleccionados por rubro
      const skuCountsCalzados = new Map<string, { sku: string; nombre: string; rubro: string; cantidad: number; cantidadTotal: number }>();
      const skuCountsPrendas = new Map<string, { sku: string; nombre: string; rubro: string; cantidad: number; cantidadTotal: number }>();
      
      // Contar de pedidos finalizados
      if (productosSeleccionados) {
        for (const item of productosSeleccionados) {
          const producto = todosProductos?.find(p => p.id === item.producto_id);
          if (producto) {
            const rubro = producto.rubro?.toLowerCase();
            const targetMap = rubro === 'calzados' ? skuCountsCalzados : (rubro === 'prendas' ? skuCountsPrendas : null);
            
            if (targetMap) {
              const key = producto.sku;
              if (targetMap.has(key)) {
                const existing = targetMap.get(key)!;
                existing.cantidad += 1;
              } else {
                targetMap.set(key, {
                  sku: producto.sku,
                  nombre: producto.nombre,
                  rubro: producto.rubro,
                  cantidad: 1,
                  cantidadTotal: 0 // Se calculará en el siguiente paso
                });
              }
            }
          }
        }
      }

      // Contar de carritos
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cartItems_")) {
          try {
            const cartData = localStorage.getItem(key);
            if (cartData) {
              const items = JSON.parse(cartData);
              items.forEach((item: any) => {
                if (item.productoId) {
                  const producto = todosProductos?.find(p => p.id === item.productoId);
                  if (producto) {
                    const rubro = producto.rubro?.toLowerCase();
                    const targetMap = rubro === 'calzados' ? skuCountsCalzados : (rubro === 'prendas' ? skuCountsPrendas : null);
                    
                    if (targetMap) {
                      const countKey = producto.sku;
                      if (targetMap.has(countKey)) {
                        targetMap.get(countKey)!.cantidad += 1;
                      } else {
                        targetMap.set(countKey, {
                          sku: producto.sku,
                          nombre: producto.nombre,
                          rubro: producto.rubro,
                          cantidad: 1,
                          cantidadTotal: 0
                        });
                      }
                    }
                  }
                }
              });
            }
          } catch (e) {
            console.warn(`Error parsing cart ${key}:`, e);
          }
        }
      }
      
      // Calcular cantidad total por SKU sumando las cantidades
      const calcularCantidadTotal = (sku: string, productos: any[]): number => {
        let total = 0;
        
        // Buscar en pedidos finalizados - sumar item.cantidad
        if (productosSeleccionados) {
          for (const item of productosSeleccionados) {
            const producto = productos.find(p => p.id === item.producto_id);
            if (producto && producto.sku === sku) {
              // Sumar la cantidad total del item_pedido
              total += item.cantidad || 0;
            }
          }
        }
        
        // Buscar en carritos - sumar las cantidades de las tallas
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("cartItems_")) {
            try {
              const cartData = localStorage.getItem(key);
              if (cartData) {
                const items = JSON.parse(cartData);
                items.forEach((cartItem: any) => {
                  if (cartItem.productoId) {
                    const producto = productos.find(p => p.id === cartItem.productoId);
                    if (producto && producto.sku === sku) {
                      // Sumar las cantidades de las tallas
                      if (cartItem.talles && typeof cartItem.talles === 'object') {
                        Object.values(cartItem.talles).forEach((cantidad: any) => {
                          total += parseInt(cantidad) || 0;
                        });
                      }
                    }
                  }
                });
              }
            } catch (e) {
              console.warn(`Error parsing cart ${key}:`, e);
            }
          }
        }
        
        return total;
      };

      // Calcular cantidad total para cada SKU y convertir a arrays
      const calzadosSeleccionados = Array.from(skuCountsCalzados.values()).map(item => ({
        ...item,
        cantidadTotal: calcularCantidadTotal(item.sku, todosProductos || [])
      })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 20);

      const prendasSeleccionadas = Array.from(skuCountsPrendas.values()).map(item => ({
        ...item,
        cantidadTotal: calcularCantidadTotal(item.sku, todosProductos || [])
      })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 20);

      setSkuMasSeleccionados({
        calzados: calzadosSeleccionados,
        prendas: prendasSeleccionadas
      });
    } catch (error) {
      console.error("Error loading SKU data:", error);
      toast({
        title: "Error",
        description: "Error al cargar datos de SKUs",
        variant: "destructive",
      });
    } finally {
      setLoadingSKUData(false);
    }
  }, [toast]);

  const loadStats = useCallback(async () => {
    try {
      // Helper function to safely execute queries
      const safeQuery = async (query: Promise<any>, defaultValue: any = { count: 0, data: [] }) => {
        try {
          const result = await query;
          return result;
        } catch (error) {
          console.warn("Query failed:", error);
          return defaultValue;
        }
      };

             // Obtener todos los usuarios para contar carritos pendientes
       const { data: allUsers } = await supabase
         .from("user_roles")
         .select("user_id");

       // Crear un Set con los IDs de usuarios válidos
       const userIdsValidos = new Set<string>();
       if (allUsers) {
         allUsers.forEach(user => {
           if (user.user_id) {
             userIdsValidos.add(user.user_id);
           }
         });
       }

       console.log(`🔍 DEBUG: Usuarios válidos encontrados: ${userIdsValidos.size}`);
       userIdsValidos.forEach(id => console.log(`  - ${id}`));

             // Contar carritos pendientes: solo carritos con productos sin finalizar
       let carritosPendientesCount = 0;
       
       // Obtener usuario actual
       const { data: { session } } = await supabase.auth.getSession();
       const currentUserId = session?.user?.id;
       
       // Recorrer TODAS las claves en localStorage para buscar carritos
       const carritosEncontrados = new Set<string>();
       
       // Buscar todos los carritos en localStorage
       console.log("🔍 DEBUG: Iterando localStorage...");
       for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         
         // SOLO considerar claves específicas de usuario (cartItems_userId), NO la global
         if (key && key.startsWith("cartItems_")) {
           // Extraer el user_id de la clave
           const userIdFromKey = key.replace("cartItems_", "");
           
           console.log(`🔍 DEBUG: Encontrada clave cartItems_: ${key} (user_id: ${userIdFromKey})`);
           
           // SOLO contar si el user_id existe en la base de datos
           if (userIdsValidos.has(userIdFromKey)) {
             console.log(`  ✅ User ID ${userIdFromKey} es válido`);
             try {
               const cartData = localStorage.getItem(key);
               if (cartData) {
                 const items = JSON.parse(cartData);
                 console.log(`  🔍 Key ${key} tiene ${items.length} items`);
                 // Solo contar si hay items reales (array no vacío)
                 if (Array.isArray(items) && items.length > 0) {
                   // Usar la clave del localStorage como identificador único del carrito
                   carritosEncontrados.add(key);
                   console.log(`  📦 Carrito encontrado: ${key} con ${items.length} items`);
                 } else {
                   console.log(`  ⚠️ Key ${key} está vacío (length: ${items.length})`);
                 }
               }
             } catch (e) {
               console.warn(`  ❌ Error parsing cart ${key}:`, e);
             }
           } else {
             console.log(`  ⚠️ User ID ${userIdFromKey} NO es válido (usuario no existe en BD)`);
           }
         }
       }
       
       carritosPendientesCount = carritosEncontrados.size;
       console.log(`🔍 Total carritos pendientes: ${carritosPendientesCount}`);

      // Load all stats in parallel with error handling
      const [
        usersResult,
        marcasResult,
        productosResult,
        pedidosResult,
        pedidosAutorizadosResult,
        ingresosResult,
        usuariosActivosResult
      ] = await Promise.all([
        safeQuery(supabase.from("user_roles").select("id", { count: "exact", head: true })),
        safeQuery(supabase.from("marcas").select("id", { count: "exact", head: true })),
        safeQuery(supabase.from("productos").select("id", { count: "exact", head: true })),
        safeQuery(supabase.from("pedidos").select("id", { count: "exact", head: true })),
        safeQuery(
          supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "autorizado")
        ),
        safeQuery(
          supabase.from("pedidos").select("total_usd").eq("estado", "autorizado"),
          { data: [] }
        ),
        safeQuery(
          supabase.from("user_roles").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        )
      ]);

             console.log("🔍 Dashboard Stats Debug:", {
         totalPedidos: pedidosResult.count,
         carritosPendientes: carritosPendientesCount,
         pedidosAutorizados: pedidosAutorizadosResult.count,
       });

      const ingresosTotales = ingresosResult.data?.reduce((sum, pedido) => sum + (pedido.total_usd || 0), 0) || 0;

             setStats({
         totalUsers: usersResult.count || 0,
         totalMarcas: marcasResult.count || 0,
         totalProductos: productosResult.count || 0,
         totalPedidos: pedidosResult.count || 0,
         pedidosPendientes: carritosPendientesCount || 0,
         pedidosAutorizados: pedidosAutorizadosResult.count || 0,
         ingresosTotales,
         usuariosActivos: usuariosActivosResult.count || 0,
       });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas. Asegúrate de que la migración de estado haya sido aplicada.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const initializeDashboard = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        loadStats();
        loadSKUData();
      }
    };
    
    initializeDashboard();

    // Escuchar cambios en el carrito para actualizar el contador
    const handleCartUpdate = () => {
      loadStats();
      loadSKUData();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, [loadStats, loadSKUData, checkAuth]);

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Marcas Activas",
      value: stats.totalMarcas,
      icon: Tag,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Productos",
      value: stats.totalProductos,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pedidos Totales",
      value: stats.totalPedidos,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Carritos Pendientes",
      value: stats.pedidosPendientes,
      icon: UserX,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Pedidos Autorizados",
      value: stats.pedidosAutorizados,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Ingresos Totales",
      value: `$${stats.ingresosTotales.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Usuarios Activos (30d)",
      value: stats.usuariosActivos,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const exportarSKUsAExcel = (tipo: 'noSeleccionados' | 'masSeleccionados') => {
    const datosExcel: any[] = [];
    
    if (tipo === 'noSeleccionados') {
      // Agregar calzados no seleccionados
      datosExcel.push({ 'Rubro': '=== CALZADOS ===', 'SKU': '', 'Nombre': '' });
      skuNoSeleccionados.calzados.forEach((sku) => {
        datosExcel.push({
          'Rubro': 'Calzados',
          'SKU': sku.sku,
          'Nombre': sku.nombre
        });
      });
      
      // Agregar prendas no seleccionadas
      datosExcel.push({ 'Rubro': '=== PRENDAS ===', 'SKU': '', 'Nombre': '' });
      skuNoSeleccionados.prendas.forEach((sku) => {
        datosExcel.push({
          'Rubro': 'Prendas',
          'SKU': sku.sku,
          'Nombre': sku.nombre
        });
      });
    } else {
      // SKUs más seleccionados - Calzados
      datosExcel.push({ 'Rubro': '=== CALZADOS ===', 'SKU': '', 'Nombre': '', 'Selecciones': '', 'Cantidad Total': '' });
      skuMasSeleccionados.calzados.forEach((sku, index) => {
        datosExcel.push({
          '#': index + 1,
          'SKU': sku.sku,
          'Nombre': sku.nombre,
          'Rubro': sku.rubro,
          'Selecciones': sku.cantidad || 0,
          'Cantidad Total': sku.cantidadTotal || 0
        });
      });
      
      // SKUs más seleccionados - Prendas
      datosExcel.push({ 'Rubro': '=== PRENDAS ===', 'SKU': '', 'Nombre': '', 'Selecciones': '', 'Cantidad Total': '' });
      skuMasSeleccionados.prendas.forEach((sku, index) => {
        datosExcel.push({
          '#': index + 1,
          'SKU': sku.sku,
          'Nombre': sku.nombre,
          'Rubro': sku.rubro,
          'Selecciones': sku.cantidad || 0,
          'Cantidad Total': sku.cantidadTotal || 0
        });
      });
    }
    
    // Crear el workbook y la hoja
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Agregar la hoja al workbook
    const nombreHoja = tipo === 'noSeleccionados' ? 'SKUs No Seleccionados' : 'SKUs Más Seleccionados';
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    
    // Descargar el archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `${tipo === 'noSeleccionados' ? 'SKUs_No_Seleccionados' : 'SKUs_Mas_Seleccionados'}_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    
    toast({
      title: "Excel generado",
      description: `El archivo ${nombreArchivo} se ha descargado exitosamente`,
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2">Dashboard Ejecutivo</h1>
        <p className="text-muted-foreground">Vista general del sistema</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate("/users")}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Gestionar Usuarios</p>
                    <p className="text-sm text-muted-foreground">Crear y administrar usuarios del sistema</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate("/marcas")}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Gestionar Marcas</p>
                    <p className="text-sm text-muted-foreground">Administrar marcas del sistema</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
            <div className="space-y-4">
                             <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Carritos Pendientes</span>
                 <span className="font-medium text-yellow-600">{stats.pedidosPendientes}</span>
               </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedidos Autorizados</span>
                <span className="font-medium text-green-600">{stats.pedidosAutorizados}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuarios Activos</span>
                <span className="font-medium text-blue-600">{stats.usuariosActivos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ingresos del Mes</span>
                <span className="font-medium text-emerald-600">${stats.ingresosTotales.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Nuevos segmentos de SKUs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* SKU No Seleccionados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <CardTitle>SKU No Seleccionados</CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Productos que no han sido seleccionados por ningún usuario
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportarSKUsAExcel('noSeleccionados')}
                  disabled={loadingSKUData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSKUData ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando datos...
                </div>
              ) : (
                <Tabs defaultValue="calzados">
                  <TabsList className="w-full">
                    <TabsTrigger value="calzados" className="flex-1">
                      Calzados ({skuNoSeleccionados.calzados.length})
                    </TabsTrigger>
                    <TabsTrigger value="prendas" className="flex-1">
                      Prendas ({skuNoSeleccionados.prendas.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="calzados" className="mt-4">
                    {skuNoSeleccionados.calzados.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Todos los productos de calzados han sido seleccionados
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {skuNoSeleccionados.calzados.map((sku, index) => (
                          <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{sku.sku}</p>
                                <p className="text-sm text-muted-foreground">{sku.nombre}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="prendas" className="mt-4">
                    {skuNoSeleccionados.prendas.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Todos los productos de prendas han sido seleccionados
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {skuNoSeleccionados.prendas.map((sku, index) => (
                          <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{sku.sku}</p>
                                <p className="text-sm text-muted-foreground">{sku.nombre}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* SKU Más Seleccionados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <CardTitle>SKU Más Seleccionados</CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Top 20 productos más seleccionados por los usuarios
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportarSKUsAExcel('masSeleccionados')}
                  disabled={loadingSKUData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSKUData ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando datos...
                </div>
              ) : (
                <Tabs defaultValue="calzados">
                  <TabsList className="w-full">
                    <TabsTrigger value="calzados" className="flex-1">
                      Calzados ({skuMasSeleccionados.calzados.length})
                    </TabsTrigger>
                    <TabsTrigger value="prendas" className="flex-1">
                      Prendas ({skuMasSeleccionados.prendas.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="calzados" className="mt-4">
                    {skuMasSeleccionados.calzados.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay calzados seleccionados
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {skuMasSeleccionados.calzados.map((sku, index) => (
                          <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    #{index + 1}
                                  </Badge>
                                  <p className="font-medium">{sku.sku}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{sku.nombre}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-2xl font-bold text-green-600">{sku.cantidad}</p>
                                <p className="text-xs text-muted-foreground">selecciones</p>
                                <p className="text-lg font-semibold text-blue-600 mt-1">{sku.cantidadTotal || 0}</p>
                                <p className="text-xs text-muted-foreground">unidades</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="prendas" className="mt-4">
                    {skuMasSeleccionados.prendas.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay prendas seleccionadas
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {skuMasSeleccionados.prendas.map((sku, index) => (
                          <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    #{index + 1}
                                  </Badge>
                                  <p className="font-medium">{sku.sku}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{sku.nombre}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-2xl font-bold text-green-600">{sku.cantidad}</p>
                                <p className="text-xs text-muted-foreground">selecciones</p>
                                <p className="text-lg font-semibold text-blue-600 mt-1">{sku.cantidadTotal || 0}</p>
                                <p className="text-xs text-muted-foreground">unidades</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
