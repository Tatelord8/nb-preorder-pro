/**
 * Hook personalizado para obtener carritos desde Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { PedidoFinalizado } from '@/services/reports.service';

export function useCarritos() {
  return useQuery({
    queryKey: queryKeys.pedidos.lists(),
    queryFn: async (): Promise<PedidoFinalizado[]> => {
      // Obtener carritos pendientes desde Supabase
      const { data: carritosData, error } = await supabase
        .from("carritos_pendientes")
        .select(`
          id,
          user_id,
          cliente_id,
          items,
          total_items,
          total_unidades,
          created_at,
          clientes(nombre, tier, vendedor_id),
          vendedores(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo carritos:', error);
        return [];
      }

      if (!carritosData || carritosData.length === 0) {
        return [];
      }

      // Procesar carritos y obtener información de productos
      const carritosProcesados: PedidoFinalizado[] = [];

      for (const carrito of carritosData) {
        try {
          const items = carrito.items as any[];
          if (!Array.isArray(items) || items.length === 0) {
            continue;
          }

          // Obtener información de productos desde Supabase
          const productosInfo = new Map<string, any>();
          for (const item of items) {
            if (item.productoId && !productosInfo.has(item.productoId)) {
              const { data: producto } = await supabase
                .from("productos")
                .select("id, sku, nombre, rubro, precio_usd, xfd, fecha_despacho")
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

            // Calcular cantidad total
            let cantidadTotal = item.cantidad || item.cantidadCurvas || 1;
            if (item.talles && typeof item.talles === 'object') {
              cantidadTotal = Object.values(item.talles).reduce(
                (sum: number, cant: any) => sum + (Number(cant) || 0),
                0
              );
            }

            const precio = item.precio_usd || productoInfo?.precio_usd || 0;

            return {
              id: item.productoId,
              producto_id: item.productoId,
              cantidad: cantidadTotal,
              precio_unitario: precio,
              subtotal_usd: precio * cantidadTotal,
              productos: productoInfo ? {
                sku: productoInfo.sku,
                nombre: productoInfo.nombre,
                rubro: productoInfo.rubro,
                xfd: productoInfo.xfd,
                fecha_despacho: productoInfo.fecha_despacho
              } : undefined
            };
          });

          // Calcular total del carrito
          const totalCarrito = itemsMapeados.reduce(
            (sum: number, item: any) => sum + item.subtotal_usd,
            0
          );

          carritosProcesados.push({
            id: carrito.id,
            cliente_id: carrito.cliente_id,
            vendedor_id: carrito.clientes?.vendedor_id || null,
            total_usd: totalCarrito,
            estado: 'pending',
            created_at: carrito.created_at,
            clientes: carrito.clientes ? {
              nombre: carrito.clientes.nombre,
              tier: carrito.clientes.tier
            } : undefined,
            vendedores: carrito.vendedores ? {
              nombre: carrito.vendedores.nombre
            } : undefined,
            items_pedido: itemsMapeados
          });

        } catch (e) {
          console.warn(`Error procesando carrito ${carrito.id}:`, e);
        }
      }

      return carritosProcesados;
    },
    staleTime: 30 * 1000, // 30 segundos (los carritos cambian con frecuencia)
  });
}
