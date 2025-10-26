/**
 * Servicio de Vendedores
 * Encapsula toda la lógica de gestión de vendedores con Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface Vendedor {
  id: string;
  nombre: string;
  created_at: string;
}

export interface VendedorUser {
  id: string;
  user_id: string;
  vendedor_id: string;
  created_at: string;
}

export interface VendedorConUser extends Vendedor {
  vendedores_users?: VendedorUser[];
}

export interface NewVendedor {
  nombre: string;
}

/**
 * Servicio para manejar operaciones de vendedores
 */
export class VendedoresService {
  /**
   * Obtiene todos los vendedores
   */
  static async getAll(): Promise<Vendedor[]> {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener vendedores:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener vendedores:', error);
      throw error;
    }
  }

  /**
   * Obtiene un vendedor por ID
   */
  static async getById(id: string): Promise<Vendedor | null> {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener vendedor por ID:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al obtener vendedor por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene un vendedor por user_id
   */
  static async getByUserId(userId: string): Promise<Vendedor | null> {
    try {
      const { data: vendedorUser, error: vendedorUserError } = await supabase
        .from('vendedores_users')
        .select('vendedor_id')
        .eq('user_id', userId)
        .single();

      if (vendedorUserError) {
        if (vendedorUserError.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener vendedor_user:', vendedorUserError);
        throw new Error(vendedorUserError.message);
      }

      if (!vendedorUser) {
        return null;
      }

      return this.getById(vendedorUser.vendedor_id);
    } catch (error) {
      console.error('Error inesperado al obtener vendedor por user_id:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo vendedor
   */
  static async create(vendedor: NewVendedor): Promise<Vendedor> {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .insert(vendedor)
        .select()
        .single();

      if (error) {
        console.error('Error al crear vendedor:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al crear vendedor:', error);
      throw error;
    }
  }

  /**
   * Actualiza un vendedor existente
   */
  static async update(id: string, updates: Partial<NewVendedor>): Promise<Vendedor> {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar vendedor:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al actualizar vendedor:', error);
      throw error;
    }
  }

  /**
   * Elimina un vendedor
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar vendedor:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error inesperado al eliminar vendedor:', error);
      throw error;
    }
  }

  /**
   * Vincula un vendedor con un usuario
   */
  static async linkUser(vendedorId: string, userId: string): Promise<VendedorUser> {
    try {
      const { data, error } = await supabase
        .from('vendedores_users')
        .insert({
          vendedor_id: vendedorId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error al vincular vendedor con usuario:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al vincular vendedor con usuario:', error);
      throw error;
    }
  }

  /**
   * Desvincula un vendedor de un usuario
   */
  static async unlinkUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendedores_users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error al desvincular vendedor de usuario:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error inesperado al desvincular vendedor de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene los clientes asignados a un vendedor
   */
  static async getClientes(vendedorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('vendedor_id', vendedorId)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener clientes del vendedor:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener clientes del vendedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un vendedor
   */
  static async getStats(vendedorId: string): Promise<{
    totalClientes: number;
    totalPedidos: number;
    totalVentas: number;
  }> {
    try {
      // Contar clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('vendedor_id', vendedorId);

      // Contar pedidos y sumar ventas
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('total_usd')
        .eq('vendedor_id', vendedorId);

      const totalPedidos = pedidos?.length || 0;
      const totalVentas = pedidos?.reduce((sum, p) => sum + p.total_usd, 0) || 0;

      return {
        totalClientes: clientesCount || 0,
        totalPedidos,
        totalVentas,
      };
    } catch (error) {
      console.error('Error inesperado al obtener stats de vendedor:', error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario está vinculado a un vendedor
   */
  static async isUserLinked(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('vendedores_users')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error al verificar si usuario está vinculado:', error);
        throw new Error(error.message);
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error inesperado al verificar vinculación de usuario:', error);
      throw error;
    }
  }

  /**
   * Busca vendedores por nombre
   */
  static async search(searchTerm: string): Promise<Vendedor[]> {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .ilike('nombre', `%${searchTerm}%`)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al buscar vendedores:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al buscar vendedores:', error);
      throw error;
    }
  }

  /**
   * Cuenta vendedores
   */
  static async count(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('vendedores')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error al contar vendedores:', error);
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error) {
      console.error('Error inesperado al contar vendedores:', error);
      throw error;
    }
  }
}
