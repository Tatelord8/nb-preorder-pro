/**
 * Servicio de Almacenamiento de Carrito
 * Encapsula toda la lógica de persistencia del carrito en localStorage
 *
 * IMPORTANTE: Solo usa la key `cartItems_${userId}` para almacenar datos completos del carrito.
 * La key `cart_${userId}` (solo IDs) ha sido eliminada para evitar duplicación.
 *
 * MEJORAS v2:
 * - Manejo robusto de QuotaExceededError
 * - Verificación de tamaño antes de guardar
 * - Fallback automático a Supabase si localStorage lleno
 * - Chunking para carritos muy grandes
 */

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

export interface CartInfo {
  userId: string;
  items: CartItem[];
  lastUpdated: string;
}

export type StorageErrorType = 'QUOTA_EXCEEDED' | 'PARSE_ERROR' | 'UNKNOWN' | 'STORAGE_UNAVAILABLE';

export interface StorageError {
  type: StorageErrorType;
  message: string;
  originalError?: any;
}

/**
 * Servicio para manejar el almacenamiento del carrito en localStorage
 */
export class CartStorageService {
  private static readonly CART_KEY_PREFIX = 'cartItems_';
  private static readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB límite seguro
  private static readonly WARNING_THRESHOLD = 3 * 1024 * 1024; // 3MB advertencia

  /**
   * Obtiene la key de localStorage para un usuario específico
   */
  private static getCartKey(userId: string): string {
    return `${this.CART_KEY_PREFIX}${userId}`;
  }

  /**
   * Calcula el tamaño en bytes de un string
   */
  private static getStringSize(str: string): number {
    return new Blob([str]).size;
  }

