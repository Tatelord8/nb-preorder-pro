/**
 * Hooks de React Query para Vendedores
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VendedoresService, type Vendedor, type NewVendedor } from '@/services/vendedores.service';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { useToast } from './use-toast';

/**
 * Hook para obtener todos los vendedores
 */
export function useVendedores() {
  return useQuery({
    queryKey: queryKeys.vendedores.list(),
    queryFn: () => VendedoresService.getAll(),
  });
}

/**
 * Hook para obtener un vendedor por ID
 */
export function useVendedor(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vendedores.detail(id!),
    queryFn: () => VendedoresService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener un vendedor por user_id
 */
export function useVendedorByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vendedores.byUser(userId!),
    queryFn: () => VendedoresService.getByUserId(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook para obtener clientes de un vendedor
 */
export function useVendedorClientes(vendedorId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vendedores.detail(vendedorId!), 'clientes'],
    queryFn: () => VendedoresService.getClientes(vendedorId!),
    enabled: !!vendedorId,
  });
}

/**
 * Hook para obtener estadísticas de un vendedor
 */
export function useVendedorStats(vendedorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vendedores.stats(vendedorId!),
    queryFn: () => VendedoresService.getStats(vendedorId!),
    enabled: !!vendedorId,
  });
}

/**
 * Hook para crear un vendedor
 */
export function useCreateVendedor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (vendedor: NewVendedor) => VendedoresService.create(vendedor),
    onSuccess: () => {
      invalidateQueries.vendedores();
      toast({
        title: 'Vendedor creado',
        description: 'El vendedor ha sido creado exitosamente',
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
 * Hook para actualizar un vendedor
 */
export function useUpdateVendedor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NewVendedor> }) =>
      VendedoresService.update(id, updates),
    onSuccess: (data) => {
      invalidateQueries.vendedores();
      queryClient.invalidateQueries({ queryKey: queryKeys.vendedores.detail(data.id) });

      toast({
        title: 'Vendedor actualizado',
        description: 'El vendedor ha sido actualizado exitosamente',
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
 * Hook para eliminar un vendedor
 */
export function useDeleteVendedor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => VendedoresService.delete(id),
    onSuccess: () => {
      invalidateQueries.vendedores();
      toast({
        title: 'Vendedor eliminado',
        description: 'El vendedor ha sido eliminado exitosamente',
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
 * Hook para vincular un vendedor con un usuario
 */
export function useLinkVendedorUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ vendedorId, userId }: { vendedorId: string; userId: string }) =>
      VendedoresService.linkUser(vendedorId, userId),
    onSuccess: () => {
      invalidateQueries.vendedores();
      toast({
        title: 'Vendedor vinculado',
        description: 'El vendedor ha sido vinculado al usuario exitosamente',
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
 * Hook para desvincular un vendedor de un usuario
 */
export function useUnlinkVendedorUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => VendedoresService.unlinkUser(userId),
    onSuccess: () => {
      invalidateQueries.vendedores();
      toast({
        title: 'Vendedor desvinculado',
        description: 'El vendedor ha sido desvinculado del usuario exitosamente',
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
 * Hook para buscar vendedores
 */
export function useSearchVendedores(searchTerm: string) {
  return useQuery({
    queryKey: [...queryKeys.vendedores.lists(), 'search', searchTerm],
    queryFn: () => VendedoresService.search(searchTerm),
    enabled: searchTerm.length >= 2,
  });
}
