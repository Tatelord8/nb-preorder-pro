/**
 * Servicio de Almacenamiento de Carrito
 * Encapsula toda la lógica de persistencia del carrito en localStorage
 *
 * IMPORTANTE: Solo usa la key `cartItems_${userId}` para almacenar datos completos del carrito.
 * La key `cart_${userId}` (solo IDs) ha sido eliminada para evitar duplicación.
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
}

export interface CartInfo {
  userId: string;
  items: CartItem[];
  lastUpdated: string;
}

/**
 * Servicio para manejar el almacenamiento del carrito en localStorage
 */
export class CartStorageService {
  private static readonly CART_KEY_PREFIX = 'cartItems_';

  /**
   * Obtiene la key de localStorage para un usuario específico
   */
  private static getCartKey(userId: string): string {
    return `${this.CART_KEY_PREFIX}${userId}`;
  }

  /**
   * Guarda los items del carrito en localStorage
   */
  static saveCart(userId: string, items: CartItem[]): void {
    try {
      const cartInfo: CartInfo = {
        userId,
        items,
        lastUpdated: new Date().toISOString(),
      };

      const key = this.getCartKey(userId);
      localStorage.setItem(key, JSON.stringify(cartInfo));

      console.log(`💾 Carrito guardado para usuario ${userId}:`, items.length, 'items');
    } catch (error) {
      console.error('Error al guardar carrito:', error);
      throw new Error('No se pudo guardar el carrito');
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
        console.log(`🛒 No hay carrito para usuario ${userId}`);
        return [];
      }

      const parsed = JSON.parse(data);

      // Compatibilidad con formato antiguo: si es un array directamente
      if (Array.isArray(parsed)) {
        console.log(`🛒 Carrito cargado (formato antiguo) para usuario ${userId}:`, parsed.length, 'items');
        // Migrar al nuevo formato
        this.saveCart(userId, parsed);
        return parsed;
      }

      // Nuevo formato con CartInfo
      const cartInfo: CartInfo = parsed;
      console.log(`🛒 Carrito cargado para usuario ${userId}:`, cartInfo.items?.length || 0, 'items');

      return cartInfo.items || [];
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      return [];
    }
  }

  /**
   * Agrega un item al carrito
   */
  static addItem(userId: string, item: CartItem): void {
    const currentItems = this.getCart(userId);

    // Verificar si el item ya existe (mismo productoId)
    const existingIndex = currentItems.findIndex(
      (i) => i.productoId === item.productoId
    );

    if (existingIndex >= 0) {
      // Actualizar item existente
      currentItems[existingIndex] = item;
      console.log(`🔄 Item actualizado en carrito: ${item.productoId}`);
    } else {
      // Agregar nuevo item
      currentItems.push(item);
      console.log(`➕ Item agregado al carrito: ${item.productoId}`);
    }

    this.saveCart(userId, currentItems);
  }

  /**
   * Remueve un item del carrito por productoId
   */
  static removeItem(userId: string, productoId: string): void {
    const currentItems = this.getCart(userId);
    const filteredItems = currentItems.filter((item) => item.productoId !== productoId);

    this.saveCart(userId, filteredItems);
    console.log(`🗑️ Item removido del carrito: ${productoId}`);
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
      console.log(`✏️ Item actualizado: ${productoId}`);
    } else {
      console.warn(`Item no encontrado en carrito: ${productoId}`);
    }
  }

  /**
   * Limpia completamente el carrito de un usuario
   */
  static clearCart(userId: string): void {
    const key = this.getCartKey(userId);
    localStorage.removeItem(key);
    console.log(`🧹 Carrito limpiado para usuario ${userId}`);
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

      console.log(`📦 Total de carritos encontrados: ${carts.length}`);
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

      if (cleaned > 0) {
        console.log(`🧹 Limpiadas ${cleaned} keys obsoletas del carrito`);
      }

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
