/**
 * Componente para mostrar estadísticas de pedidos/carritos
 */

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download } from 'lucide-react';
import { ReporteStats } from '@/services/reports.service';

interface PedidosStatsCardProps {
  reporteData: ReporteStats;
  titulo: string;
  filtro: 'general' | 'porCliente' | 'porVendedor' | 'porRubro';
  onFiltroChange: (filtro: 'general' | 'porCliente' | 'porVendedor' | 'porRubro') => void;
  onExportar: () => void;
}

export function PedidosStatsCard({
  reporteData,
  titulo,
  filtro,
  onFiltroChange,
  onExportar,
}: PedidosStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{titulo}</CardTitle>
          <div className="flex items-center gap-3">
            <Button onClick={onExportar} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
            <Select value={filtro} onValueChange={onFiltroChange}>
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
        {filtro === 'general' && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {titulo.includes('Carritos') ? 'Total Carritos' : 'Total Pedidos'}
              </p>
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

        {filtro === 'porCliente' && (
          <div className="space-y-3">
            {Object.values(reporteData.porCliente).map((cliente, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{cliente.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {cliente.totalPedidos} {titulo.includes('Carritos') ? 'carritos' : 'pedidos'}
                  </p>
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

        {filtro === 'porVendedor' && (
          <div className="space-y-3">
            {Object.values(reporteData.porVendedor).map((vendedor, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{vendedor.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {vendedor.totalPedidos} {titulo.includes('Carritos') ? 'carritos' : 'pedidos'}
                  </p>
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

        {filtro === 'porRubro' && (
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
  );
}
