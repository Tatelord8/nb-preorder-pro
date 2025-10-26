/**
 * Hooks de React Query para Pedidos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PedidosService, type Pedido, type PedidoFilters, type CreatePedidoInput } from '@/services/pedidos.service';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { useToast } from './use-toast';
import type { CartItem } from '@/services/cart-storage.service';

/**
 * Hook para obtener todos los pedidos
 */
export function usePedidos(filters?: PedidoFilters) {
  return useQuery({
    queryKey: queryKeys.pedidos.list(filters),
    queryFn: () => PedidosService.getAll(filters),
  });
}

/**
 * Hook para obtener pedidos con detalles
 */
export function usePedidosWithDetails(filters?: PedidoFilters) {
  return useQuery({
    queryKey: [...queryKeys.pedidos.list(filters), 'withDetails'],
    queryFn: () => PedidosService.getAllWithDetails(filters),
  });
}

/**
 * Hook para obtener un pedido por ID
 */
export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.pedidos.detail(id!),
    queryFn: () => PedidosService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener un pedido por ID con detalles
 */
export function usePedidoWithDetails(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.pedidos.detail(id!), 'withDetails'],
    queryFn: () => PedidosService.getByIdWithDetails(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener pedidos por cliente
 */
export function usePedidosByCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.pedidos.lists(), 'byCliente', clienteId],
    queryFn: () => PedidosService.getByCliente(clienteId!),
    enabled: !!clienteId,
  });
}

/**
 * Hook para obtener pedidos por vendedor
 */
export function usePedidosByVendedor(vendedorId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.pedidos.lists(), 'byVendedor', vendedorId],
    queryFn: () => PedidosService.getByVendedor(vendedorId!),
    enabled: !!vendedorId,
  });
}

/**
 * Hook para obtener pedidos por estado
 */
export function usePedidosByEstado(estado: string) {
  return useQuery({
    queryKey: [...queryKeys.pedidos.lists(), 'byEstado', estado],
    queryFn: () => PedidosService.getByEstado(estado),
  });
}

/**
 * Hook para obtener estadísticas de pedidos
 */
export function usePedidosStats(filters?: PedidoFilters) {
  return useQuery({
    queryKey: queryKeys.pedidos.stats(filters),
    queryFn: () => PedidosService.getStats(filters),
  });
}

/**
 * Hook para crear un pedido completo
 */
export function useCreatePedido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreatePedidoInput) => PedidosService.create(input),
    onSuccess: () => {
      invalidateQueries.pedidos();
      toast({
        title: 'Pedido creado',
        description: 'El pedido ha sido creado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para crear un pedido desde el carrito
 */
export function useCreatePedidoFromCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      clienteId,
      vendedorId,
      cartItems,
      productos,
    }: {
      clienteId: string;
      vendedorId: string | undefined;
      cartItems: CartItem[];
      productos: Record<string, { precio_usd: number }>;
    }) => PedidosService.createFromCart(clienteId, vendedorId, cartItems, productos),
    onSuccess: () => {
      invalidateQueries.pedidos();
      toast({
        title: 'Pedido creado',
        description: 'El pedido ha sido creado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para actualizar un pedido
 */
export function useUpdatePedido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pedido> }) =>
      PedidosService.update(id, updates),
    onSuccess: (data) => {
      invalidateQueries.pedidos();
      queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.detail(data.id) });

      toast({
        title: 'Pedido actualizado',
        description: 'El pedido ha sido actualizado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para actualizar el estado de un pedido
 */
export function useUpdateEstadoPedido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      PedidosService.updateEstado(id, estado),
    onSuccess: (data) => {
      invalidateQueries.pedidos();
      queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.detail(data.id) });

      toast({
        title: 'Estado actualizado',
        description: 'El estado del pedido ha sido actualizado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para eliminar un pedido
 */
export function useDeletePedido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => PedidosService.delete(id),
    onSuccess: () => {
      invalidateQueries.pedidos();
      toast({
        title: 'Pedido eliminado',
        description: 'El pedido ha sido eliminado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
