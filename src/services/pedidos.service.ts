/**
 * Servicio de Pedidos
 * Encapsula toda la lógica de gestión de pedidos con Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from './supabase-cart.service';

export interface Pedido {
  id: string;
  cliente_id: string;
  vendedor_id?: string | null;
  total_usd: number;
  estado?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface PedidoDetalle {
  id: string;
  pedido_id: string;
  producto_id: string;
  curva_id?: string | null;
  cantidad_curvas: number;
  talles_cantidades: Record<string, number>;
  subtotal_usd: number;
  created_at: string;
}

export interface PedidoConDetalles extends Pedido {
  items_pedido?: PedidoDetalle[];
  clientes?: {
    id: string;
    nombre: string;
    tier: string;
  };
  vendedores?: {
    id: string;
    nombre: string;
  } | null;
}

export interface NewPedido {
  cliente_id: string;
  vendedor_id?: string;
  total_usd: number;
  estado?: string;
}

export interface NewPedidoDetalle {
  pedido_id: string;
  producto_id: string;
  curva_id?: string | null;
  cantidad_curvas: number;
  talles_cantidades: Record<string, number>;
  subtotal_usd: number;
}

export interface PedidoFilters {
  cliente_id?: string;
  vendedor_id?: string;
  estado?: string | string[];
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface CreatePedidoInput {
  cliente_id: string;
  vendedor_id?: string;
  items: Array<{
    producto_id: string;
    curva_id?: string | null;
    cantidad_curvas: number;
    talles: Record<string, number>;
    precio_unitario: number;
  }>;
}

/**
 * Servicio para manejar operaciones de pedidos
 */
