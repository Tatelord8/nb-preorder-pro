import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Package, Calendar, DollarSign, ShoppingCart, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PedidoFinalizado {
  id: string;
  cliente_id: string;
  vendedor_id: string | null;
  total_usd: number;
  estado: string;
  created_at: string;
  clientes?: {
    nombre: string;
    tier: string;
  };
  vendedores?: {
    nombre: string;
  };
  items_pedido?: Array<{
    id: string;
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal_usd: number;
    productos?: {
      sku: string;
      nombre: string;
      rubro: string;
    };
  }>;
}

interface ReporteData {
  totalPedidos: number;
  totalSKUs: number;
  totalCantidad: number;
  totalValorizado: number;
  porCliente: Record<string, {
    nombre: string;
    totalPedidos: number;
    totalSKUs: number;
    totalCantidad: number;
    totalValorizado: number;
  }>;
  porVendedor: Record<string, {
    nombre: string;
    totalPedidos: number;
    totalSKUs: number;
    totalCantidad: number;
    totalValorizado: number;
  }>;
  porRubro: Record<string, {
    totalSKUs: number;
    totalCantidad: number;
    totalValorizado: number;
  }>;
}

const Pedidos = () => {
  const navigate = useNavigate();
  const [pedidosFinalizados, setPedidosFinalizados] = useState<PedidoFinalizado[]>([]);
  const [carritosSinConfirmar, setCarritosSinConfirmar] = useState<PedidoFinalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [reporteCarritosData, setReporteCarritosData] = useState<ReporteData | null>(null);
  const [filtroReporte, setFiltroReporte] = useState<'general' | 'porCliente' | 'porVendedor' | 'porRubro'>('general');
  const [filtroCarritosReporte, setFiltroCarritosReporte] = useState<'general' | 'porCliente' | 'porVendedor' | 'porRubro'>('general');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Obtener el rol del usuario
      const { data: userRoleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setUserRole(userRoleData?.role || null);

             if (userRoleData?.role === 'superadmin') {
         // Cargar pedidos finalizados (estado 'autorizado' o 'completado')
         const { data: pedidosData, error: pedidosError } = await supabase
           .from("pedidos")
           .select(`
             *,
             clientes(nombre, tier),
             vendedores(nombre),
             items_pedido(
               *,
               productos(sku, nombre, rubro)
             )
           `)
           .in('estado', ['autorizado', 'completado'])
           .order('created_at', { ascending: false });

         if (pedidosError) throw pedidosError;

         setPedidosFinalizados(pedidosData || []);

         // Obtener todos los usuarios válidos
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

         // Contar carritos pendientes en localStorage
         const carritosEncontrados: any[] = [];
         const carritosEncontradosIds = new Set<string>();
         
         for (let i = 0; i < localStorage.length; i++) {
           const key = localStorage.key(i);
           
           if (key && key.startsWith("cartItems_")) {
             const userIdFromKey = key.replace("cartItems_", "");
             
             if (userIdsValidos.has(userIdFromKey)) {
               try {
                 const cartData = localStorage.getItem(key);
                 if (cartData) {
                   const items = JSON.parse(cartData);
                   if (Array.isArray(items) && items.length > 0) {
                     // Obtener información del usuario
                     const { data: userInfo } = await supabase
                       .from("user_roles")
                       .select("nombre, role")
                       .eq("user_id", userIdFromKey)
                       .single();

                     const { data: clienteInfo } = await supabase
                       .from("clientes")
                       .select("nombre, tier, vendedor_id")
                       .eq("id", userIdFromKey)
                       .maybeSingle();

                                           let vendedorNombre = null;
                      if (clienteInfo?.vendedor_id) {
                        const { data: vendedorInfo } = await supabase
                          .from("vendedores")
                          .select("nombre")
                          .eq("id", clienteInfo.vendedor_id)
                          .maybeSingle();
                        vendedorNombre = vendedorInfo?.nombre;
                      }
                      
                      // Obtener información de productos desde Supabase
                      const productosInfo = new Map<string, any>();
                      for (const item of items) {
                        if (item.productoId && !productosInfo.has(item.productoId)) {
                          const { data: producto } = await supabase
                            .from("productos")
                            .select("id, sku, nombre, rubro, precio_usd")
                            .eq("id", item.productoId)
                            .single();
                          
                          if (producto) {
                            productosInfo.set(item.productoId, producto);
                          }
                        }
                      }
                      
                      // Mapear items y calcular total del carrito
                      const itemsMapeados = items.map((item: any) => {
                        const productoInfo = productosInfo.get(item.productoId);
                        
                        // Calcular cantidad total: si tiene talles, sumar todas las cantidades
                        let cantidadTotal = item.cantidad || item.cantidadCurvas || 1;
                        if (item.talles && typeof item.talles === 'object') {
                          cantidadTotal = Object.values(item.talles).reduce((sum: number, cant: any) => sum + (Number(cant) || 0), 0);
                        }
                        
                        const precio = item.precio_usd || productoInfo?.precio_usd || 0;
                        
                        console.log('📦 Item mapeado:', {
                          productoId: item.productoId,
                          productoSku: productoInfo?.sku,
                          cantidadOriginal: item.cantidad,
                          cantidadCurvas: item.cantidadCurvas,
                          talles: item.talles,
                          cantidadTotal: cantidadTotal,
                          precio: precio
                        });
                        
                        return {
                          producto_id: item.productoId,
                          cantidad: cantidadTotal,
                          precio_unitario: precio,
                          subtotal_usd: precio * cantidadTotal,
                          productos: productoInfo ? {
                            sku: productoInfo.sku,
                            nombre: productoInfo.nombre,
                            rubro: productoInfo.rubro
                          } : undefined
                        };
                      });
                      
                      // Calcular total del carrito sumando los subtotales
                      const totalCarrito = itemsMapeados.reduce((sum: number, item: any) => sum + item.subtotal_usd, 0);

                      carritosEncontrados.push({
                        id: key,
                        cliente_id: userIdFromKey,
                        vendedor_id: clienteInfo?.vendedor_id || null,
                        total_usd: totalCarrito,
                        estado: 'pending',
                        created_at: new Date().toISOString(),
                        clientes: clienteInfo ? {
                          nombre: clienteInfo.nombre,
                          tier: clienteInfo.tier
                        } : null,
                        vendedores: vendedorNombre ? {
                          nombre: vendedorNombre
                        } : null,
                        items_pedido: itemsMapeados
                      });
                   }
                 }
               } catch (e) {
                 console.warn(`Error parsing cart ${key}:`, e);
               }
             }
           }
         }

         setCarritosSinConfirmar(carritosEncontrados);

         // Generar reportes
         generarReporte(pedidosData || []);
         generarReporteCarritos(carritosEncontrados);
      } else {
        // Para otros roles, cargar solo sus pedidos
        const { data: pedidosData, error: pedidosError } = await supabase
          .from("pedidos")
          .select(`
            *,
            clientes(nombre, tier),
            vendedores(nombre),
            items_pedido(
              *,
              productos(sku, nombre, rubro)
            )
          `)
          .order('created_at', { ascending: false });

        if (pedidosError) throw pedidosError;
        setPedidosFinalizados(pedidosData || []);
      }
    } catch (error) {
      console.error("Error loading pedidos:", error);
      toast({
        title: "Error",
        description: "Error al cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generarReporte = (pedidos: PedidoFinalizado[]) => {
    const reporte: ReporteData = {
      totalPedidos: pedidos.length,
      totalSKUs: 0,
      totalCantidad: 0,
      totalValorizado: 0,
      porCliente: {},
      porVendedor: {},
      porRubro: {},
    };

    pedidos.forEach((pedido) => {
      reporte.totalValorizado += pedido.total_usd;

      // Procesar items primero para obtener datos del pedido
      if (pedido.items_pedido) {
        const uniqueSKUs = new Set<string>();
        const rubroSKUsInPedido = new Map<string, Set<string>>(); // SKUs únicos por rubro en este pedido
        
        pedido.items_pedido.forEach((item) => {
          if (item.productos) {
            uniqueSKUs.add(item.productos.sku);
            reporte.totalCantidad += item.cantidad;

            // Agregar SKU al rubro correspondiente
            const rubro = item.productos.rubro;
            if (rubro) {
              if (!rubroSKUsInPedido.has(rubro)) {
                rubroSKUsInPedido.set(rubro, new Set<string>());
              }
              rubroSKUsInPedido.get(rubro)!.add(item.productos.sku);
            }
          }
        });
        
        // Agregar los SKUs únicos de este pedido al total general
        reporte.totalSKUs += uniqueSKUs.size;
        
        // Sumar los SKUs únicos por rubro de este pedido al total del rubro
        rubroSKUsInPedido.forEach((skus, rubro) => {
          if (!reporte.porRubro[rubro]) {
            reporte.porRubro[rubro] = {
              totalSKUs: 0,
              totalCantidad: 0,
              totalValorizado: 0,
            };
          }
          // Sumar los SKUs únicos de este pedido al total del rubro
          reporte.porRubro[rubro].totalSKUs += skus.size;
        });

        // Procesar items para cantidades y valores
        pedido.items_pedido.forEach((item) => {
          if (item.productos) {
            // Por cliente
            if (pedido.clientes) {
              const clienteKey = pedido.cliente_id;
              if (!reporte.porCliente[clienteKey]) {
                reporte.porCliente[clienteKey] = {
                  nombre: pedido.clientes.nombre,
                  totalPedidos: 0,
                  totalSKUs: 0,
                  totalCantidad: 0,
                  totalValorizado: 0,
                };
              }
              // Solo contar SKUs del cliente si es el primer item procesado
              if (reporte.porCliente[clienteKey].totalSKUs === 0) {
                const clienteSKUs = new Set<string>();
                pedido.items_pedido?.forEach(i => i.productos && clienteSKUs.add(i.productos.sku));
                reporte.porCliente[clienteKey].totalSKUs = clienteSKUs.size;
              }
              reporte.porCliente[clienteKey].totalCantidad += item.cantidad;
            }

            // Por vendedor
            if (pedido.vendedores && pedido.vendedor_id) {
              const vendedorKey = pedido.vendedor_id;
              if (!reporte.porVendedor[vendedorKey]) {
                reporte.porVendedor[vendedorKey] = {
                  nombre: pedido.vendedores.nombre,
                  totalPedidos: 0,
                  totalSKUs: 0,
                  totalCantidad: 0,
                  totalValorizado: 0,
                };
              }
              // Solo contar SKUs del vendedor si es el primer item procesado
              if (reporte.porVendedor[vendedorKey].totalSKUs === 0) {
                const vendedorSKUs = new Set<string>();
                pedido.items_pedido?.forEach(i => i.productos && vendedorSKUs.add(i.productos.sku));
                reporte.porVendedor[vendedorKey].totalSKUs = vendedorSKUs.size;
              }
              reporte.porVendedor[vendedorKey].totalCantidad += item.cantidad;
            }

            // Por rubro (cantidades y valores)
            const rubro = item.productos.rubro;
            if (rubro) {
              reporte.porRubro[rubro].totalCantidad += item.cantidad;
              reporte.porRubro[rubro].totalValorizado += item.subtotal_usd;
            }
          }
        });
      }

      // Actualizar contadores de pedidos para cliente y vendedor
      if (pedido.clientes) {
        const clienteKey = pedido.cliente_id;
        if (reporte.porCliente[clienteKey]) {
          reporte.porCliente[clienteKey].totalPedidos++;
          reporte.porCliente[clienteKey].totalValorizado += pedido.total_usd;
        }
      }

      if (pedido.vendedores && pedido.vendedor_id) {
        const vendedorKey = pedido.vendedor_id;
        if (reporte.porVendedor[vendedorKey]) {
          reporte.porVendedor[vendedorKey].totalPedidos++;
          reporte.porVendedor[vendedorKey].totalValorizado += pedido.total_usd;
        }
      }
    });

    setReporteData(reporte);
  };

  const generarReporteCarritos = (carritos: PedidoFinalizado[]) => {
    const reporte: ReporteData = {
      totalPedidos: carritos.length,
      totalSKUs: 0,
      totalCantidad: 0,
      totalValorizado: 0,
      porCliente: {},
      porVendedor: {},
      porRubro: {},
    };

    // SKUs globales únicos para todo el reporte
    const allUniqueSKUs = new Set<string>();
    
    carritos.forEach((carrito) => {
      reporte.totalValorizado += carrito.total_usd;

      // Procesar items primero para obtener datos del carrito
      if (carrito.items_pedido && carrito.items_pedido.length > 0) {
        const carritoSKUs = new Set<string>();
        let carritoCantidad = 0;
        
        carrito.items_pedido.forEach((item) => {
          const producto = (item as any).productos || (item as any).producto;
          
          if (producto && producto.sku) {
            carritoSKUs.add(producto.sku);
            allUniqueSKUs.add(producto.sku);
            carritoCantidad += item.cantidad;
          }
        });

        // Actualizar totales generales
        reporte.totalCantidad += carritoCantidad;

        // Por cliente
        if (carrito.clientes) {
          const clienteKey = carrito.cliente_id;
          if (!reporte.porCliente[clienteKey]) {
            reporte.porCliente[clienteKey] = {
              nombre: carrito.clientes.nombre,
              totalPedidos: 0,
              totalSKUs: 0,
              totalCantidad: 0,
              totalValorizado: 0,
            };
          }
          reporte.porCliente[clienteKey].totalPedidos++;
          reporte.porCliente[clienteKey].totalValorizado += carrito.total_usd;
          
          // Sumar SKUs y cantidad del carrito al cliente
          reporte.porCliente[clienteKey].totalSKUs += carritoSKUs.size;
          reporte.porCliente[clienteKey].totalCantidad += carritoCantidad;
        }

        // Por vendedor
        if (carrito.vendedores && carrito.vendedor_id) {
          const vendedorKey = carrito.vendedor_id;
          if (!reporte.porVendedor[vendedorKey]) {
            reporte.porVendedor[vendedorKey] = {
              nombre: carrito.vendedores.nombre,
              totalPedidos: 0,
              totalSKUs: 0,
              totalCantidad: 0,
              totalValorizado: 0,
            };
          }
          reporte.porVendedor[vendedorKey].totalPedidos++;
          reporte.porVendedor[vendedorKey].totalValorizado += carrito.total_usd;
          
          // Sumar SKUs y cantidad del carrito al vendedor
          reporte.porVendedor[vendedorKey].totalSKUs += carritoSKUs.size;
          reporte.porVendedor[vendedorKey].totalCantidad += carritoCantidad;
        }

        // Por rubro - primero contar SKUs únicos por rubro en este carrito
        const rubroSKUsMap = new Map<string, Set<string>>();
        carrito.items_pedido?.forEach((i: any) => {
          const prod = i.productos || i.producto;
          if (prod && prod.rubro && prod.sku) {
            if (!rubroSKUsMap.has(prod.rubro)) {
              rubroSKUsMap.set(prod.rubro, new Set<string>());
            }
            rubroSKUsMap.get(prod.rubro)!.add(prod.sku);
          }
        });
        
        // Luego procesar cada item para sumar cantidades y valores
        carrito.items_pedido.forEach((item) => {
          const producto = (item as any).productos || (item as any).producto;
          const rubro = producto?.rubro;
          
          if (rubro) {
            if (!reporte.porRubro[rubro]) {
              reporte.porRubro[rubro] = {
                totalSKUs: 0,
                totalCantidad: 0,
                totalValorizado: 0,
              };
            }
            // Solo contar SKUs si es la primera vez que se procesa este rubro para este carrito
            if (rubroSKUsMap.has(rubro)) {
              reporte.porRubro[rubro].totalSKUs += rubroSKUsMap.get(rubro)!.size;
              rubroSKUsMap.delete(rubro); // Evitar contar múltiples veces
            }
            reporte.porRubro[rubro].totalCantidad += item.cantidad;
            
            // Agregar valor del item al rubro
            const subtotal = (item as any).subtotal_usd || ((item as any).precio_unitario * item.cantidad);
            reporte.porRubro[rubro].totalValorizado += subtotal || 0;
          }
        });
      }
    });

    // Establecer el total de SKUs únicos globales
    reporte.totalSKUs = allUniqueSKUs.size;

    setReporteCarritosData(reporte);
  };

  const exportarAExcel = async (tipo: 'finalizados' | 'carritos') => {
    const pedidos = tipo === 'finalizados' ? pedidosFinalizados : carritosSinConfirmar;
    const tipoNombre = tipo === 'finalizados' ? 'Pedidos_Finalizados' : 'Carritos_Sin_Confirmar';
    
    // Construir los datos para el Excel
    const datosExcel: any[] = [];
    
    for (const pedido of pedidos) {
      const cliente = pedido.clientes?.nombre || 'N/A';
      const vendedor = pedido.vendedores?.nombre || 'N/A';
      
      if (pedido.items_pedido && pedido.items_pedido.length > 0) {
        for (const item of pedido.items_pedido) {
          const sku = item.productos?.sku || 'N/A';
          const precio = item.precio_unitario || 0;
          
          // Obtener información adicional del producto para pedidos finalizados
          let xfd = '';
          let fechaDespacho = '';
          
          if (tipo === 'finalizados' && item.producto_id) {
            const { data: productoCompleto, error: productoError } = await supabase
              .from('productos')
              .select('xfd, fecha_despacho')
              .eq('id', item.producto_id)
              .maybeSingle();
            
            if (productoError) {
              console.error('Error fetching producto:', productoError);
            }
            
            if (productoCompleto) {
              // Formatear xfd si es una fecha
              if (productoCompleto.xfd) {
                if (typeof productoCompleto.xfd === 'string') {
                  xfd = productoCompleto.xfd;
                } else {
                  xfd = new Date(productoCompleto.xfd).toLocaleDateString('es-ES');
                }
              }
              
              // Formatear fecha_despacho
              if (productoCompleto.fecha_despacho) {
                fechaDespacho = new Date(productoCompleto.fecha_despacho).toLocaleDateString('es-ES');
              }
            }
          }
          
          // Si es un carrito sin confirmar, obtener talles desde localStorage
          if (tipo === 'carritos') {
            const key = `cartItems_${pedido.cliente_id}`;
            const cartData = localStorage.getItem(key);
            
            if (cartData) {
              const items = JSON.parse(cartData);
              const cartItem = items.find((i: any) => i.productoId === item.producto_id);
              
              if (cartItem && cartItem.talles) {
                // Agregar una fila por cada talla
                Object.entries(cartItem.talles).forEach(([talla, cantidad]) => {
                  if (Number(cantidad) > 0) {
                    datosExcel.push({
                      'SKU': sku,
                      'Talla': talla,
                      'Cantidad por talla': cantidad,
                      'Precio por SKU': precio,
                      'Vendedor': vendedor,
                      'Cliente': cliente,
                      'XFD': '',
                      'Fecha de Despacho': ''
                    });
                  }
                });
              } else {
                // Si no hay talles, agregar una fila con la cantidad total
                datosExcel.push({
                  'SKU': sku,
                  'Talla': 'Todas',
                  'Cantidad por talla': item.cantidad || 0,
                  'Precio por SKU': precio,
                  'Vendedor': vendedor,
                  'Cliente': cliente,
                  'XFD': '',
                  'Fecha de Despacho': ''
                });
              }
            }
          } else {
            // Para pedidos finalizados, agregar la fila con la información disponible
            datosExcel.push({
              'SKU': sku,
              'Talla': 'Todas',
              'Cantidad por talla': item.cantidad || 0,
              'Precio por SKU': precio,
              'Vendedor': vendedor,
              'Cliente': cliente,
              'XFD': xfd,
              'Fecha de Despacho': fechaDespacho
            });
          }
        }
      }
    }
    
    // Crear el workbook y la hoja
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, tipoNombre);
    
    // Descargar el archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `${tipoNombre}_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    
    toast({
      title: "Excel generado",
      description: `El archivo ${nombreArchivo} se ha descargado exitosamente`,
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Administra y visualiza todos los pedidos del sistema</p>
      </div>

      {userRole === 'superadmin' ? (
        <Tabs defaultValue="finalizados" className="flex-1 flex flex-col p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="finalizados" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pedidos Finalizados ({pedidosFinalizados.length})
            </TabsTrigger>
            <TabsTrigger value="carritos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Carritos sin Confirmar ({carritosSinConfirmar.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finalizados" className="flex-1 space-y-6">
            {reporteData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Reporte de Pedidos Finalizados</CardTitle>
                    <div className="flex items-center gap-3">
                      <Button onClick={() => exportarAExcel('finalizados')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar a Excel
                      </Button>
                      <Select value={filtroReporte} onValueChange={(v: any) => setFiltroReporte(v)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Ver reporte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="porCliente">Por Cliente</SelectItem>
                          <SelectItem value="porVendedor">Por Vendedor</SelectItem>
                          <SelectItem value="porRubro">Por Rubro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filtroReporte === 'general' && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Pedidos</p>
                        <p className="text-2xl font-bold">{reporteData.totalPedidos}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">SKUs Únicos</p>
                        <p className="text-2xl font-bold">{reporteData.totalSKUs}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Cantidad Total</p>
                        <p className="text-2xl font-bold">{reporteData.totalCantidad}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-bold">${reporteData.totalValorizado.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {filtroReporte === 'porCliente' && (
                    <div className="space-y-3">
                      {Object.values(reporteData.porCliente).map((cliente, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{cliente.nombre}</p>
                            <p className="text-sm text-muted-foreground">{cliente.totalPedidos} pedidos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{cliente.totalSKUs} SKUs</p>
                            <p className="text-sm text-muted-foreground">{cliente.totalCantidad} unidades</p>
                            <p className="font-bold">${cliente.totalValorizado.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filtroReporte === 'porVendedor' && (
                    <div className="space-y-3">
                      {Object.values(reporteData.porVendedor).map((vendedor, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{vendedor.nombre}</p>
                            <p className="text-sm text-muted-foreground">{vendedor.totalPedidos} pedidos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{vendedor.totalSKUs} SKUs</p>
                            <p className="text-sm text-muted-foreground">{vendedor.totalCantidad} unidades</p>
                            <p className="font-bold">${vendedor.totalValorizado.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filtroReporte === 'porRubro' && (
                    <div className="space-y-3">
                      {Object.entries(reporteData.porRubro).map(([rubro, data]) => (
                        <div key={rubro} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{rubro}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{data.totalSKUs} SKUs</p>
                            <p className="text-sm text-muted-foreground">{data.totalCantidad} unidades</p>
                            <p className="font-bold">${data.totalValorizado.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {pedidosFinalizados.map((pedido) => (
                <Card key={pedido.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Pedido #{pedido.id.slice(-8)}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(pedido.created_at).toLocaleDateString('es-ES')}
                          </p>
                          {pedido.clientes && <p>Cliente: {pedido.clientes.nombre}</p>}
                          {pedido.vendedores && <p>Vendedor: {pedido.vendedores.nombre}</p>}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{pedido.estado}</Badge>
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <DollarSign className="h-5 w-5" />
                          {pedido.total_usd.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="carritos" className="flex-1 space-y-6">
            {reporteCarritosData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Reporte de Carritos sin Confirmar</CardTitle>
                    <div className="flex items-center gap-3">
                      <Button onClick={() => exportarAExcel('carritos')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar a Excel
                      </Button>
                      <Select value={filtroCarritosReporte} onValueChange={(v: any) => setFiltroCarritosReporte(v)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Ver reporte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="porCliente">Por Cliente</SelectItem>
                          <SelectItem value="porVendedor">Por Vendedor</SelectItem>
                          <SelectItem value="porRubro">Por Rubro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filtroCarritosReporte === 'general' && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Carritos</p>
                        <p className="text-2xl font-bold">{reporteCarritosData.totalPedidos}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">SKUs Únicos</p>
                        <p className="text-2xl font-bold">{reporteCarritosData.totalSKUs}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Cantidad Total</p>
                        <p className="text-2xl font-bold">{reporteCarritosData.totalCantidad}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-bold">${reporteCarritosData.totalValorizado.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {filtroCarritosReporte === 'porCliente' && (
                    <div className="space-y-3">
                      {Object.values(reporteCarritosData.porCliente).map((cliente, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{cliente.nombre}</p>
                            <p className="text-sm text-muted-foreground">{cliente.totalPedidos} carritos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{cliente.totalSKUs} SKUs</p>
                            <p className="text-sm text-muted-foreground">{cliente.totalCantidad} unidades</p>
                            <p className="font-bold">${cliente.totalValorizado.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filtroCarritosReporte === 'porVendedor' && (
                    <div className="space-y-3">
                      {Object.values(reporteCarritosData.porVendedor).map((vendedor, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{vendedor.nombre}</p>
                            <p className="text-sm text-muted-foreground">{vendedor.totalPedidos} carritos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{vendedor.totalSKUs} SKUs</p>
                            <p className="text-sm text-muted-foreground">{vendedor.totalCantidad} unidades</p>
                            <p className="font-bold">${vendedor.totalValorizado.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filtroCarritosReporte === 'porRubro' && (
                    <div className="space-y-3">
                      {Object.entries(reporteCarritosData.porRubro).map(([rubro, data]) => (
                        <div key={rubro} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{rubro}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{data.totalSKUs} SKUs</p>
                            <p className="text-sm text-muted-foreground">{data.totalCantidad} unidades</p>
                            <p className="font-bold">${data.totalValorizado.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {carritosSinConfirmar.map((carrito) => (
                <Card key={carrito.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          Carrito #{carrito.id.slice(-8)}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(carrito.created_at).toLocaleDateString('es-ES')}
                          </p>
                          {carrito.clientes && <p>Cliente: {carrito.clientes.nombre}</p>}
                          {carrito.vendedores && <p>Vendedor: {carrito.vendedores.nombre}</p>}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{carrito.estado}</Badge>
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <DollarSign className="h-5 w-5" />
                          {carrito.total_usd.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          {/* Vista simplificada para otros roles */}
          <div className="grid gap-6">
            {pedidosFinalizados.map((pedido) => (
              <Card key={pedido.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Pedido #{pedido.id.slice(-8)}</CardTitle>
                      <CardDescription>
                        {new Date(pedido.created_at).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </div>
                    <Badge>{pedido.estado}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span>Total</span>
                    <span className="text-lg font-semibold">${pedido.total_usd.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
