/**
 * Servicio de Carrito Supabase
 * Maneja la persistencia del carrito en la base de datos
 */

import { supabase } from '@/integrations/supabase/client';

export interface CartItemTalle {
  [talle: string]: number;
}

export interface CartItem {
  productoId: string;
  curvaId: string | null;
  cantidadCurvas: number;
  talles: CartItemTalle;
  type: 'predefined' | 'custom';
  genero?: string;
  opcion?: number;
  precio_usd?: number;
}

export interface SupabaseCart {
  id: string;
  user_id: string;
  cliente_id: string;
  items: CartItem[];
  total_items: number;
  total_unidades: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export class SupabaseCartService {
  /**
   * Obtiene el carrito del usuario desde Supabase
   */
  static async getCart(userId: string): Promise<CartItem[]> {
    try {
      console.log('🛒 Obteniendo carrito desde Supabase para usuario:', userId);
      
      const { data, error } = await supabase
        .from('carritos_pendientes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay carrito, retornar array vacío
          console.log('🛒 No hay carrito para el usuario:', userId);
          return [];
        }
        throw error;
      }

      console.log('🛒 Carrito obtenido:', data.items?.length || 0, 'items');
      return data.items || [];
    } catch (error) {
      console.error('❌ Error obteniendo carrito:', error);
      return [];
    }
  }

  /**
   * Obtiene o crea el cliente_id para un usuario
   */
  private static async getOrCreateClienteId(userId: string): Promise<string> {
    try {
      // Primero intentar obtener el cliente_id existente
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('cliente_id, role, nombre, tier, marca_id')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        throw new Error(`Error obteniendo user_roles: ${roleError.message}`);
      }

      // Si ya tiene cliente_id, retornarlo
      if (userRole.cliente_id) {
        return userRole.cliente_id;
      }

      // Si no es cliente, usar el user_id como cliente_id (para admins/superadmins)
      if (userRole.role !== 'cliente') {
        console.log(`⚠️ Usuario ${userRole.role} sin cliente_id, usando user_id como cliente_id`);
        return userId;
      }

      // Si es cliente pero no tiene cliente_id, crear el registro en clientes
      console.log(`🔧 Creando cliente faltante para usuario ${userId}`);
      
      const clienteData = {
        id: userId,
        nombre: userRole.nombre,
        tier: userRole.tier || '1',
        marca_id: userRole.marca_id,
        vendedor_id: null
      };

      const { data: newCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single();

      if (clienteError) {
        throw new Error(`Error creando cliente: ${clienteError.message}`);
      }

      // Actualizar user_roles con el cliente_id
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ cliente_id: userId })
        .eq('user_id', userId);

      if (updateError) {
        console.warn(`⚠️ Error actualizando user_roles: ${updateError.message}`);
      }

      console.log(`✅ Cliente creado: ${newCliente.id}`);
      return userId;

    } catch (error) {
      console.error('Error en getOrCreateClienteId:', error);
      throw error;
    }
  }
  static async saveCart(userId: string, items: CartItem[]): Promise<void> {
    try {
      console.log('💾 Guardando carrito en Supabase para usuario:', userId);
      console.log('📦 Items a guardar:', items.length);

      // Calcular totales
      const totalItems = items.length;
      const totalUnidades = items.reduce((total, item) => {
        return total + Object.values(item.talles).reduce((sum, cantidad) => sum + cantidad, 0);
      }, 0);

      // Obtener o crear cliente_id del usuario
      const clienteId = await this.getOrCreateClienteId(userId);

      // Verificar si ya existe un carrito
      const { data: existingCart, error: fetchError } = await supabase
        .from('carritos_pendientes')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const cartData = {
        user_id: userId,
        cliente_id: clienteId,
        items: items,
        total_items: totalItems,
        total_unidades: totalUnidades,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      };

      if (existingCart) {
        // Actualizar carrito existente
        const { error: updateError } = await supabase
          .from('carritos_pendientes')
          .update(cartData)
          .eq('id', existingCart.id);

        if (updateError) throw updateError;
        console.log('✅ Carrito actualizado');
      } else {
        // Crear nuevo carrito
        const { error: insertError } = await supabase
          .from('carritos_pendientes')
          .insert(cartData);

        if (insertError) throw insertError;
        console.log('✅ Carrito creado');
      }

      console.log('💾 Carrito guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando carrito:', error);
      throw error;
    }
  }

  /**
   * Agrega un item al carrito
   */
  static async addItem(userId: string, item: CartItem): Promise<void> {
    try {
      console.log('➕ Agregando item al carrito:', item.productoId);
      
      const currentItems = await this.getCart(userId);
      
      // Verificar si el item ya existe (mismo producto, curva, tipo y opción)
      const existingIndex = currentItems.findIndex(existingItem => 
        existingItem.productoId === item.productoId &&
        existingItem.curvaId === item.curvaId &&
        existingItem.type === item.type &&
        existingItem.opcion === item.opcion
      );

      if (existingIndex >= 0) {
        // Actualizar item existente
        currentItems[existingIndex] = item;
        console.log('🔄 Item actualizado');
      } else {
        // Agregar nuevo item
        currentItems.push(item);
        console.log('➕ Item agregado');
      }

      await this.saveCart(userId, currentItems);
    } catch (error) {
      console.error('❌ Error agregando item:', error);
      throw error;
    }
  }

  /**
   * Remueve un item del carrito
   */
  static async removeItem(userId: string, productoId: string, curvaId?: string, tipo?: string, opcion?: number): Promise<void> {
    try {
      console.log('➖ Removiendo item del carrito:', productoId);
      
      const currentItems = await this.getCart(userId);
      
      const filteredItems = currentItems.filter(item => {
        if (item.productoId !== productoId) return true;
        if (curvaId && item.curvaId !== curvaId) return true;
        if (tipo && item.type !== tipo) return true;
        if (opcion !== undefined && item.opcion !== opcion) return true;
        return false;
      });

      await this.saveCart(userId, filteredItems);
      console.log('✅ Item removido');
    } catch (error) {
      console.error('❌ Error removiendo item:', error);
      throw error;
    }
  }

  /**
   * Limpia el carrito del usuario
   */
  static async clearCart(userId: string): Promise<void> {
    try {
      console.log('🧹 Limpiando carrito para usuario:', userId);
      
      const { error } = await supabase
        .from('carritos_pendientes')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      console.log('✅ Carrito limpiado');
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
      throw error;
    }
  }

  /**
   * Obtiene el número total de items en el carrito
   */
  static async getCartItemCount(userId: string): Promise<number> {
    try {
      const items = await this.getCart(userId);
      return items.length;
    } catch (error) {
      console.error('❌ Error obteniendo conteo del carrito:', error);
      return 0;
    }
  }

  /**
   * Verifica si un producto está en el carrito
   */
  static async isProductInCart(userId: string, productoId: string): Promise<boolean> {
    try {
      const items = await this.getCart(userId);
      return items.some(item => item.productoId === productoId);
    } catch (error) {
      console.error('❌ Error verificando producto en carrito:', error);
      return false;
    }
  }
}