export class PedidosService {
  /**
   * Obtiene todos los pedidos con filtros opcionales
   */
  static async getAll(filters?: PedidoFilters): Promise<Pedido[]> {
    try {
      let query = supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        if (filters.cliente_id) {
          query = query.eq('cliente_id', filters.cliente_id);
        }

        if (filters.vendedor_id) {
          query = query.eq('vendedor_id', filters.vendedor_id);
        }

        if (filters.estado) {
          if (Array.isArray(filters.estado)) {
            query = query.in('estado', filters.estado);
          } else {
            query = query.eq('estado', filters.estado);
          }
        }

        if (filters.fecha_desde) {
          query = query.gte('created_at', filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
          query = query.lte('created_at', filters.fecha_hasta);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener pedidos:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener pedidos:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los pedidos con detalles, cliente y vendedor
   */
  static async getAllWithDetails(filters?: PedidoFilters): Promise<PedidoConDetalles[]> {
    try {
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          items_pedido(
            *,
            productos(id, sku, nombre, rubro, precio_usd)
          ),
          clientes(id, nombre, tier),
          vendedores(id, nombre)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters) {
        if (filters.cliente_id) {
          query = query.eq('cliente_id', filters.cliente_id);
        }

        if (filters.vendedor_id) {
          query = query.eq('vendedor_id', filters.vendedor_id);
        }

        if (filters.estado) {
          if (Array.isArray(filters.estado)) {
            query = query.in('estado', filters.estado);
          } else {
            query = query.eq('estado', filters.estado);
          }
        }

        if (filters.fecha_desde) {
          query = query.gte('created_at', filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
          query = query.lte('created_at', filters.fecha_hasta);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener pedidos con detalles:', error);
        throw new Error(error.message);
      }

      // Debug: Verificar estructura de datos
      if (data && data.length > 0) {
        console.log('🔍 Debug getAllWithDetails - Primer pedido:', {
          id: data[0].id,
          estado: data[0].estado,
          itemsCount: data[0].items_pedido?.length || 0,
          primerItem: data[0].items_pedido?.[0] ? {
            id: data[0].items_pedido[0].id,
            producto_id: data[0].items_pedido[0].producto_id,
            cantidad: data[0].items_pedido[0].cantidad,
            tieneTallesCantidades: !!data[0].items_pedido[0].talles_cantidades,
            tallesKeys: data[0].items_pedido[0].talles_cantidades ? Object.keys(data[0].items_pedido[0].talles_cantidades) : 'N/A'
          } : 'Sin items'
        });
      }

      return data as any as PedidoConDetalles[] || [];
    } catch (error) {
      console.error('Error inesperado al obtener pedidos con detalles:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido por ID
   */
  static async getById(id: string): Promise<Pedido | null> {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener pedido por ID:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al obtener pedido por ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido por ID con detalles
   */
  static async getByIdWithDetails(id: string): Promise<PedidoConDetalles | null> {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          items_pedido(
            *,
            productos(id, sku, nombre, rubro, precio_usd)
          ),
          clientes(id, nombre, tier),
          vendedores(id, nombre)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener pedido con detalles por ID:', error);
        throw new Error(error.message);
      }

      return data as any as PedidoConDetalles;
    } catch (error) {
      console.error('Error inesperado al obtener pedido con detalles por ID:', error);
      throw error;
    }
  }

  /**
   * Crea un pedido completo con sus detalles (transacción)
   */
  static async create(input: CreatePedidoInput): Promise<PedidoConDetalles> {
    try {
      // Calcular total
      const total_usd = input.items.reduce((sum, item) => {
        // Las cantidades en talles ya están multiplicadas por cantidad_curvas
        const totalQty = Object.values(item.talles).reduce((q, qty) => q + qty, 0);
        return sum + (item.precio_unitario * totalQty);
      }, 0);

      // Crear pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: input.cliente_id,
          vendedor_id: input.vendedor_id,
          total_usd,
          estado: 'pendiente',
        })
        .select()
        .single();

      if (pedidoError) {
        console.error('Error al crear pedido:', pedidoError);
        throw new Error(pedidoError.message);
      }

      // Crear detalles del pedido
      const detalles: NewPedidoDetalle[] = input.items.map(item => {
        // Las cantidades en talles ya están multiplicadas por cantidad_curvas
        const totalQty = Object.values(item.talles).reduce((q, qty) => q + qty, 0);
        return {
          pedido_id: pedido.id,
          producto_id: item.producto_id,
          curva_id: item.curva_id,
          cantidad_curvas: item.cantidad_curvas,
          talles_cantidades: item.talles,
          subtotal_usd: item.precio_unitario * totalQty,
        };
      });

      const { data: pedidoDetalles, error: detallesError } = await supabase
        .from('items_pedido')
        .insert(detalles as any)
        .select();

      if (detallesError) {
        // Rollback: eliminar el pedido si falla la creación de detalles
        await supabase.from('pedidos').delete().eq('id', pedido.id);
        console.error('Error al crear detalles del pedido:', detallesError);
        throw new Error(detallesError.message);
      }

      // Retornar pedido completo
      return {
        ...pedido,
        items_pedido: pedidoDetalles,
      } as any as PedidoConDetalles;
    } catch (error) {
      console.error('Error inesperado al crear pedido:', error);
      throw error;
    }
  }

  /**
   * Crea un pedido desde items del carrito
   */
  static async createFromCart(
    clienteId: string,
    vendedorId: string | undefined,
    cartItems: CartItem[],
    productos: Record<string, { precio_usd: number }>
  ): Promise<PedidoConDetalles> {
    const items = cartItems.map(item => ({
      producto_id: item.productoId,
      curva_id: item.curvaId,
      cantidad_curvas: item.cantidadCurvas,
      talles: item.talles, // Las cantidades ya están multiplicadas por cantidadCurvas
      precio_unitario: productos[item.productoId]?.precio_usd || 0,
    }));

    return this.create({
      cliente_id: clienteId,
      vendedor_id: vendedorId,
      items,
    });
  }

  /**
   * Actualiza un pedido
   */
  static async update(id: string, updates: Partial<NewPedido>): Promise<Pedido> {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar pedido:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error inesperado al actualizar pedido:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un pedido
   */
  static async updateEstado(id: string, estado: string): Promise<Pedido> {
    return this.update(id, { estado });
  }

  /**
   * Elimina un pedido (y sus detalles en cascada)
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar pedido:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error inesperado al eliminar pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene pedidos por cliente
   */
  static async getByCliente(clienteId: string): Promise<Pedido[]> {
    return this.getAll({ cliente_id: clienteId });
  }

  /**
   * Obtiene pedidos por vendedor
   */
  static async getByVendedor(vendedorId: string): Promise<Pedido[]> {
    return this.getAll({ vendedor_id: vendedorId });
  }

  /**
   * Obtiene pedidos por estado
   */
  static async getByEstado(estado: string): Promise<Pedido[]> {
    return this.getAll({ estado });
  }

  /**
   * Cuenta pedidos con filtros
   */
  static async count(filters?: PedidoFilters): Promise<number> {
    try {
      let query = supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters) {
        if (filters.cliente_id) {
          query = query.eq('cliente_id', filters.cliente_id);
        }

        if (filters.vendedor_id) {
          query = query.eq('vendedor_id', filters.vendedor_id);
        }

        if (filters.estado) {
          if (Array.isArray(filters.estado)) {
            query = query.in('estado', filters.estado);
          } else {
            query = query.eq('estado', filters.estado);
          }
        }

        if (filters.fecha_desde) {
          query = query.gte('created_at', filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
          query = query.lte('created_at', filters.fecha_hasta);
        }
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error al contar pedidos:', error);
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error) {
      console.error('Error inesperado al contar pedidos:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de pedidos
   */
  static async getStats(filters?: PedidoFilters): Promise<{
    total: number;
    totalVentas: number;
    porEstado: Record<string, number>;
    promedioVenta: number;
  }> {
    try {
      const pedidos = await this.getAll(filters);

      const porEstado: Record<string, number> = {};
      let totalVentas = 0;

      pedidos.forEach(pedido => {
        const estado = pedido.estado || 'pendiente';
        porEstado[estado] = (porEstado[estado] || 0) + 1;
        totalVentas += pedido.total_usd;
      });

      return {
        total: pedidos.length,
        totalVentas,
        porEstado,
        promedioVenta: pedidos.length > 0 ? totalVentas / pedidos.length : 0,
      };
    } catch (error) {
      console.error('Error inesperado al obtener stats de pedidos:', error);
      throw error;
    }
  }
}
