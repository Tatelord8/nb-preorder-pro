/**
 * Hook para manejar el carrito con Dual Storage
 *
 * ARQUITECTURA V2 - Dual Storage:
 * - localStorage como storage principal (instantáneo)
 * - Auto-sync a Supabase cada 5 segundos (respaldo en nube)
 * - Snapshots automáticos cada 10, 20, 50, 100 items
 * - Recuperación automática desde Supabase al iniciar
 * - Manejo robusto de errores de storage
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartStorageService, CartItem, StorageError } from '@/services/cart-storage.service';
import { CartSyncService } from '@/services/cart-sync.service';
import { useCartSync } from './useCartSync';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'syncing';

export interface UseSupabaseCartReturn {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  saveStatus: SaveStatus;
  lastSyncTime: Date | null;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productoId: string, curvaId?: string, tipo?: string, opcion?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isProductInCart: (productoId: string) => boolean;
  getItemCount: () => number;
  getTotalUnits: () => number;
  reloadCart: () => Promise<void>;
  forceSync: () => Promise<void>;
  recoverFromBackup: () => Promise<void>;
  totals: {
    totalItems: number;
    totalUnidades: number;
  };
}

export function useSupabaseCart(): UseSupabaseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [userId, setUserId] = useState<string | undefined>();
  const [clienteId, setClienteId] = useState<string | undefined>();
  const [hasValidClienteId, setHasValidClienteId] = useState(false);

  // Referencias para evitar re-renders innecesarios
  const userIdRef = useRef<string | undefined>();
  const isInitialized = useRef(false);

  // Integrar auto-sync solo si hay cliente_id válido
  const {
    syncStatus,
    lastSyncTime,
    lastError: syncError,
    forceSyncNow,
    recoverFromSnapshot,
  } = useCartSync(userId, clienteId, {
    autoStart: hasValidClienteId, // Solo auto-start si hay cliente_id válido
    onSyncError: (err) => {
      setError(err);
      setSaveStatus('error');
    },
    onSnapshotCreated: () => {
      // Snapshot creado
    },
  });

  // Actualizar saveStatus basado en syncStatus
  useEffect(() => {
    switch (syncStatus) {
      case 'syncing':
        setSaveStatus('syncing');
        break;
      case 'synced':
        setSaveStatus('saved');
        break;
      case 'error':
        setSaveStatus('error');
        break;
      default:
        setSaveStatus('idle');
    }
  }, [syncStatus]);

  // Cargar carrito al inicializar
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener sesión
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setItems([]);
        setUserId(undefined);
        setClienteId(undefined);
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);
      userIdRef.current = currentUserId;

      // Obtener cliente_id
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('cliente_id')
        .eq('user_id', currentUserId)
        .single();

      let currentClienteId = userRole?.cliente_id;
      let isValidCliente = false;

      // Verificar si el cliente_id existe en la tabla clientes
      if (currentClienteId) {
        const { data: clienteExists } = await supabase
          .from('clientes')
          .select('id')
          .eq('id', currentClienteId)
          .single();

        isValidCliente = !!clienteExists;
      }

      // Si no hay cliente_id válido, usar userId pero NO habilitar sync
      if (!isValidCliente) {
        currentClienteId = currentUserId;
      }

      setClienteId(currentClienteId);
      setHasValidClienteId(isValidCliente);

      // Intentar cargar desde localStorage primero (más rápido)
      const localItems = CartStorageService.getCart(currentUserId);

      if (localItems.length > 0) {
        setItems(localItems);
        setLoading(false);

        // En background, verificar si Supabase tiene datos más recientes
        // Solo en la primera carga
        if (!isInitialized.current) {
          isInitialized.current = true;
          const { data: supabaseCart } = await supabase
            .from('carritos_pendientes')
            .select('items, updated_at')
            .eq('user_id', currentUserId)
            .single();

          if (supabaseCart && supabaseCart.items) {
            const supabaseItems = supabaseCart.items as unknown as CartItem[];
            // Si Supabase tiene más items, usar esos
            if (supabaseItems.length > localItems.length) {
              setItems(supabaseItems);
              CartStorageService.saveCart(currentUserId, supabaseItems);
            }
          }
        }
      } else {
        // No hay items locales, intentar cargar desde Supabase
        const { data: supabaseCart } = await supabase
          .from('carritos_pendientes')
          .select('items')
          .eq('user_id', currentUserId)
          .single();

        if (supabaseCart && supabaseCart.items) {
          const supabaseItems = supabaseCart.items as unknown as CartItem[];
          setItems(supabaseItems);
          // Guardar en localStorage para próxima vez
          CartStorageService.saveCart(currentUserId, supabaseItems);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      console.error('❌ Error cargando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar item al carrito
  const addItem = useCallback(
    async (item: CartItem) => {
      try {
        setError(null);
        setSaveStatus('saving');

        const currentUserId = userIdRef.current;
        if (!currentUserId) {
          throw new Error('No hay sesión activa');
        }

        // Guardar en localStorage primero (instantáneo para el usuario)
        const result = CartStorageService.addItem(currentUserId, item);

        if (!result.success) {
          // Si falla localStorage, mostrar advertencia pero continuar con Supabase
          console.warn('⚠️ No se pudo guardar en localStorage:', result.error?.message);
          setError(`Advertencia: ${result.error?.message}. Guardando solo en servidor.`);
        }

        // Actualizar estado local inmediatamente (optimistic UI)
        const updatedItems = CartStorageService.getCart(currentUserId);
        setItems(updatedItems);

        setSaveStatus('saved');
        console.log('✅ Item agregado al carrito');

        // La sincronización a Supabase se hará automáticamente via CartSyncService
      } catch (err) {
        console.error('❌ Error agregando item:', err);
        setError(err instanceof Error ? err.message : 'Error agregando item');
        setSaveStatus('error');
        throw err;
      }
    },
    []
  );

  // Remover item del carrito
  const removeItem = useCallback(
    async (productoId: string, curvaId?: string, tipo?: string, opcion?: number) => {
      try {
        setError(null);
        setSaveStatus('saving');

        const currentUserId = userIdRef.current;
        if (!currentUserId) {
          throw new Error('No hay sesión activa');
        }

        // Obtener items actuales
        const currentItems = CartStorageService.getCart(currentUserId);

        // Filtrar item a remover - LÓGICA CORREGIDA
        const filteredItems = currentItems.filter((item) => {
          // Si el productoId no coincide, mantener el item
          if (item.productoId !== productoId) return true;
          
          // Si el productoId coincide, verificar parámetros adicionales si fueron proporcionados
          // Solo eliminar si TODOS los parámetros proporcionados coinciden
          if (curvaId !== undefined && item.curvaId !== curvaId) return true;
          if (tipo !== undefined && item.type !== tipo) return true;
          if (opcion !== undefined && item.opcion !== opcion) return true;
          
          // Si llegamos aquí, el productoId coincide y todos los parámetros opcionales proporcionados también
          // Este es el item que queremos eliminar
          return false;
        });

        // Guardar en localStorage
        CartStorageService.saveCart(currentUserId, filteredItems);

        // Actualizar estado local inmediatamente (optimistic UI)
        setItems(filteredItems);

        setSaveStatus('saved');
        
        // Forzar sincronización inmediata con Supabase para que se refleje rápido
        if (hasValidClienteId) {
          forceSyncNow();
        }
      } catch (err) {
        console.error('❌ Error removiendo item:', err);
        setError(err instanceof Error ? err.message : 'Error removiendo item');
        setSaveStatus('error');
        throw err;
      }
    },
    [hasValidClienteId, forceSyncNow]
  );

  // Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      setSaveStatus('saving');

      const currentUserId = userIdRef.current;
      if (!currentUserId) {
        throw new Error('No hay sesión activa');
      }

      // Limpiar localStorage
      CartStorageService.clearCart(currentUserId);

      // Limpiar Supabase
      await supabase.from('carritos_pendientes').delete().eq('user_id', currentUserId);

      // Actualizar estado local
      setItems([]);

      // Resetear contador de snapshots
      CartSyncService.resetSnapshotCounter();

      setSaveStatus('saved');
      console.log('✅ Carrito limpiado');
    } catch (err) {
      console.error('❌ Error limpiando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error limpiando carrito');
      setSaveStatus('error');
      throw err;
    }
  }, []);

  // Verificar si un producto está en el carrito
  const isProductInCart = useCallback(
    (productoId: string) => {
      return items.some((item) => item.productoId === productoId);
    },
    [items]
  );

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

  // Forzar sincronización inmediata
  const forceSync = useCallback(async () => {
    try {
      setSaveStatus('syncing');
      await forceSyncNow();
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error en sync forzado:', err);
      setSaveStatus('error');
    }
  }, [forceSyncNow]);

  // Recuperar desde backup (snapshot)
  const recoverFromBackup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUserId = userIdRef.current;
      if (!currentUserId) {
        throw new Error('No hay sesión activa');
      }

      const recoveredItems = await CartSyncService.recoverFromSnapshot(currentUserId);

      if (recoveredItems.length > 0) {
        // Guardar items recuperados
        CartStorageService.saveCart(currentUserId, recoveredItems);
        setItems(recoveredItems);
        console.log(`✅ ${recoveredItems.length} items recuperados desde backup`);
      } else {
        setError('No hay backup disponible para recuperar');
      }
    } catch (err) {
      console.error('Error recuperando backup:', err);
      setError(err instanceof Error ? err.message : 'Error recuperando backup');
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoizar totals para evitar re-renders innecesarios
  const totals = useMemo(
    () => ({
      totalItems: items.length,
      totalUnidades: items.reduce((total, item) => {
        return total + Object.values(item.talles).reduce((sum, cantidad) => sum + cantidad, 0);
      }, 0),
    }),
    [items]
  );

  // Cargar carrito al montar el componente SOLO UNA VEZ
  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo montar, no depender de loadCart

  // Escuchar cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        isInitialized.current = false;
        loadCart();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo montar, no depender de loadCart

  return {
    items,
    loading,
    error: error || syncError,
    saveStatus,
    lastSyncTime,
    addItem,
    removeItem,
    clearCart,
    isProductInCart,
    getItemCount,
    getTotalUnits,
    reloadCart: loadCart,
    forceSync,
    recoverFromBackup,
    totals,
  };
}
