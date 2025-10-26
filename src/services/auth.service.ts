/**
 * Servicio de Autenticación
 * Encapsula toda la lógica de autenticación con Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  nombre?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'superadmin' | 'admin' | 'vendedor' | 'cliente';
  cliente_id?: string;
  created_at: string;
}

export interface ClienteInfo {
  id: string;
  nombre: string;
  tier: string;
  vendedor_id?: string;
  vendedores?: {
    id: string;
    nombre: string;
  };
}

export interface AuthUser {
  user: User;
  session: Session;
  userRole?: UserRole;
  clienteInfo?: ClienteInfo;
}

/**
 * Servicio para manejar autenticación y sesiones
 */
export class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  static async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Error al iniciar sesión:', error);
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('No se pudo iniciar sesión');
    }

    // Cargar información adicional del usuario
    const userRole = await this.getUserRole(data.user.id);
    const clienteInfo = userRole ? await this.getClienteInfo(userRole) : undefined;

    return {
      user: data.user,
      session: data.session,
      userRole,
      clienteInfo,
    };
  }

  /**
   * Registra un nuevo usuario
   */
  static async signup(credentials: SignupCredentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          nombre: credentials.nombre,
        },
      },
    });

    if (error) {
      console.error('Error al registrarse:', error);
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('No se pudo registrar el usuario');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Cierra la sesión del usuario actual
   */
  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error al cerrar sesión:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Obtiene la sesión actual
   */
  static async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error al obtener sesión:', error);
      return null;
    }

    return data.session;
  }

  /**
   * Obtiene el usuario actual
   */
  static async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  /**
   * Obtiene el rol del usuario
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error al obtener rol de usuario:', error);
        return null;
      }

      return data as UserRole;
    } catch (error) {
      console.error('Error inesperado al obtener rol:', error);
      return null;
    }
  }

  /**
   * Obtiene la información del cliente asociada al usuario
   */
  static async getClienteInfo(userRole: UserRole): Promise<ClienteInfo | null> {
    try {
      let clienteId: string | undefined;

      // Determinar el cliente_id según el rol
      if (userRole.role === 'cliente') {
        // Para clientes, el user_id ES el cliente_id
        clienteId = userRole.user_id;
      } else if (userRole.cliente_id) {
        // Para otros roles, usar cliente_id si existe
        clienteId = userRole.cliente_id;
      }

      if (!clienteId) {
        return null;
      }

      // Obtener información del cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nombre, tier, vendedor_id')
        .eq('id', clienteId)
        .single();

      if (clienteError || !cliente) {
        console.error('Error al obtener info de cliente:', clienteError);
        return null;
      }

      // Obtener información del vendedor si existe
      if (cliente.vendedor_id) {
        const { data: vendedor, error: vendedorError } = await supabase
          .from('vendedores')
          .select('id, nombre')
          .eq('id', cliente.vendedor_id)
          .single();

        if (!vendedorError && vendedor) {
          return {
            ...cliente,
            vendedores: vendedor,
          };
        }
      }

      return cliente;
    } catch (error) {
      console.error('Error inesperado al obtener info de cliente:', error);
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  static async hasRole(
    userId: string,
    role: 'superadmin' | 'admin' | 'vendedor' | 'cliente'
  ): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    return userRole?.role === role;
  }

  /**
   * Verifica si el usuario es admin o superadmin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    return userRole?.role === 'admin' || userRole?.role === 'superadmin';
  }

  /**
   * Verifica si el usuario es vendedor
   */
  static async isVendedor(userId: string): Promise<boolean> {
    return await this.hasRole(userId, 'vendedor');
  }

  /**
   * Obtiene el vendedor_id asociado al usuario (si es vendedor)
   */
  static async getVendedorId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('vendedores_users')
        .select('vendedor_id')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.vendedor_id;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene información completa del usuario autenticado actual
   */
  static async getCurrentUserInfo(): Promise<AuthUser | null> {
    const session = await this.getSession();

    if (!session || !session.user) {
      return null;
    }

    const userRole = await this.getUserRole(session.user.id);
    const clienteInfo = userRole ? await this.getClienteInfo(userRole) : undefined;

    return {
      user: session.user,
      session,
      userRole,
      clienteInfo,
    };
  }

  /**
   * Restablece la contraseña del usuario
   */
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error al restablecer contraseña:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error al actualizar contraseña:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Suscribe a cambios de autenticación
   */
  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}
