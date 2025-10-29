/**
 * Hook useCartSync
 * Interfaz React para el servicio de sincronización automática de carrito
 *
 * Uso:
 * ```tsx
 * const { syncStatus, forceSyncNow, createSnapshot } = useCartSync(userId, clienteId);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CartSyncService, SyncState, SyncResult } from '@/services/cart-sync.service';

interface UseCartSyncReturn {
  syncStatus: SyncState['status'];
  lastSyncTime: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
  forceSyncNow: () => Promise<SyncResult>;
  createSnapshot: (reason?: string) => Promise<boolean>;
  recoverFromSnapshot: () => Promise<void>;
}

export function useCartSync(
  userId: string | undefined,
  clienteId: string | undefined,
  options?: {
    autoStart?: boolean; // Default: true
    onSyncError?: (error: string) => void;
    onSnapshotCreated?: (reason: string) => void;
  }
): UseCartSyncReturn {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSyncTime: null,
    lastError: null,
    pendingChanges: false,
  });

  const autoStart = options?.autoStart !== false;

  // Usar refs para callbacks para evitar re-renders
  const onSyncErrorRef = useRef(options?.onSyncError);
  const onSnapshotCreatedRef = useRef(options?.onSnapshotCreated);

  useEffect(() => {
    onSyncErrorRef.current = options?.onSyncError;
    onSnapshotCreatedRef.current = options?.onSnapshotCreated;
  }, [options?.onSyncError, options?.onSnapshotCreated]);

  // Iniciar/detener auto-sync
  useEffect(() => {
    if (!userId || !clienteId) {
      return;
    }

    if (autoStart) {
      CartSyncService.startAutoSync(userId, clienteId);
    }

    // Registrar listener para cambios de estado
    const unsubscribe = CartSyncService.addSyncListener((newState) => {
      setSyncState(newState);

      // Callbacks opcionales usando refs
      if (newState.status === 'error' && newState.lastError && onSyncErrorRef.current) {
        onSyncErrorRef.current(newState.lastError);
      }
    });

    // Cleanup al desmontar
    return () => {
      unsubscribe();
      if (autoStart) {
        CartSyncService.stopAutoSync();
      }
    };
  }, [userId, clienteId, autoStart]); // Remover options de dependencias

  // Forzar sincronización inmediata
  const forceSyncNow = useCallback(async (): Promise<SyncResult> => {
    if (!userId || !clienteId) {
      return { success: false, error: 'Usuario o cliente no definido' };
    }

    const result = await CartSyncService.forceSyncNow(userId, clienteId);

    if (result.snapshotCreated && onSnapshotCreatedRef.current) {
      onSnapshotCreatedRef.current('manual');
    }

    return result;
  }, [userId, clienteId]);

  // Crear snapshot manual
  const createSnapshot = useCallback(
    async (reason = 'manual'): Promise<boolean> => {
      if (!userId || !clienteId) {
        return false;
      }

      const success = await CartSyncService.createManualSnapshot(userId, clienteId, reason);

      if (success && onSnapshotCreatedRef.current) {
        onSnapshotCreatedRef.current(reason);
      }

      return success;
    },
    [userId, clienteId]
  );

  // Recuperar desde último snapshot
  const recoverFromSnapshot = useCallback(async (): Promise<void> => {
    if (!userId) {
      return;
    }

    await CartSyncService.recoverFromSnapshot(userId);
  }, [userId]);

  return {
    syncStatus: syncState.status,
    lastSyncTime: syncState.lastSyncTime,
    lastError: syncState.lastError,
    pendingChanges: syncState.pendingChanges,
    forceSyncNow,
    createSnapshot,
    recoverFromSnapshot,
  };
}
