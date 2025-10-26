/**
 * Hook personalizado para obtener carritos desde localStorage
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { PedidoFinalizado } from '@/services/reports.service';

export function useCarritos() {
  return useQuery({
    queryKey: queryKeys.pedidos.lists(),
    queryFn: async (): Promise<PedidoFinalizado[]> => {
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
      const carritosEncontrados: PedidoFinalizado[] = [];

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
                    } : undefined,
                    vendedores: vendedorNombre ? {
                      nombre: vendedorNombre
                    } : undefined,
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

      return carritosEncontrados;
    },
    staleTime: 30 * 1000, // 30 segundos (los carritos cambian con frecuencia)
  });
}
