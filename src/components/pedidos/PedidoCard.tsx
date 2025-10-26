/**
 * Componente para mostrar un pedido o carrito individual
 */

import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, Calendar, DollarSign, ShoppingCart } from 'lucide-react';
import { PedidoFinalizado, CarritoStats } from '@/services/reports.service';

interface PedidoCardProps {
  pedido: PedidoFinalizado;
  estadisticas: CarritoStats;
  tipo: 'pedido' | 'carrito';
}

export function PedidoCard({ pedido, estadisticas, tipo }: PedidoCardProps) {
  const isPedido = tipo === 'pedido';
  const Icon = isPedido ? Package : ShoppingCart;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {pedido.clientes && pedido.clientes.nombre}
            </CardTitle>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                {isPedido ? 'Pedido' : 'Carrito'} #{pedido.id.slice(-8)}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(pedido.created_at).toLocaleDateString('es-ES')}
              </div>
              {pedido.vendedores ? (
                <div>Vendedor: {pedido.vendedores.nombre}</div>
              ) : (
                <div className="text-muted-foreground">Sin vendedor asignado</div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <span className="font-semibold text-sm">Calzados:</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {estadisticas.calzados.skusCount} SKUs
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({estadisticas.calzados.cantidadTotal} unidades)
                </span>
              </div>
              <div>
                <span className="font-semibold text-sm">Prendas:</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {estadisticas.prendas.skusCount} SKUs
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({estadisticas.prendas.cantidadTotal} unidades)
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={isPedido ? 'default' : 'outline'}>{pedido.estado}</Badge>
            <div className="flex items-center gap-1 text-lg font-semibold">
              <DollarSign className="h-5 w-5" />
              {pedido.total_usd.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
