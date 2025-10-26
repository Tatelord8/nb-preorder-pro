/**
 * Servicio de Productos
 * Encapsula toda la lógica de gestión de productos con Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  linea: string;
  categoria: string;
  genero: string;
  game_plan: boolean;
  imagen_url?: string | null;
  marca_id: string;
  rubro: string;
  tier: string;
  xfd: string;
  fecha_despacho: string;
  created_at: string;
}

export interface ProductoConMarca extends Producto {
  marcas?: {
    id: string;
    nombre: string;
  };
}

export interface ProductFilters {
  tier?: string | string[];
  rubro?: string | string[];
  marca_id?: string;
  genero?: string;
  game_plan?: boolean;
  categoria?: string;
  linea?: string;
  search?: string; // Búsqueda por SKU o nombre
}

export interface NewProducto {
  sku: string;
  nombre: string;
  precio_usd: number;
  linea: string;
  categoria: string;
  genero: string;
  game_plan?: boolean;
  imagen_url?: string;
  marca_id: string;
  rubro: string;
  tier: string;
  xfd: string;
  fecha_despacho: string;
}

/**
 * Servicio para manejar operaciones de productos
 */
export class ProductosService {
  /**
   * Obtiene todos los productos con filtros opcionales
   */
  static async getAll(filters?: ProductFilters): Promise<Producto[]> {
    try {
      let query = supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        if (filters.tier) {
          if (Array.isArray(filters.tier)) {
            query = query.in('tier', filters.tier);
          } else {
            query = query.eq('tier', filters.tier);
          }
        }

        if (filters.rubro) {
          if (Array.isArray(filters.rubro)) {
            query = query.in('rubro', filters.rubro);
          } else {
            query = query.eq('rubro', filters.rubro);
          }
        }

        if (filters.marca_id) {
          query = query.eq('marca_id', filters.marca_id);
        }

        if (filters.genero) {
          query = query.eq('genero', filters.genero);
        }

        if (filters.game_plan !== undefined) {
          query = query.eq('game_plan', filters.game_plan);
        }

        if (filters.categoria) {
          query = query.eq('categoria', filters.categoria);
        }

        if (filters.linea) {
          query = query.eq('linea', filters.linea);
        }

        if (filters.search) {
          query = query.or(
            `sku.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener productos:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener productos:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos con información de marca
   */
  static async getAllWithMarca(filters?: ProductFilters): Promise<ProductoConMarca[]> {
    try {
      let query = supabase
        .from('productos')
        .select('*, marcas(id, nombre)')
        .order('created_at', { ascending: false });

      // Aplicar filtros (igual que getAll)
      if (filters) {
        if (filters.tier) {
          if (Array.isArray(filters.tier)) {
            query = query.in('tier', filters.tier);
          } else {
            query = query.eq('tier', filters.tier);
          }
        }

        if (filters.rubro) {
          if (Array.isArray(filters.rubro)) {
            query = query.in('rubro', filters.rubro);
          } else {
            query = query.eq('rubro', filters.rubro);
          }
        }

        if (filters.marca_id) {
          query = query.eq('marca_id', filters.marca_id);
        }

        if (filters.genero) {
          query = query.eq('genero', filters.genero);
        }

        if (filters.game_plan !== undefined) {
          query = query.eq('game_plan', filters.game_plan);
        }

        if (filters.categoria) {
          query = query.eq('categoria', filters.categoria);
        }

        if (filters.linea) {
          query = query.eq('linea', filters.linea);
        }

        if (filters.search) {
          query = query.or(
            `sku.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener productos con marca:', error);
        throw new Error(error.message);
      }

      return data as ProductoConMarca[] || [];
    } catch (error) {
      console.error('Error inesperado al obtener productos con marca:', error);
      throw error;
    }
  }

  /**
   * Obtiene un producto por ID
   */
  static async getById(id: string): Promise<Producto | null> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No encontrado
          return null;
        }
        console.error('Error al obtener producto por ID:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al obtener producto por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene un producto por SKU
   */
  static async getBySku(sku: string): Promise<Producto | null> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('sku', sku)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener producto por SKU:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al obtener producto por SKU:', error);
      throw error;
    }
  }

  /**
   * Obtiene múltiples productos por IDs
   */
  static async getByIds(ids: string[]): Promise<Producto[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .in('id', ids);

      if (error) {
        console.error('Error al obtener productos por IDs:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener productos por IDs:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo producto
   */
  static async create(producto: NewProducto): Promise<Producto> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert(producto)
        .select()
        .single();

      if (error) {
        console.error('Error al crear producto:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al crear producto:', error);
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   */
  static async update(id: string, updates: Partial<NewProducto>): Promise<Producto> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar producto:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al actualizar producto:', error);
      throw error;
    }
  }

  /**
   * Elimina un producto
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar producto:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error inesperado al eliminar producto:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos Game Plan
   */
  static async getGamePlan(filters?: Omit<ProductFilters, 'game_plan'>): Promise<Producto[]> {
    return this.getAll({ ...filters, game_plan: true });
  }

  /**
   * Obtiene productos por tier del usuario
   */
  static async getByUserTier(userTier: string, additionalFilters?: ProductFilters): Promise<Producto[]> {
    // El usuario puede ver productos de su tier o tiers inferiores
    const tierNumber = parseInt(userTier);
    const allowedTiers = Array.from({ length: tierNumber + 1 }, (_, i) => i.toString());

    return this.getAll({
      ...additionalFilters,
      tier: allowedTiers,
    });
  }

  /**
   * Obtiene todos los rubros únicos
   */
  static async getRubros(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('rubro')
        .order('rubro');

      if (error) {
        console.error('Error al obtener rubros:', error);
        throw new Error(error.message);
      }

      // Extraer valores únicos
      const rubros = [...new Set(data?.map(p => p.rubro) || [])];
      return rubros.filter(Boolean); // Remover valores null/undefined
    } catch (error) {
      console.error('Error inesperado al obtener rubros:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las líneas únicas
   */
  static async getLineas(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('linea')
        .order('linea');

      if (error) {
        console.error('Error al obtener líneas:', error);
        throw new Error(error.message);
      }

      const lineas = [...new Set(data?.map(p => p.linea) || [])];
      return lineas.filter(Boolean);
    } catch (error) {
      console.error('Error inesperado al obtener líneas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las categorías únicas
   */
  static async getCategorias(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('categoria')
        .order('categoria');

      if (error) {
        console.error('Error al obtener categorías:', error);
        throw new Error(error.message);
      }

      const categorias = [...new Set(data?.map(p => p.categoria) || [])];
      return categorias.filter(Boolean);
    } catch (error) {
      console.error('Error inesperado al obtener categorías:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los géneros únicos
   */
  static async getGeneros(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('genero')
        .order('genero');

      if (error) {
        console.error('Error al obtener géneros:', error);
        throw new Error(error.message);
      }

      const generos = [...new Set(data?.map(p => p.genero) || [])];
      return generos.filter(Boolean);
    } catch (error) {
      console.error('Error inesperado al obtener géneros:', error);
      throw error;
    }
  }

  /**
   * Busca productos por texto (SKU o nombre)
   */
  static async search(searchTerm: string, filters?: Omit<ProductFilters, 'search'>): Promise<Producto[]> {
    return this.getAll({ ...filters, search: searchTerm });
  }

  /**
   * Cuenta productos con filtros
   */
  static async count(filters?: ProductFilters): Promise<number> {
    try {
      let query = supabase
        .from('productos')
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

        if (filters.rubro) {
          if (Array.isArray(filters.rubro)) {
            query = query.in('rubro', filters.rubro);
          } else {
            query = query.eq('rubro', filters.rubro);
          }
        }

        if (filters.marca_id) {
          query = query.eq('marca_id', filters.marca_id);
        }

        if (filters.genero) {
          query = query.eq('genero', filters.genero);
        }

        if (filters.game_plan !== undefined) {
          query = query.eq('game_plan', filters.game_plan);
        }
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error al contar productos:', error);
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error) {
      console.error('Error inesperado al contar productos:', error);
      throw error;
    }
  }
}
