/**
 * Hook para manejar el carrito usando Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseCartService, CartItem } from '@/services/supabase-cart.service';

export function useSupabaseCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar carrito al inicializar
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setItems([]);
        return;
      }

      const cartItems = await SupabaseCartService.getCart(session.user.id);
      setItems(cartItems);
      console.log('🛒 Carrito cargado:', cartItems.length, 'items');
    } catch (err) {
      console.error('❌ Error cargando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar item al carrito
  const addItem = useCallback(async (item: CartItem) => {
    try {
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      await SupabaseCartService.addItem(session.user.id, item);
      await loadCart(); // Recargar carrito
      
      console.log('✅ Item agregado al carrito');
    } catch (err) {
      console.error('❌ Error agregando item:', err);
      setError(err instanceof Error ? err.message : 'Error agregando item');
      throw err;
    }
  }, [loadCart]);

  // Remover item del carrito
  const removeItem = useCallback(async (productoId: string, curvaId?: string, tipo?: string, opcion?: number) => {
    try {
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      await SupabaseCartService.removeItem(session.user.id, productoId, curvaId, tipo, opcion);
      await loadCart(); // Recargar carrito
      
      console.log('✅ Item removido del carrito');
    } catch (err) {
      console.error('❌ Error removiendo item:', err);
      setError(err instanceof Error ? err.message : 'Error removiendo item');
      throw err;
    }
  }, [loadCart]);

  // Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      await SupabaseCartService.clearCart(session.user.id);
      setItems([]);
      
      console.log('✅ Carrito limpiado');
    } catch (err) {
      console.error('❌ Error limpiando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error limpiando carrito');
      throw err;
    }
  }, []);

  // Verificar si un producto está en el carrito
  const isProductInCart = useCallback((productoId: string) => {
    return items.some(item => item.productoId === productoId);
  }, [items]);

  // Obtener conteo de items
  const getItemCount = useCallback(() => {
    return items.length;
  }, [items]);

  // Obtener conteo total de unidades
  const getTotalUnits = useCallback(() => {
    return items.reduce((total, item) => {
      return total + Object.values(item.talles).reduce((sum, cantidad) => sum + cantidad, 0);
    }, 0);
  }, [items]);

  // Cargar carrito al montar el componente
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadCart();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCart]);

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    clearCart,
    isProductInCart,
    getItemCount,
    getTotalUnits,
    reloadCart: loadCart,
    totals: {
      totalItems: getItemCount(),
      totalUnidades: getTotalUnits()
    }
  };
}
