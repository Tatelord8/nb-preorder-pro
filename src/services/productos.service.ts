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
      // Obtener el total real de filas con los mismos filtros
      let countQ = supabase.from('productos').select('*', { count: 'exact', head: true });
      if (filters) {
        if (filters.tier) countQ = Array.isArray(filters.tier) ? countQ.in('tier', filters.tier) : countQ.eq('tier', filters.tier);
        if (filters.rubro) countQ = Array.isArray(filters.rubro) ? countQ.in('rubro', filters.rubro) : countQ.eq('rubro', filters.rubro);
        if (filters.marca_id) countQ = countQ.eq('marca_id', filters.marca_id);
        if (filters.genero) countQ = countQ.eq('genero', filters.genero);
        if (filters.game_plan !== undefined) countQ = countQ.eq('game_plan', filters.game_plan);
        if (filters.categoria) countQ = countQ.eq('categoria', filters.categoria);
        if (filters.linea) countQ = countQ.eq('linea', filters.linea);
        if (filters.search) countQ = countQ.or(`sku.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`);
      }
      const { count, error: countError } = await countQ;
      if (countError) throw new Error(countError.message);
      if (!count) return [];

      // Paginar en bloques de 1000 (límite de Supabase)
      const PAGE_SIZE = 1000;
      const totalPages = Math.ceil(count / PAGE_SIZE);
      const results: Producto[] = [];

      for (let page = 0; page < totalPages; page++) {
        let q = supabase
          .from('productos')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (filters) {
          if (filters.tier) q = Array.isArray(filters.tier) ? q.in('tier', filters.tier) : q.eq('tier', filters.tier);
          if (filters.rubro) q = Array.isArray(filters.rubro) ? q.in('rubro', filters.rubro) : q.eq('rubro', filters.rubro);
          if (filters.marca_id) q = q.eq('marca_id', filters.marca_id);
          if (filters.genero) q = q.eq('genero', filters.genero);
          if (filters.game_plan !== undefined) q = q.eq('game_plan', filters.game_plan);
          if (filters.categoria) q = q.eq('categoria', filters.categoria);
          if (filters.linea) q = q.eq('linea', filters.linea);
          if (filters.search) q = q.or(`sku.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`);
        }

        const { data, error } = await q;
        if (error) throw new Error(error.message);
        if (data) results.push(...data);
      }

      return results;
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
      // Obtener total con filtros
      let countQ = supabase.from('productos').select('*', { count: 'exact', head: true });
      if (filters) {
        if (filters.tier) countQ = Array.isArray(filters.tier) ? countQ.in('tier', filters.tier) : countQ.eq('tier', filters.tier);
        if (filters.rubro) countQ = Array.isArray(filters.rubro) ? countQ.in('rubro', filters.rubro) : countQ.eq('rubro', filters.rubro);
        if (filters.marca_id) countQ = countQ.eq('marca_id', filters.marca_id);
        if (filters.genero) countQ = countQ.eq('genero', filters.genero);
        if (filters.game_plan !== undefined) countQ = countQ.eq('game_plan', filters.game_plan);
        if (filters.categoria) countQ = countQ.eq('categoria', filters.categoria);
        if (filters.linea) countQ = countQ.eq('linea', filters.linea);
        if (filters.search) countQ = countQ.or(`sku.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`);
      }
      const { count, error: countError } = await countQ;
      if (countError) throw new Error(countError.message);
      if (!count) return [];

      const PAGE_SIZE = 1000;
      const totalPages = Math.ceil(count / PAGE_SIZE);
      const results: ProductoConMarca[] = [];

      for (let page = 0; page < totalPages; page++) {
        let q = supabase
          .from('productos')
          .select('*, marcas(id, nombre)')
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (filters) {
          if (filters.tier) q = Array.isArray(filters.tier) ? q.in('tier', filters.tier) : q.eq('tier', filters.tier);
          if (filters.rubro) q = Array.isArray(filters.rubro) ? q.in('rubro', filters.rubro) : q.eq('rubro', filters.rubro);
          if (filters.marca_id) q = q.eq('marca_id', filters.marca_id);
          if (filters.genero) q = q.eq('genero', filters.genero);
          if (filters.game_plan !== undefined) q = q.eq('game_plan', filters.game_plan);
          if (filters.categoria) q = q.eq('categoria', filters.categoria);
          if (filters.linea) q = q.eq('linea', filters.linea);
          if (filters.search) q = q.or(`sku.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`);
        }

        const { data, error } = await q;
        if (error) throw new Error(error.message);
        if (data) results.push(...(data as ProductoConMarca[]));
      }

      return results;
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
    const tierNumber = parseInt(userTier);
    // Tier 0 (Premium) ve todos los productos
    if (tierNumber === 0) {
      return this.getAll({ ...additionalFilters });
    }
    // Tier N ve productos de tier N hasta 3 (igual que canUserAccessTier y el Catálogo)
    const allowedTiers = Array.from({ length: 4 - tierNumber }, (_, i) => (i + tierNumber).toString());
    return this.getAll({ ...additionalFilters, tier: allowedTiers });
  }

  /** Helper: pagina una columna y devuelve sus valores únicos no nulos */
  private static async fetchDistinctColumn(column: 'rubro' | 'linea' | 'categoria' | 'genero'): Promise<string[]> {
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    if (countError) throw new Error(countError.message);
    if (!count) return [];

    const PAGE_SIZE = 1000;
    const totalPages = Math.ceil(count / PAGE_SIZE);
    const seen = new Set<string>();

    for (let page = 0; page < totalPages; page++) {
      const { data, error } = await supabase
        .from('productos')
        .select(column)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      data?.forEach((row) => { if (row[column]) seen.add(row[column] as string); });
    }

    return [...seen].sort();
  }

  static async getRubros(): Promise<string[]> {
    try {
      return await this.fetchDistinctColumn('rubro');
    } catch (error) {
      console.error('Error inesperado al obtener rubros:', error);
      throw error;
    }
  }

  static async getLineas(): Promise<string[]> {
    try {
      return await this.fetchDistinctColumn('linea');
    } catch (error) {
      console.error('Error inesperado al obtener líneas:', error);
      throw error;
    }
  }

  static async getCategorias(): Promise<string[]> {
    try {
      return await this.fetchDistinctColumn('categoria');
    } catch (error) {
      console.error('Error inesperado al obtener categorías:', error);
      throw error;
    }
  }

  static async getGeneros(): Promise<string[]> {
    try {
      return await this.fetchDistinctColumn('genero');
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