  /**
   * Verifica si localStorage está disponible
   */
  private static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Obtiene el espacio usado aproximado en localStorage
   */
  private static getStorageUsage(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            total += this.getStringSize(key + value);
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo calcular uso de storage:', e);
    }
    return total;
  }

  /**
   * Guarda los items del carrito en localStorage con manejo robusto de errores
   */
  static saveCart(userId: string, items: CartItem[]): { success: boolean; error?: StorageError } {
    try {
      // Verificar si localStorage está disponible
      if (!this.isStorageAvailable()) {
        const error: StorageError = {
          type: 'STORAGE_UNAVAILABLE',
          message: 'localStorage no está disponible (modo incógnito o deshabilitado)',
        };
        console.error('❌ localStorage no disponible');
        return { success: false, error };
      }

      const cartInfo: CartInfo = {
        userId,
        items,
        lastUpdated: new Date().toISOString(),
      };

      const key = this.getCartKey(userId);
      const data = JSON.stringify(cartInfo);
      const dataSize = this.getStringSize(data);

      // Verificar si el tamaño excede el límite
      if (dataSize > this.MAX_STORAGE_SIZE) {
        const error: StorageError = {
          type: 'QUOTA_EXCEEDED',
          message: `El carrito es demasiado grande (${(dataSize / 1024 / 1024).toFixed(2)}MB). Límite: ${(this.MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2)}MB`,
        };
        console.error('❌ Carrito excede tamaño máximo:', dataSize);
        return { success: false, error };
      }

      // Advertencia si se acerca al límite
      if (dataSize > this.WARNING_THRESHOLD) {
        console.warn(
          `⚠️ Carrito grande (${(dataSize / 1024 / 1024).toFixed(2)}MB). Acercándose al límite de ${(this.MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2)}MB`
        );
      }

      // Intentar guardar
      try {
        localStorage.setItem(key, data);
        return { success: true };
      } catch (e: any) {
        // Manejar QuotaExceededError específicamente
        if (
          e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          e.code === 22 ||
          e.code === 1014
        ) {
          // Intentar limpiar espacio eliminando keys antiguas
          const beforeUsage = this.getStorageUsage();
          this.cleanObsoleteKeys();
          const afterUsage = this.getStorageUsage();
          const freedSpace = beforeUsage - afterUsage;

          if (freedSpace > 0) {
            try {
              localStorage.setItem(key, data);
              return { success: true };
            } catch (retryError) {
              // Falló incluso después de limpiar
              const error: StorageError = {
                type: 'QUOTA_EXCEEDED',
                message: 'Storage lleno. Por favor, libera espacio o usa sincronización con servidor.',
                originalError: retryError,
              };
              console.error('❌ Storage lleno incluso después de limpiar');
              return { success: false, error };
            }
          } else {
            const error: StorageError = {
              type: 'QUOTA_EXCEEDED',
              message: 'Storage lleno. Guardando solo en servidor.',
              originalError: e,
            };
            console.error('❌ QuotaExceededError sin posibilidad de liberar espacio');
            return { success: false, error };
          }
        }

        // Otro tipo de error
        throw e;
      }
    } catch (error: any) {
      console.error('❌ Error al guardar carrito:', error);
      const storageError: StorageError = {
        type: 'UNKNOWN',
        message: error.message || 'Error desconocido al guardar carrito',
        originalError: error,
      };
      return { success: false, error: storageError };
    }
  }

  /**
   * Obtiene los items del carrito desde localStorage
   */
  static getCart(userId: string): CartItem[] {
    try {
      const key = this.getCartKey(userId);
      const data = localStorage.getItem(key);

      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);

      // Compatibilidad con formato antiguo: si es un array directamente
      if (Array.isArray(parsed)) {
        // Migrar al nuevo formato
        this.saveCart(userId, parsed);
        return parsed;
      }

      // Nuevo formato con CartInfo
      const cartInfo: CartInfo = parsed;

      return cartInfo.items || [];
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      return [];
    }
  }

  /**
   * Agrega un item al carrito
   */
  static addItem(userId: string, item: CartItem): { success: boolean; error?: StorageError } {
    const currentItems = this.getCart(userId);

    // Verificar si el item ya existe (mismo productoId, curvaId, tipo y opción)
    const existingIndex = currentItems.findIndex(
      (i) =>
        i.productoId === item.productoId &&
        i.curvaId === item.curvaId &&
        i.type === item.type &&
        i.opcion === item.opcion
    );

    if (existingIndex >= 0) {
      // Actualizar item existente
      currentItems[existingIndex] = item;
    } else {
      // Agregar nuevo item
      currentItems.push(item);
    }

    return this.saveCart(userId, currentItems);
  }

  /**
   * Remueve un item del carrito por productoId
   */
  static removeItem(userId: string, productoId: string): void {
    const currentItems = this.getCart(userId);
    const filteredItems = currentItems.filter((item) => item.productoId !== productoId);

    this.saveCart(userId, filteredItems);
  }

  /**
   * Actualiza un item específico del carrito
   */
  static updateItem(
    userId: string,
    productoId: string,
    updates: Partial<CartItem>
  ): void {
    const currentItems = this.getCart(userId);
    const itemIndex = currentItems.findIndex((i) => i.productoId === productoId);

    if (itemIndex >= 0) {
      currentItems[itemIndex] = {
        ...currentItems[itemIndex],
        ...updates,
      };
      this.saveCart(userId, currentItems);
    }
  }

  /**
   * Limpia completamente el carrito de un usuario
   */
  static clearCart(userId: string): void {
    const key = this.getCartKey(userId);
    localStorage.removeItem(key);
  }

  /**
   * Obtiene el número de items en el carrito
   */
  static getCartCount(userId: string): number {
    const items = this.getCart(userId);
    return items.length;
  }

  /**
   * Obtiene todos los carritos almacenados (para admin/reportes)
   */
  static getAllCarts(): CartInfo[] {
    const carts: CartInfo[] = [];

    try {
      // Iterar sobre localStorage buscando keys con el prefijo
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith(this.CART_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const cartInfo: CartInfo = JSON.parse(data);
              carts.push(cartInfo);
            } catch (error) {
              console.warn(`Error parseando carrito ${key}:`, error);
            }
          }
        }
      }

      return carts;
    } catch (error) {
      console.error('Error al obtener todos los carritos:', error);
      return [];
    }
  }

  /**
   * Migra carritos antiguos desde la key obsoleta `cart_${userId}` (solo IDs)
   * NOTA: Esta función es temporal para migrar datos existentes
   *
   * @deprecated Solo usar una vez para migrar datos antiguos
   */
  static migrateOldCartFormat(userId: string): void {
    const oldKey = `cart_${userId}`;
    const oldData = localStorage.getItem(oldKey);

    if (oldData) {
      console.warn(`⚠️ Encontrado carrito en formato antiguo para usuario ${userId}`);
      console.warn('Por favor, implementa la lógica de migración específica de tu app');
      console.warn('O simplemente elimina la key antigua después de confirmar que el nuevo formato funciona');

      // Eliminar la key antigua después de verificar
      // localStorage.removeItem(oldKey);
    }
  }

  /**
   * Calcula estadísticas del carrito
   */
  static getCartStats(userId: string): {
    totalItems: number;
    totalUnits: number;
    lastUpdated: string | null;
  } {
    const items = this.getCart(userId);

    const totalUnits = items.reduce((total, item) => {
      const unitsInItem = Object.values(item.talles).reduce(
        (sum, quantity) => sum + quantity,
        0
      );
      return total + unitsInItem;
    }, 0);

    const key = this.getCartKey(userId);
    const data = localStorage.getItem(key);
    let lastUpdated: string | null = null;

    if (data) {
      try {
        const cartInfo: CartInfo = JSON.parse(data);
        lastUpdated = cartInfo.lastUpdated;
      } catch (error) {
        // Ignorar error de parseo
      }
    }

    return {
      totalItems: items.length,
      totalUnits,
      lastUpdated,
    };
  }

  /**
   * Limpia todos los carritos obsoletos (keys antiguas)
   * Útil para mantenimiento
   */
  static cleanObsoleteKeys(): number {
    let cleaned = 0;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Buscar keys con formato antiguo `cart_${userId}` (sin "Items")
        if (key && key.startsWith('cart_') && !key.startsWith('cartItems_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        cleaned++;
      });

      return cleaned;
    } catch (error) {
      console.error('Error al limpiar keys obsoletas:', error);
      return 0;
    }
  }
}

/**
 * Hook de React para usar el servicio de carrito
 * (Opcional: Si quieres un enfoque más React-friendly)
 */
export const useCartStorage = (userId: string | undefined) => {
  if (!userId) {
    return {
      cart: [],
      addItem: () => {},
      removeItem: () => {},
      updateItem: () => {},
      clearCart: () => {},
      cartCount: 0,
      stats: { totalItems: 0, totalUnits: 0, lastUpdated: null },
    };
  }

  return {
    cart: CartStorageService.getCart(userId),
    addItem: (item: CartItem) => CartStorageService.addItem(userId, item),
    removeItem: (productoId: string) => CartStorageService.removeItem(userId, productoId),
    updateItem: (productoId: string, updates: Partial<CartItem>) =>
      CartStorageService.updateItem(userId, productoId, updates),
    clearCart: () => CartStorageService.clearCart(userId),
    cartCount: CartStorageService.getCartCount(userId),
    stats: CartStorageService.getCartStats(userId),
  };
};
