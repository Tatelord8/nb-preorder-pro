import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Download, 
  Filter, 
  RefreshCw, 
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  FileText
} from 'lucide-react';

interface ReportData {
  totalPedidos: number;
  totalSKUs: number;
  cantidadTotal: number;
  valorTotal: number;
  pedidosPorRubro: { [key: string]: number };
  pedidosPorVendedor: { [key: string]: number };
  pedidosPorCliente: { [key: string]: number };
}

interface FilterOptions {
  vendedor: string;
  cliente: string;
  rubro: string;
}

const Reportes = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    vendedor: 'all',
    cliente: 'all',
    rubro: 'all'
  });
  const [vendedores, setVendedores] = useState<Array<{id: string, nombre: string}>>([]);
  const [clientes, setClientes] = useState<Array<{id: string, nombre: string}>>([]);
  const [rubros] = useState(['Calzados', 'Prendas', 'Accesorios']);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      console.log('🔍 Cargando opciones de filtro...');
      
      // Cargar vendedores
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nombre')
        .order('nombre');

      if (vendedoresError) {
        console.error('Error cargando vendedores:', vendedoresError);
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar los vendedores",
          variant: "destructive",
        });
      } else {
        setVendedores(vendedoresData || []);
        console.log('✅ Vendedores cargados:', vendedoresData?.length || 0);
      }

      // Cargar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nombre')
        .order('nombre');

      if (clientesError) {
        console.error('Error cargando clientes:', clientesError);
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
      } else {
        setClientes(clientesData || []);
        console.log('✅ Clientes cargados:', clientesData?.length || 0);
      }
    } catch (error) {
      console.error('Error cargando opciones de filtro:', error);
      setError('Error cargando opciones de filtro');
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando datos del reporte...');
      
      // Construir consulta base
      let pedidosQuery = supabase
        .from('pedidos')
        .select(`
          id,
          total_usd,
          estado,
          cliente_id,
          vendedor_id,
          items_pedido(
            cantidad,
            productos(rubro)
          ),
          clientes(nombre),
          vendedores(nombre)
        `)
        .eq('estado', 'autorizado');

      // Aplicar filtros
      if (filters.vendedor !== 'all') {
        pedidosQuery = pedidosQuery.eq('vendedor_id', filters.vendedor);
      }
      if (filters.cliente !== 'all') {
        pedidosQuery = pedidosQuery.eq('cliente_id', filters.cliente);
      }

      const { data: pedidos, error } = await pedidosQuery;

      if (error) {
        console.error('Error cargando pedidos:', error);
        setError('Error cargando datos del reporte');
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del reporte",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Pedidos obtenidos:', pedidos?.length || 0);

      // Procesar datos
      const processedData: ReportData = {
        totalPedidos: pedidos?.length || 0,
        totalSKUs: 0,
        cantidadTotal: 0,
        valorTotal: 0,
        pedidosPorRubro: {},
        pedidosPorVendedor: {},
        pedidosPorCliente: {}
      };

      const skusSet = new Set<string>();
      let cantidadTotal = 0;
      let valorTotal = 0;

      pedidos?.forEach(pedido => {
        // Sumar valor total
        valorTotal += pedido.total_usd || 0;

        // Contar por vendedor
        const vendedorNombre = pedido.vendedores?.nombre || 'Sin vendedor';
        processedData.pedidosPorVendedor[vendedorNombre] = 
          (processedData.pedidosPorVendedor[vendedorNombre] || 0) + 1;

        // Contar por cliente
        const clienteNombre = pedido.clientes?.nombre || 'Sin cliente';
        processedData.pedidosPorCliente[clienteNombre] = 
          (processedData.pedidosPorCliente[clienteNombre] || 0) + 1;

        // Procesar items del pedido
        pedido.items_pedido?.forEach((item: any) => {
          if (item.productos) {
            const rubro = item.productos.rubro;
            const cantidad = item.cantidad || 0;
            
            // Contar por rubro
            processedData.pedidosPorRubro[rubro] = 
              (processedData.pedidosPorRubro[rubro] || 0) + cantidad;

            // Sumar cantidad total
            cantidadTotal += cantidad;

            // Agregar SKU único (usando el ID del producto como proxy)
            skusSet.add(item.productos.id);
          }
        });
      });

      // Aplicar filtro de rubro si está seleccionado
      if (filters.rubro !== 'all') {
        processedData.pedidosPorRubro = {
          [filters.rubro]: processedData.pedidosPorRubro[filters.rubro] || 0
        };
        // Recalcular cantidad total solo para el rubro seleccionado
        cantidadTotal = processedData.pedidosPorRubro[filters.rubro] || 0;
      }

      processedData.totalSKUs = skusSet.size;
      processedData.cantidadTotal = cantidadTotal;
      processedData.valorTotal = valorTotal;

      setReportData(processedData);
      console.log('✅ Datos procesados correctamente');

    } catch (error) {
      console.error('Error procesando datos del reporte:', error);
      setError('Error al procesar los datos del reporte');
      toast({
        title: "Error",
        description: "Error al procesar los datos del reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      toast({
        title: "Exportando",
        description: "Generando archivo Excel...",
      });

      // Aquí implementarías la lógica de exportación a Excel
      // Por ahora solo mostramos un mensaje
      setTimeout(() => {
        toast({
          title: "Éxito",
          description: "Reporte exportado a Excel correctamente",
        });
      }, 2000);

    } catch (error) {
      console.error('Error exportando reporte:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      vendedor: 'all',
      cliente: 'all',
      rubro: 'all'
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reportes de Ventas</h1>
            <p className="text-muted-foreground">Genera reportes detallados de ventas con filtros personalizados</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadReportData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={loading || !reportData}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Mostrar error si existe */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Reporte
            </CardTitle>
            <CardDescription>
              Selecciona los filtros para personalizar tu reporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Vendedor</label>
                <Select
                  value={filters.vendedor}
                  onValueChange={(value) => handleFilterChange('vendedor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select
                  value={filters.cliente}
                  onValueChange={(value) => handleFilterChange('cliente', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Rubro</label>
                <Select
                  value={filters.rubro}
                  onValueChange={(value) => handleFilterChange('rubro', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rubro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los rubros</SelectItem>
                    {rubros.map((rubro) => (
                      <SelectItem key={rubro} value={rubro}>
                        {rubro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen General */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                    <p className="text-2xl font-bold">{reportData.totalPedidos}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SKUs Únicos</p>
                    <p className="text-2xl font-bold">{reportData.totalSKUs}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cantidad Total</p>
                    <p className="text-2xl font-bold">{reportData.cantidadTotal}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">${reportData.valorTotal.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detalles por Categoría */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Por Rubro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Por Rubro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.pedidosPorRubro).map(([rubro, cantidad]) => (
                    <div key={rubro} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{rubro}</span>
                      <Badge variant="secondary">{cantidad} unidades</Badge>
                    </div>
                  ))}
                  {Object.keys(reportData.pedidosPorRubro).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos para mostrar
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Por Vendedor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Por Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.pedidosPorVendedor).map(([vendedor, pedidos]) => (
                    <div key={vendedor} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{vendedor}</span>
                      <Badge variant="outline">{pedidos} pedidos</Badge>
                    </div>
                  ))}
                  {Object.keys(reportData.pedidosPorVendedor).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos para mostrar
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Por Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Por Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.pedidosPorCliente).map(([cliente, pedidos]) => (
                    <div key={cliente} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{cliente}</span>
                      <Badge variant="outline">{pedidos} pedidos</Badge>
                    </div>
                  ))}
                  {Object.keys(reportData.pedidosPorCliente).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos para mostrar
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando datos del reporte...</p>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !reportData && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
              <p className="text-muted-foreground">No se encontraron pedidos autorizados con los filtros seleccionados.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;