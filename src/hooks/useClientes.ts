/**
 * Hooks de React Query para Clientes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientesService, type Cliente, type ClienteFilters, type NewCliente } from '@/services/clientes.service';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { useToast } from './use-toast';

/**
 * Hook para obtener todos los clientes
 */
export function useClientes(filters?: ClienteFilters) {
  return useQuery({
    queryKey: queryKeys.clientes.list(filters),
    queryFn: () => ClientesService.getAll(filters),
  });
}

/**
 * Hook para obtener clientes con información de vendedor
 */
export function useClientesWithVendedor(filters?: ClienteFilters) {
  return useQuery({
    queryKey: [...queryKeys.clientes.list(filters), 'withVendedor'],
    queryFn: () => ClientesService.getAllWithVendedor(filters),
  });
}

/**
 * Hook para obtener un cliente por ID
 */
export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clientes.detail(id!),
    queryFn: () => ClientesService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener un cliente por ID con vendedor
 */
export function useClienteWithVendedor(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.clientes.detail(id!), 'withVendedor'],
    queryFn: () => ClientesService.getByIdWithVendedor(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener clientes por vendedor
 */
export function useClientesByVendedor(vendedorId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.clientes.lists(), 'byVendedor', vendedorId],
    queryFn: () => ClientesService.getByVendedor(vendedorId!),
    enabled: !!vendedorId,
  });
}

/**
 * Hook para obtener estadísticas de clientes
 */
export function useClientesStats() {
  return useQuery({
    queryKey: queryKeys.clientes.stats,
    queryFn: () => ClientesService.getStats(),
  });
}

/**
 * Hook para crear un cliente
 */
export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (cliente: NewCliente) => ClientesService.create(cliente),
    onSuccess: () => {
      invalidateQueries.clientes();
      toast({
        title: 'Cliente creado',
        description: 'El cliente ha sido creado exitosamente',
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
 * Hook para actualizar un cliente
 */
export function useUpdateCliente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NewCliente> }) =>
      ClientesService.update(id, updates),
    onSuccess: (data) => {
      invalidateQueries.clientes();
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.detail(data.id) });

      toast({
        title: 'Cliente actualizado',
        description: 'El cliente ha sido actualizado exitosamente',
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
 * Hook para eliminar un cliente
 */
export function useDeleteCliente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => ClientesService.delete(id),
    onSuccess: () => {
      invalidateQueries.clientes();
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado exitosamente',
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
 * Hook para asignar vendedor a cliente
 */
export function useAsignarVendedor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clienteId, vendedorId }: { clienteId: string; vendedorId: string }) =>
      ClientesService.asignarVendedor(clienteId, vendedorId),
    onSuccess: (data) => {
      invalidateQueries.clientes();
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.detail(data.id) });

      toast({
        title: 'Vendedor asignado',
        description: 'El vendedor ha sido asignado al cliente exitosamente',
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
