/**
 * Página de Gestión de Pedidos - Refactorizada
 * Reducida de 1,119 líneas a ~200 líneas usando servicios y hooks
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

// Hooks personalizados
import { useCurrentUser, useUserRole } from '../hooks/useAuth';
import { usePedidosWithDetails } from '../hooks/usePedidos';
import { useCarritos } from '../hooks/useCarritos';

// Servicios
import { ReportsService } from '../services/reports.service';

// Componentes
import { PedidosStatsCard } from '../components/pedidos/PedidosStatsCard';
import { PedidoCard } from '../components/pedidos/PedidoCard';

const Pedidos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hooks de React Query
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const { data: userRole } = useUserRole(currentUser?.id);
  
  // Obtener el cliente_id correcto
  const clienteId = userRole?.cliente_id || currentUser?.id;
  
  const { data: pedidosFinalizados = [], isLoading: loadingPedidos, refetch: refetchPedidos } = usePedidosWithDetails({
    estado: ['autorizado', 'completado'],
    cliente_id: clienteId
  });
  const { data: carritosSinConfirmar = [], isLoading: loadingCarritos, refetch: refetchCarritos } = useCarritos();

  // Estados para filtros de reportes
  const [filtroReporte, setFiltroReporte] = useState<'general' | 'porCliente' | 'porVendedor' | 'porRubro'>('general');
  const [filtroCarritosReporte, setFiltroCarritosReporte] = useState<'general' | 'porCliente' | 'porVendedor' | 'porRubro'>('general');

  // Generar reportes usando el servicio
  const reportePedidos = useMemo(() => {
    return ReportsService.generarReportePedidos(pedidosFinalizados);
  }, [pedidosFinalizados]);

  const reporteCarritos = useMemo(() => {
    return ReportsService.generarReporteCarritos(carritosSinConfirmar);
  }, [carritosSinConfirmar]);

  // Verificar autenticación
  if (!loadingUser && !currentUser) {
    navigate("/auth");
    return null;
  }

  const loading = loadingUser || loadingPedidos || (userRole === 'superadmin' && loadingCarritos);

  // Handler para exportar a Excel
  const handleExportar = async (tipo: 'finalizados' | 'carritos') => {
    try {
      const pedidos = tipo === 'finalizados' ? pedidosFinalizados : carritosSinConfirmar;
      await ReportsService.exportarPedidosCarritosExcel(pedidos, tipo);

      const tipoNombre = tipo === 'finalizados' ? 'Pedidos Finalizados' : 'Carritos Sin Confirmar';
      const fecha = new Date().toISOString().split('T')[0];

      toast({
        title: "Excel generado",
        description: `El archivo ${tipoNombre}_${fecha}.xlsx se ha descargado exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive",
      });
    }
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
            <PedidosStatsCard
              reporteData={reportePedidos}
              titulo="Reporte de Pedidos Finalizados"
              filtro={filtroReporte}
              onFiltroChange={setFiltroReporte}
              onExportar={() => handleExportar('finalizados')}
            />

            <div className="space-y-4">
              {pedidosFinalizados.map((pedido) => {
                const estadisticas = ReportsService.calcularEstadisticasPorRubro(pedido);
                return (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    estadisticas={estadisticas}
                    tipo="pedido"
                  />
                );
              })}
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
              {carritosSinConfirmar.map((carrito) => {
                const estadisticas = ReportsService.calcularEstadisticasPorRubro(carrito);
                return (
                  <PedidoCard
                    key={carrito.id}
                    pedido={carrito}
                    estadisticas={estadisticas}
                    tipo="carrito"
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="carrito" className="flex-1 flex flex-col p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="carrito" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Mi Carrito ({carritosSinConfirmar.filter(c => c.cliente_id === clienteId).length})
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mis Pedidos ({pedidosFinalizados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carrito" className="flex-1 space-y-6">
            <div className="space-y-4">
              {carritosSinConfirmar
                .filter(carrito => carrito.cliente_id === clienteId)
                .map((carrito) => {
                  const estadisticas = ReportsService.calcularEstadisticasPorRubro(carrito);
                  return (
                    <PedidoCard
                      key={carrito.id}
                      pedido={carrito}
                      estadisticas={estadisticas}
                      tipo="carrito"
                    />
                  );
                })}
              {carritosSinConfirmar.filter(c => c.cliente_id === clienteId).length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No hay productos en tu carrito</h3>
                  <p className="text-muted-foreground mb-4">Agrega productos desde el catálogo para comenzar tu pedido</p>
                  <Button onClick={() => navigate('/catalog')}>
                    Ir al Catálogo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pedidos" className="flex-1 space-y-6">
            <div className="space-y-4">
              {pedidosFinalizados.map((pedido) => {
                const estadisticas = ReportsService.calcularEstadisticasPorRubro(pedido);
                return (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    estadisticas={estadisticas}
                    tipo="pedido"
                  />
                );
              })}
              {pedidosFinalizados.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No tienes pedidos finalizados</h3>
                  <p className="text-muted-foreground">Los pedidos aparecerán aquí una vez que sean autorizados</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Pedidos;
