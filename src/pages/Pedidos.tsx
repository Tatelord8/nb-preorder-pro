/**
 * Página de Gestión de Pedidos - Refactorizada
 * Reducida de 1,119 líneas a ~200 líneas usando servicios y hooks
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle, ShoppingCart, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { queryClient, queryKeys } from '../lib/queryClient';

// Hooks personalizados
import { useCurrentUser, useUserRole, useCurrentUserInfo } from '../hooks/useAuth';
import { usePedidosWithDetails } from '../hooks/usePedidos';
import { useCarritos } from '../hooks/useCarritos';
import { useProductosByUserTier } from '../hooks/useProductos';
import { useSupabaseCart } from '../hooks/useSupabaseCart';

// Servicios
import { ReportsService } from '../services/reports.service';
import type { CartItem } from '../services/cart-storage.service';

// Componentes
import { PedidosStatsCard } from '../components/pedidos/PedidosStatsCard';
import { PedidoCard } from '../components/pedidos/PedidoCard';
import { CartBulkUpload } from '../components/cart/CartBulkUpload';

const Pedidos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Forzar datos frescos al entrar a la página (asegura que marca_id esté disponible)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.all });
  }, []);

  // Hooks de React Query
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const { data: userRole } = useUserRole(currentUser?.id);
  const { data: userInfo } = useCurrentUserInfo();

  // Obtener el cliente_id, tier y rol del usuario
  const isSuperadmin = userRole?.role === 'superadmin';
  const clienteId = userRole?.cliente_id || currentUser?.id;
  const userTier = userInfo?.clienteInfo?.tier ?? '3';

  const { data: pedidosFinalizados = [], isLoading: loadingPedidos } = usePedidosWithDetails({
    estado: ['autorizado', 'completado'],
    // Superadmin ve todos los pedidos; el resto solo los propios
    cliente_id: isSuperadmin ? undefined : clienteId,
  });
  const { data: carritosSinConfirmar = [], isLoading: loadingCarritos } = useCarritos();

  // Productos accesibles por tier (para carga masiva)
  const { data: productosDisponibles = [] } = useProductosByUserTier(userTier);

  // Carrito activo
  const { addItem } = useSupabaseCart();

  // Estado del modal de carga masiva
  const [bulkOpen, setBulkOpen] = useState(false);

  // Filtro por marca (solo superadmin)
  const [filtroMarca, setFiltroMarca] = useState<string>('all');

  // Marcas disponibles
  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas', 'activas'],
    queryFn: async () => {
      const { data } = await supabase.from('marcas').select('id, nombre').eq('activa', true).order('nombre');
      return data || [];
    },
    enabled: isSuperadmin,
  });

  // Pedidos/carritos filtrados por marca
  const pedidosFiltrados = useMemo(() => {
    if (filtroMarca === 'all') return pedidosFinalizados;
    return pedidosFinalizados.filter(p =>
      (p as any).items_pedido?.some((item: any) => item.productos?.marca_id === filtroMarca)
    );
  }, [pedidosFinalizados, filtroMarca]);

  const carritosFiltrados = useMemo(() => {
    if (filtroMarca === 'all') return carritosSinConfirmar;
    return carritosSinConfirmar.filter(c =>
      (c as any).items_pedido?.some((item: any) => item.productos?.marca_id === filtroMarca)
    );
  }, [carritosSinConfirmar, filtroMarca]);

  // Estados para filtros de reportes
  const [filtroReporte, setFiltroReporte] = useState<'general' | 'porCliente' | 'porVendedor' | 'porRubro'>('general');
  const [filtroCarritosReporte, setFiltroCarritosReporte] = useState<'general' | 'porCliente' | 'porVendedor' | 'porRubro'>('general');

  // Generar reportes usando los datos filtrados
  const reportePedidos = useMemo(() => ReportsService.generarReportePedidos(pedidosFiltrados), [pedidosFiltrados]);
  const reporteCarritos = useMemo(() => ReportsService.generarReporteCarritos(carritosFiltrados), [carritosFiltrados]);

  // Verificar autenticación
  if (!loadingUser && !currentUser) {
    navigate("/auth");
    return null;
  }

  const loading = loadingUser || loadingPedidos || (isSuperadmin && loadingCarritos);

  // Handler para exportar a Excel
  const handleExportar = async (tipo: 'finalizados' | 'carritos') => {
    try {
      const pedidos = tipo === 'finalizados' ? pedidosFiltrados : carritosFiltrados;
      await ReportsService.exportarPedidosCarritosExcel(pedidos, tipo);
      const tipoNombre = tipo === 'finalizados' ? 'Pedidos Finalizados' : 'Carritos Sin Confirmar';
      const fecha = new Date().toISOString().split('T')[0];
      toast({ title: "Excel generado", description: `${tipoNombre}_${fecha}.xlsx descargado.` });
    } catch {
      toast({ title: "Error", description: "Error al generar el archivo Excel", variant: "destructive" });
    }
  };

  // Handler para carga masiva: agrega cada ítem al carrito
  const handleBulkAdd = async (items: CartItem[]) => {
    let agregados = 0;
    for (const item of items) {
      try {
        await addItem(item);
        agregados++;
      } catch {
        // continúa con el siguiente ítem
      }
    }
    toast({
      title: "Carga masiva completada",
      description: `${agregados} de ${items.length} productos agregados al carrito.`,
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

      {isSuperadmin ? (
        <Tabs defaultValue="finalizados" className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="finalizados" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Pedidos Finalizados ({pedidosFiltrados.length})
              </TabsTrigger>
              <TabsTrigger value="carritos" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Carritos sin Confirmar ({carritosFiltrados.length})
              </TabsTrigger>
            </TabsList>

            <Select value={filtroMarca} onValueChange={setFiltroMarca}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {marcas.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="finalizados" className="flex-1 space-y-6">
            <PedidosStatsCard
              reporteData={reportePedidos}
              titulo="Reporte de Pedidos Finalizados"
              filtro={filtroReporte}
              onFiltroChange={setFiltroReporte}
              onExportar={() => handleExportar('finalizados')}
            />
            <div className="space-y-4">
              {pedidosFiltrados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  estadisticas={ReportsService.calcularEstadisticasPorRubro(pedido)}
                  tipo="pedido"
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="carritos" className="flex-1 space-y-6">
            <PedidosStatsCard
              reporteData={reporteCarritos}
              titulo="Reporte de Carritos sin Confirmar"
              filtro={filtroCarritosReporte}
              onFiltroChange={setFiltroCarritosReporte}
              onExportar={() => handleExportar('carritos')}
            />
            <div className="space-y-4">
              {carritosFiltrados.map((carrito) => (
                <PedidoCard
                  key={carrito.id}
                  pedido={carrito}
                  estadisticas={ReportsService.calcularEstadisticasPorRubro(carrito)}
                  tipo="carrito"
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <Tabs defaultValue="carrito" className="flex-1 flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="carrito" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Mi Carrito ({carritosSinConfirmar.filter(c => c.cliente_id === clienteId).length})
                </TabsTrigger>
                <TabsTrigger value="pedidos" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mis Pedidos ({pedidosFinalizados.length})
                </TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setBulkOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Carga Masiva
              </Button>
            </div>

            <TabsContent value="carrito" className="flex-1 space-y-6">
              <div className="space-y-4">
                {carritosSinConfirmar
                  .filter(carrito => carrito.cliente_id === clienteId)
                  .map((carrito) => (
                    <PedidoCard
                      key={carrito.id}
                      pedido={carrito}
                      estadisticas={ReportsService.calcularEstadisticasPorRubro(carrito)}
                      tipo="carrito"
                    />
                  ))}
                {carritosSinConfirmar.filter(c => c.cliente_id === clienteId).length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No hay productos en tu carrito</h3>
                    <p className="text-muted-foreground mb-4">Agrega productos desde el catálogo o usá la carga masiva</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => navigate('/catalog')}>Ir al Catálogo</Button>
                      <Button variant="outline" className="gap-2" onClick={() => setBulkOpen(true)}>
                        <FileSpreadsheet className="h-4 w-4" />
                        Carga Masiva
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pedidos" className="flex-1 space-y-6">
              <div className="space-y-4">
                {pedidosFinalizados.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    estadisticas={ReportsService.calcularEstadisticasPorRubro(pedido)}
                    tipo="pedido"
                  />
                ))}
                {pedidosFinalizados.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No tenés pedidos finalizados</h3>
                    <p className="text-muted-foreground">Los pedidos aparecerán aquí una vez que sean autorizados</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <CartBulkUpload
            open={bulkOpen}
            onClose={() => setBulkOpen(false)}
            productos={productosDisponibles}
            userTier={userTier}
            onAddItems={handleBulkAdd}
          />
        </>
      )}
    </div>
  );
};

export default Pedidos;
