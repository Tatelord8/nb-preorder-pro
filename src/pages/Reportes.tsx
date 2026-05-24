import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
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
  marca: string;
}

const Reportes = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    vendedor: 'all',
    cliente: 'all',
    rubro: 'all',
    marca: 'all',
  });
  const [vendedores, setVendedores] = useState<Array<{id: string, nombre: string}>>([]);
  const [clientes, setClientes] = useState<Array<{id: string, nombre: string}>>([]);
  const [marcas, setMarcas] = useState<Array<{id: string, nombre: string}>>([]);
  const [rubros] = useState(['Calzados', 'Prendas', 'Accesorios']);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const [vendedoresRes, clientesRes, marcasRes] = await Promise.all([
        supabase.from('vendedores').select('id, nombre').order('nombre'),
        supabase.from('clientes').select('id, nombre').order('nombre'),
        supabase.from('marcas').select('id, nombre').eq('activa', true).order('nombre'),
      ]);

      if (!vendedoresRes.error) setVendedores(vendedoresRes.data || []);
      if (!clientesRes.error) setClientes(clientesRes.data || []);
      if (!marcasRes.error) setMarcas(marcasRes.data || []);
    } catch {
      setError('Error cargando opciones de filtro');
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
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
            subtotal_usd,
            productos(id, rubro, marca_id)
          ),
          clientes(nombre),
          vendedores(nombre)
        `)
        .eq('estado', 'autorizado');

      if (filters.vendedor !== 'all') {
        pedidosQuery = pedidosQuery.eq('vendedor_id', filters.vendedor);
      }
      if (filters.cliente !== 'all') {
        pedidosQuery = pedidosQuery.eq('cliente_id', filters.cliente);
      }

      const { data: pedidos, error } = await pedidosQuery;

      if (error) {
        setError('Error cargando datos del reporte');
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del reporte",
          variant: "destructive",
        });
        return;
      }

      const hasItemFilters = filters.rubro !== 'all' || filters.marca !== 'all';

      const processedData: ReportData = {
        totalPedidos: 0,
        totalSKUs: 0,
        cantidadTotal: 0,
        valorTotal: 0,
        pedidosPorRubro: {},
        pedidosPorVendedor: {},
        pedidosPorCliente: {},
      };

      const skusSet = new Set<string>();

      pedidos?.forEach(pedido => {
        const allItems = pedido.items_pedido || [];

        // Filter items by rubro and marca before computing any metrics
        const filteredItems = allItems.filter((item: any) => {
          if (!item.productos) return false;
          const matchRubro = filters.rubro === 'all' || item.productos.rubro === filters.rubro;
          const matchMarca = filters.marca === 'all' || item.productos.marca_id === filters.marca;
          return matchRubro && matchMarca;
        });

        // Skip this pedido entirely if no items match the item-level filters
        if (hasItemFilters && filteredItems.length === 0) return;

        processedData.totalPedidos++;

        const vendedorNombre = pedido.vendedores?.nombre || 'Sin vendedor';
        processedData.pedidosPorVendedor[vendedorNombre] =
          (processedData.pedidosPorVendedor[vendedorNombre] || 0) + 1;

        const clienteNombre = pedido.clientes?.nombre || 'Sin cliente';
        processedData.pedidosPorCliente[clienteNombre] =
          (processedData.pedidosPorCliente[clienteNombre] || 0) + 1;

        // When filtering by item attributes, compute valor from item subtotals
        if (hasItemFilters) {
          filteredItems.forEach((item: any) => {
            processedData.valorTotal += item.subtotal_usd || 0;
          });
        } else {
          processedData.valorTotal += pedido.total_usd || 0;
        }

        filteredItems.forEach((item: any) => {
          if (item.productos) {
            const rubro = item.productos.rubro;
            const cantidad = item.cantidad || 0;

            processedData.pedidosPorRubro[rubro] =
              (processedData.pedidosPorRubro[rubro] || 0) + cantidad;

            processedData.cantidadTotal += cantidad;
            skusSet.add(item.productos.id);
          }
        });
      });

      processedData.totalSKUs = skusSet.size;
      setReportData(processedData);
    } catch {
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
    if (!reportData) {
      toast({ title: "Error", description: "No hay datos para exportar", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "Exportando", description: "Generando archivo Excel..." });

      const wb = XLSX.utils.book_new();

      let pedidosQuery = supabase
        .from('pedidos')
        .select(`
          id,
          total_usd,
          estado,
          created_at,
          cliente_id,
          vendedor_id,
          items_pedido(
            cantidad,
            subtotal_usd,
            talles_cantidades,
            productos(sku, nombre, rubro, precio_usd, fecha_despacho, marca_id)
          ),
          clientes(nombre),
          vendedores(nombre)
        `)
        .eq('estado', 'autorizado');

      if (filters.vendedor !== 'all') {
        pedidosQuery = pedidosQuery.eq('vendedor_id', filters.vendedor);
      }
      if (filters.cliente !== 'all') {
        pedidosQuery = pedidosQuery.eq('cliente_id', filters.cliente);
      }

      const { data: pedidosDetallados } = await pedidosQuery;

      const hasItemFilters = filters.rubro !== 'all' || filters.marca !== 'all';

      const detalleData: any[][] = [
        ['Cliente', 'Vendedor', 'SKU', 'Talla', 'Cantidad', 'Precio', 'Fecha Despacho']
      ];

      pedidosDetallados?.forEach(pedido => {
        const items = (pedido.items_pedido || []).filter((item: any) => {
          if (!item.productos) return false;
          const matchRubro = filters.rubro === 'all' || item.productos.rubro === filters.rubro;
          const matchMarca = filters.marca === 'all' || item.productos.marca_id === filters.marca;
          return matchRubro && matchMarca;
        });

        if (hasItemFilters && items.length === 0) return;

        const clienteNombre = pedido.clientes?.nombre || 'N/A';
        const vendedorNombre = pedido.vendedores?.nombre || 'Sin vendedor';

        items.forEach((item: any) => {
          const sku = item.productos?.sku || 'N/A';
          const precio = item.productos?.precio_usd || 0;
          const fechaDespacho = item.productos?.fecha_despacho || 'Sin fecha';

          if (item.talles_cantidades && typeof item.talles_cantidades === 'object') {
            Object.entries(item.talles_cantidades).forEach(([talla, cantidad]) => {
              if (cantidad && (cantidad as number) > 0) {
                detalleData.push([clienteNombre, vendedorNombre, sku, talla, cantidad, precio, fechaDespacho]);
              }
            });
          } else {
            detalleData.push([clienteNombre, vendedorNombre, sku, 'Sin especificar', item.cantidad || 0, precio, fechaDespacho]);
          }
        });
      });

      if (detalleData.length === 1) {
        detalleData.push(['Sin datos disponibles', '', '', '', '', '', '']);
      }

      const ws = XLSX.utils.aoa_to_sheet(detalleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

      const fecha = new Date().toISOString().split('T')[0];
      const filtrosTexto: string[] = [];
      if (filters.vendedor !== 'all') {
        const v = vendedores.find(x => x.id === filters.vendedor);
        filtrosTexto.push(`Vendedor_${v?.nombre || 'Desconocido'}`);
      }
      if (filters.cliente !== 'all') {
        const c = clientes.find(x => x.id === filters.cliente);
        filtrosTexto.push(`Cliente_${c?.nombre || 'Desconocido'}`);
      }
      if (filters.marca !== 'all') {
        const m = marcas.find(x => x.id === filters.marca);
        filtrosTexto.push(`Marca_${m?.nombre || 'Desconocida'}`);
      }
      if (filters.rubro !== 'all') {
        filtrosTexto.push(`Rubro_${filters.rubro}`);
      }

      const nombreArchivo = filtrosTexto.length > 0
        ? `Reporte_Ventas_${filtrosTexto.join('_')}_${fecha}.xlsx`
        : `Reporte_Ventas_Completo_${fecha}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);
      toast({ title: "Éxito", description: `Reporte exportado como ${nombreArchivo}` });
    } catch {
      toast({ title: "Error", description: "No se pudo exportar el reporte", variant: "destructive" });
    }
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({ vendedor: 'all', cliente: 'all', rubro: 'all', marca: 'all' });
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
            <Button onClick={loadReportData} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleExportExcel} disabled={loading || !reportData} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Vendedor</label>
                <Select value={filters.vendedor} onValueChange={(v) => handleFilterChange('vendedor', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select value={filters.cliente} onValueChange={(v) => handleFilterChange('cliente', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Marca</label>
                <Select value={filters.marca} onValueChange={(v) => handleFilterChange('marca', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {marcas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <Select value={filters.rubro} onValueChange={(v) => handleFilterChange('rubro', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {rubros.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Por Categoría
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

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando datos del reporte...</p>
            </div>
          </div>
        )}

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
