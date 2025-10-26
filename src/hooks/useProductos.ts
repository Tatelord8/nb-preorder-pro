/**
 * Hooks de React Query para Productos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductosService, type Producto, type ProductFilters, type NewProducto } from '@/services/productos.service';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { useToast } from './use-toast';

/**
 * Hook para obtener todos los productos con filtros
 */
export function useProductos(filters?: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.productos.list(filters),
    queryFn: () => ProductosService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener productos con información de marca
 */
export function useProductosWithMarca(filters?: ProductFilters) {
  return useQuery({
    queryKey: [...queryKeys.productos.list(filters), 'withMarca'],
    queryFn: () => ProductosService.getAllWithMarca(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener un producto por ID
 */
export function useProducto(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.productos.detail(id!),
    queryFn: () => ProductosService.getById(id!),
    enabled: !!id, // Solo ejecutar si hay ID
  });
}

/**
 * Hook para obtener múltiples productos por IDs
 */
export function useProductosByIds(ids: string[]) {
  return useQuery({
    queryKey: [...queryKeys.productos.lists(), 'byIds', ids],
    queryFn: () => ProductosService.getByIds(ids),
    enabled: ids.length > 0,
  });
}

/**
 * Hook para obtener productos Game Plan
 */
export function useProductosGamePlan(filters?: Omit<ProductFilters, 'game_plan'>) {
  return useQuery({
    queryKey: [...queryKeys.productos.list(filters), 'gamePlan'],
    queryFn: () => ProductosService.getGamePlan(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener productos por tier del usuario
 */
export function useProductosByUserTier(userTier: string, additionalFilters?: ProductFilters) {
  return useQuery({
    queryKey: [...queryKeys.productos.lists(), 'byTier', userTier, additionalFilters],
    queryFn: () => ProductosService.getByUserTier(userTier, additionalFilters),
    enabled: !!userTier,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener rubros únicos
 */
export function useRubros() {
  return useQuery({
    queryKey: queryKeys.productos.rubros,
    queryFn: () => ProductosService.getRubros(),
    staleTime: 30 * 60 * 1000, // 30 minutos (raramente cambia)
  });
}

/**
 * Hook para obtener líneas únicas
 */
export function useLineas() {
  return useQuery({
    queryKey: queryKeys.productos.lineas,
    queryFn: () => ProductosService.getLineas(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook para obtener categorías únicas
 */
export function useCategorias() {
  return useQuery({
    queryKey: queryKeys.productos.categorias,
    queryFn: () => ProductosService.getCategorias(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook para obtener géneros únicos
 */
export function useGeneros() {
  return useQuery({
    queryKey: queryKeys.productos.generos,
    queryFn: () => ProductosService.getGeneros(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook para buscar productos
 */
export function useSearchProductos(searchTerm: string, filters?: Omit<ProductFilters, 'search'>) {
  return useQuery({
    queryKey: [...queryKeys.productos.lists(), 'search', searchTerm, filters],
    queryFn: () => ProductosService.search(searchTerm, filters),
    enabled: searchTerm.length >= 2, // Solo buscar si hay al menos 2 caracteres
  });
}

/**
 * Hook para contar productos
 */
export function useProductosCount(filters?: ProductFilters) {
  return useQuery({
    queryKey: [...queryKeys.productos.lists(), 'count', filters],
    queryFn: () => ProductosService.count(filters),
  });
}

/**
 * Hook para crear un producto
 */
export function useCreateProducto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (producto: NewProducto) => ProductosService.create(producto),
    onSuccess: () => {
      invalidateQueries.productos();
      toast({
        title: 'Producto creado',
        description: 'El producto ha sido creado exitosamente',
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
 * Hook para actualizar un producto
 */
export function useUpdateProducto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NewProducto> }) =>
      ProductosService.update(id, updates),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      invalidateQueries.productos();
      queryClient.invalidateQueries({ queryKey: queryKeys.productos.detail(data.id) });

      toast({
        title: 'Producto actualizado',
        description: 'El producto ha sido actualizado exitosamente',
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
 * Hook para eliminar un producto
 */
export function useDeleteProducto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => ProductosService.delete(id),
    onSuccess: () => {
      invalidateQueries.productos();
      toast({
        title: 'Producto eliminado',
        description: 'El producto ha sido eliminado exitosamente',
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
