/**
 * Hooks de React Query para Autenticación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService, type LoginCredentials, type SignupCredentials } from '@/services/auth.service';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Hook para obtener la sesión actual
 */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => AuthService.getSession(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener el usuario actual
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => AuthService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener información completa del usuario autenticado
 */
export function useCurrentUserInfo() {
  return useQuery({
    queryKey: [...queryKeys.auth.user, 'fullInfo'],
    queryFn: () => AuthService.getCurrentUserInfo(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener el rol de un usuario
 */
export function useUserRole(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auth.userRole(userId!),
    queryFn: () => AuthService.getUserRole(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook para login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
    onSuccess: (data) => {
      // Actualizar caché de sesión
      queryClient.setQueryData(queryKeys.auth.session, data.session);
      queryClient.setQueryData(queryKeys.auth.user, data.user);

      toast({
        title: 'Bienvenido',
        description: `Has iniciado sesión como ${data.user.email}`,
      });

      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para signup
 */
export function useSignup() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (credentials: SignupCredentials) => AuthService.signup(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.session, data.session);
      queryClient.setQueryData(queryKeys.auth.user, data.user);

      toast({
        title: 'Cuenta creada',
        description: 'Tu cuenta ha sido creada exitosamente',
      });

      navigate('/welcome');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al crear cuenta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      // Limpiar toda la caché
      queryClient.clear();

      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });

      navigate('/login');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para verificar si el usuario es admin
 */
export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.auth.userRole(userId!), 'isAdmin'],
    queryFn: () => AuthService.isAdmin(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook para verificar si el usuario es vendedor
 */
export function useIsVendedor(userId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.auth.userRole(userId!), 'isVendedor'],
    queryFn: () => AuthService.isVendedor(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook para obtener el vendedor_id de un usuario
 */
export function useVendedorId(userId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.auth.userRole(userId!), 'vendedorId'],
    queryFn: () => AuthService.getVendedorId(userId!),
    enabled: !!userId,
  });
}
