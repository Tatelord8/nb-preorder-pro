/**
 * Configuración de React Query
 * QueryClient global para caché y gestión de estado del servidor
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración del QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran frescos (5 minutos)
      staleTime: 5 * 60 * 1000,

      // Tiempo que los datos inactivos permanecen en caché (10 minutos)
      gcTime: 10 * 60 * 1000,

      // Reintentar en caso de error
      retry: 1,

      // No refetch automático en window focus para evitar llamadas innecesarias
      refetchOnWindowFocus: false,

      // Refetch en reconexión
      refetchOnReconnect: true,

      // No refetch en mount si los datos son frescos
      refetchOnMount: false,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: 1,
    },
  },
});

/**
 * Keys de queries para organización y type safety
 */
export const queryKeys = {
  // Productos
  productos: {
    all: ['productos'] as const,
    lists: () => [...queryKeys.productos.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.productos.lists(), { filters }] as const,
    details: () => [...queryKeys.productos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.productos.details(), id] as const,
    rubros: ['productos', 'rubros'] as const,
    lineas: ['productos', 'lineas'] as const,
    categorias: ['productos', 'categorias'] as const,
    generos: ['productos', 'generos'] as const,
  },

  // Clientes
  clientes: {
    all: ['clientes'] as const,
    lists: () => [...queryKeys.clientes.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.clientes.lists(), { filters }] as const,
    details: () => [...queryKeys.clientes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clientes.details(), id] as const,
    stats: ['clientes', 'stats'] as const,
  },

  // Pedidos
  pedidos: {
    all: ['pedidos'] as const,
    lists: () => [...queryKeys.pedidos.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.pedidos.lists(), { filters }] as const,
    details: () => [...queryKeys.pedidos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pedidos.details(), id] as const,
    stats: (filters?: any) => ['pedidos', 'stats', { filters }] as const,
  },

  // Vendedores
  vendedores: {
    all: ['vendedores'] as const,
    lists: () => [...queryKeys.vendedores.all, 'list'] as const,
    list: () => [...queryKeys.vendedores.lists()] as const,
    details: () => [...queryKeys.vendedores.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vendedores.details(), id] as const,
    byUser: (userId: string) => ['vendedores', 'byUser', userId] as const,
    stats: (id: string) => ['vendedores', 'stats', id] as const,
  },

  // Auth
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
    userRole: (userId: string) => ['auth', 'userRole', userId] as const,
    clienteInfo: (userId: string) => ['auth', 'clienteInfo', userId] as const,
  },

  // Marcas
  marcas: {
    all: ['marcas'] as const,
    lists: () => [...queryKeys.marcas.all, 'list'] as const,
  },

  // Curvas
  curvas: {
    all: ['curvas_predefinidas'] as const,
    lists: () => [...queryKeys.curvas.all, 'list'] as const,
    byGenero: (genero: string) => ['curvas_predefinidas', 'genero', genero] as const,
  },
};

/**
 * Utilidades para invalidación de queries
 */
export const invalidateQueries = {
  productos: () => queryClient.invalidateQueries({ queryKey: queryKeys.productos.all }),
  clientes: () => queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all }),
  pedidos: () => queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.all }),
  vendedores: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendedores.all }),
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.session }),
};
