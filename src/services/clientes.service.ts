/**
 * Servicio de Clientes
 * Encapsula toda la lógica de gestión de clientes con Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface Cliente {
  id: string;
  nombre: string;
  tier: string;
  vendedor_id?: string | null;
  created_at: string;
}

export interface ClienteConVendedor extends Cliente {
  vendedores?: {
    id: string;
    nombre: string;
  } | null;
}

export interface NewCliente {
  nombre: string;
  tier: string;
  vendedor_id?: string;
}

export interface ClienteFilters {
  tier?: string | string[];
  vendedor_id?: string;
  search?: string; // Búsqueda por nombre
}

/**
 * Servicio para manejar operaciones de clientes
 */
export class ClientesService {
  /**
   * Obtiene todos los clientes con filtros opcionales
   */
  static async getAll(filters?: ClienteFilters): Promise<Cliente[]> {
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      // Aplicar filtros
      if (filters) {
        if (filters.tier) {
          if (Array.isArray(filters.tier)) {
            query = query.in('tier', filters.tier);
          } else {
            query = query.eq('tier', filters.tier);
          }
        }

        if (filters.vendedor_id) {
          query = query.eq('vendedor_id', filters.vendedor_id);
        }

        if (filters.search) {
          query = query.ilike('nombre', `%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener clientes:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener clientes:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los clientes con información del vendedor
   */
  static async getAllWithVendedor(filters?: ClienteFilters): Promise<ClienteConVendedor[]> {
    try {
      let query = supabase
        .from('clientes')
        .select('*, vendedores(id, nombre)')
        .order('nombre', { ascending: true });

      // Aplicar filtros
      if (filters) {
        if (filters.tier) {
          if (Array.isArray(filters.tier)) {
            query = query.in('tier', filters.tier);
          } else {
            query = query.eq('tier', filters.tier);
          }
        }

        if (filters.vendedor_id) {
          query = query.eq('vendedor_id', filters.vendedor_id);
        }

        if (filters.search) {
          query = query.ilike('nombre', `%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener clientes con vendedor:', error);
        throw new Error(error.message);
      }

      return data as unknown as ClienteConVendedor[] || [];
    } catch (error) {
      console.error('Error inesperado al obtener clientes con vendedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene un cliente por ID
   */
  static async getById(id: string): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No encontrado
          return null;
        }
        console.error('Error al obtener cliente por ID:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al obtener cliente por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene un cliente por ID con información del vendedor
   */
  static async getByIdWithVendedor(id: string): Promise<ClienteConVendedor | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, vendedores(id, nombre)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener cliente con vendedor por ID:', error);
        throw new Error(error.message);
      }

      return data as unknown as ClienteConVendedor;
    } catch (error) {
      console.error('Error inesperado al obtener cliente con vendedor por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene clientes por vendedor
   */
  static async getByVendedor(vendedorId: string): Promise<Cliente[]> {
    return this.getAll({ vendedor_id: vendedorId });
  }

  /**
   * Obtiene clientes por tier
   */
  static async getByTier(tier: string): Promise<Cliente[]> {
    return this.getAll({ tier });
  }

  /**
   * Crea un nuevo cliente
   */
  static async create(cliente: NewCliente): Promise<Cliente> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single();

      if (error) {
        console.error('Error al crear cliente:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al crear cliente:', error);
      throw error;
    }
  }

  /**
   * Actualiza un cliente existente
   */
  static async update(id: string, updates: Partial<NewCliente>): Promise<Cliente> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar cliente:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al actualizar cliente:', error);
      throw error;
    }
  }

  /**
   * Elimina un cliente
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar cliente:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error inesperado al eliminar cliente:', error);
      throw error;
    }
  }

  /**
   * Asigna un vendedor a un cliente
   */
  static async asignarVendedor(clienteId: string, vendedorId: string): Promise<Cliente> {
    return this.update(clienteId, { vendedor_id: vendedorId });
  }

  /**
   * Desasigna el vendedor de un cliente
   */
  static async desasignarVendedor(clienteId: string): Promise<Cliente> {
    return this.update(clienteId, { vendedor_id: null });
  }

  /**
   * Busca clientes por nombre
   */
  static async search(searchTerm: string): Promise<Cliente[]> {
    return this.getAll({ search: searchTerm });
  }

  /**
   * Cuenta clientes con filtros
   */
  static async count(filters?: ClienteFilters): Promise<number> {
    try {
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters) {
        if (filters.tier) {
          if (Array.isArray(filters.tier)) {
            query = query.in('tier', filters.tier);
          } else {
            query = query.eq('tier', filters.tier);
          }
        }

        if (filters.vendedor_id) {
          query = query.eq('vendedor_id', filters.vendedor_id);
        }

        if (filters.search) {
          query = query.ilike('nombre', `%${filters.search}%`);
        }
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error al contar clientes:', error);
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error) {
      console.error('Error inesperado al contar clientes:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de clientes
   */
  static async getStats(): Promise<{
    total: number;
    porTier: Record<string, number>;
    conVendedor: number;
    sinVendedor: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('tier, vendedor_id');

      if (error) {
        console.error('Error al obtener stats de clientes:', error);
        throw new Error(error.message);
      }

      const clientes = data || [];

      const porTier: Record<string, number> = {};
      let conVendedor = 0;
      let sinVendedor = 0;

      clientes.forEach(cliente => {
        // Contar por tier
        porTier[cliente.tier] = (porTier[cliente.tier] || 0) + 1;

        // Contar con/sin vendedor
        if (cliente.vendedor_id) {
          conVendedor++;
        } else {
          sinVendedor++;
        }
      });

      return {
        total: clientes.length,
        porTier,
        conVendedor,
        sinVendedor,
      };
    } catch (error) {
      console.error('Error inesperado al obtener stats de clientes:', error);
      throw error;
    }
  }

  /**
   * Verifica si un cliente existe por nombre
   */
  static async existsByNombre(nombre: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('nombre', nombre);

      if (error) {
        console.error('Error al verificar cliente por nombre:', error);
        throw new Error(error.message);
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error inesperado al verificar cliente por nombre:', error);
      throw error;
    }
  }
}
