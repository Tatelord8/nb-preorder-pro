/**
 * Servicio de Sincronización de Carrito
 * Sincroniza automáticamente el carrito entre localStorage y Supabase
 *
 * Características:
 * - Sync automático cada 5 segundos (debounced)
 * - Snapshots automáticos cada 10, 20, 50, 100 items
 * - Reintentos automáticos en caso de fallo
 * - Detección de cambios mediante hash
 * - Recuperación automática de conflictos
 */

import { supabase } from '@/integrations/supabase/client';
import { CartStorageService, CartItem } from './cart-storage.service';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'synced';

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
}

export interface SyncResult {
  success: boolean;
  snapshotCreated?: boolean;
  error?: string;
}

const SNAPSHOT_MILESTONES = [10, 20, 50, 100, 150, 200, 250, 300];

export class CartSyncService {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static lastSyncHash: string | null = null;
  private static syncInProgress = false;
  private static retryCount = 0;
  private static readonly MAX_RETRIES = 3;
  private static readonly SYNC_INTERVAL_MS = 5000; // 5 segundos
  private static lastSnapshotCount = 0;
  private static listeners: Set<(state: SyncState) => void> = new Set();

  /**
   * Calcula un hash simple del carrito para detectar cambios
   */
  private static calculateCartHash(items: CartItem[]): string {
    return JSON.stringify(
      items.map((item) => ({
        id: item.productoId,
        curva: item.curvaId,
        talles: item.talles,
        type: item.type,
        opcion: item.opcion,
      }))
    );
  }

  /**
   * Verifica si debe crear un snapshot basado en la cantidad de items
   */
  private static shouldCreateSnapshot(itemCount: number): boolean {
    if (itemCount <= this.lastSnapshotCount) {
      return false;
    }

    for (const milestone of SNAPSHOT_MILESTONES) {
      if (itemCount >= milestone && this.lastSnapshotCount < milestone) {
        return true;
      }
    }

    return false;
  }

  /**
   * Crea un snapshot del carrito actual
   */
  private static async createSnapshot(
    userId: string,
    clienteId: string,
    items: CartItem[],
    reason: string
  ): Promise<boolean> {
    try {
      const { data: cart } = await supabase
        .from('carritos_pendientes')
        .select('id')
        .eq('user_id', userId)
        .single();

      const { error } = await supabase.rpc('create_cart_snapshot', {
        p_carrito_id: cart?.id || null,
        p_user_id: userId,
        p_cliente_id: clienteId,
        p_items: items,
        p_reason: reason,
      });

      if (error) {
        console.error('Error creando snapshot:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creando snapshot:', error);
      return false;
    }
  }

  /**
   * Sincroniza el carrito local con Supabase
   */
  static async syncCart(userId: string, clienteId: string, force = false): Promise<SyncResult> {
    // Evitar sincronizaciones concurrentes
    if (this.syncInProgress && !force) {
      return { success: false, error: 'Sync en progreso' };
    }

    this.syncInProgress = true;
    this.notifyListeners({ status: 'syncing', lastSyncTime: null, lastError: null, pendingChanges: true });

    try {
      // Obtener carrito local
      const localItems = CartStorageService.getCart(userId);
      // NO sincronizar si el carrito está vacío
      if (localItems.length === 0) {
        this.syncInProgress = false;
        this.notifyListeners({
          status: 'idle',
          lastSyncTime: this.lastSyncTime,
          lastError: null,
          pendingChanges: false,
        });
        return { success: true };
      }

      const currentHash = this.calculateCartHash(localItems);

      // Verificar si hay cambios
      if (!force && currentHash === this.lastSyncHash) {
        this.syncInProgress = false;
        this.notifyListeners({
          status: 'synced',
          lastSyncTime: new Date(),
          lastError: null,
          pendingChanges: false,
        });
        return { success: true };
      }

      // Obtener carrito de Supabase para versioning
      const { data: existingCart } = await supabase
        .from('carritos_pendientes')
        .select('version, items')
        .eq('user_id', userId)
        .single();

      // Preparar datos para guardar
      const cartData: any = {
        user_id: userId,
        cliente_id: clienteId,
        items: localItems,
      };

      // Optimistic locking: verificar versión si existe
      if (existingCart) {
        const { error: updateError } = await supabase
          .from('carritos_pendientes')
          .update(cartData)
          .eq('user_id', userId)
          .eq('version', existingCart.version);

        if (updateError) {
          if (updateError.message.includes('no rows returned')) {
            // Conflicto de versión - otro cliente modificó el carrito
            // En caso de conflicto, el carrito local gana (last write wins)
            const { error: forceUpdateError } = await supabase
              .from('carritos_pendientes')
              .update(cartData)
              .eq('user_id', userId);

            if (forceUpdateError) throw forceUpdateError;
          } else {
            throw updateError;
          }
        }
      } else {
        // Crear nuevo carrito
        const { error: insertError } = await supabase
          .from('carritos_pendientes')
          .insert(cartData);

        if (insertError) {
          // Si falla por unique constraint, intentar update
          if (insertError.code === '23505') {
            const { error: updateError } = await supabase
              .from('carritos_pendientes')
              .update(cartData)
              .eq('user_id', userId);

            if (updateError) throw updateError;
          } else {
            throw insertError;
          }
        }
      }

      // Verificar si debe crear snapshot
      let snapshotCreated = false;
      const itemCount = localItems.length;
      if (this.shouldCreateSnapshot(itemCount)) {
        const milestone = SNAPSHOT_MILESTONES.find(
          (m) => itemCount >= m && this.lastSnapshotCount < m
        );
        if (milestone) {
          snapshotCreated = await this.createSnapshot(
            userId,
            clienteId,
            localItems,
            `auto_${milestone}`
          );
          if (snapshotCreated) {
            this.lastSnapshotCount = milestone;
          }
        }
      }

      // Actualizar hash de sync
      this.lastSyncHash = currentHash;
      this.retryCount = 0;
      this.syncInProgress = false;

      this.notifyListeners({
        status: 'synced',
        lastSyncTime: new Date(),
        lastError: null,
        pendingChanges: false,
      });

      return { success: true, snapshotCreated };
    } catch (error: any) {
      this.syncInProgress = false;

      // Implementar retry con backoff exponencial
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);

        setTimeout(() => {
          this.syncCart(userId, clienteId, true);
        }, retryDelay);
      } else {
        this.notifyListeners({
          status: 'error',
          lastSyncTime: null,
          lastError: error.message,
          pendingChanges: true,
        });
        this.retryCount = 0;
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Inicia la sincronización automática periódica
   */
  static startAutoSync(userId: string, clienteId: string): void {
    if (this.syncInterval) {
      return;
    }

    // Sync inmediato al iniciar
    this.syncCart(userId, clienteId);

    // Sync periódico
    this.syncInterval = setInterval(() => {
      this.syncCart(userId, clienteId);
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Detiene la sincronización automática
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.notifyListeners({
        status: 'idle',
        lastSyncTime: null,
        lastError: null,
        pendingChanges: false,
      });
    }
  }

  /**
   * Fuerza una sincronización inmediata
   */
  static async forceSyncNow(userId: string, clienteId: string): Promise<SyncResult> {
    return await this.syncCart(userId, clienteId, true);
  }

  /**
   * Crea un snapshot manual
   */
  static async createManualSnapshot(
    userId: string,
    clienteId: string,
    reason = 'manual'
  ): Promise<boolean> {
    const items = CartStorageService.getCart(userId);
    return await this.createSnapshot(userId, clienteId, items, reason);
  }

  /**
   * Registra un listener para cambios en el estado de sync
   */
  static addSyncListener(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica a todos los listeners del cambio de estado
   */
  private static notifyListeners(state: SyncState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error en listener de sync:', error);
      }
    });
  }

  /**
   * Obtiene el estado actual de sincronización
   */
  static getSyncState(): SyncState {
    return {
      status: this.syncInProgress ? 'syncing' : this.lastSyncHash ? 'synced' : 'idle',
      lastSyncTime: null,
      lastError: null,
      pendingChanges: false,
    };
  }

  /**
   * Resetea el contador de snapshots (útil después de checkout)
   */
  static resetSnapshotCounter(): void {
    this.lastSnapshotCount = 0;
  }

  /**
   * Recupera el carrito desde el último snapshot
   */
  static async recoverFromSnapshot(userId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabase.rpc('get_latest_cart_snapshot', {
        p_user_id: userId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const snapshot = data[0];
        return snapshot.items as CartItem[];
      }

      return [];
    } catch (error) {
      console.error('❌ Error recuperando snapshot:', error);
      return [];
    }
  }
}
