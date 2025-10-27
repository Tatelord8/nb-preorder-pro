/**
 * Servicio de Migración de Carritos
 * Migra carritos de localStorage a Supabase
 */

import { SupabaseCartService, CartItem } from './supabase-cart.service';

export class CartMigrationService {
  /**
   * Migra todos los carritos de localStorage a Supabase
   */
  static async migrateAllCarts(): Promise<{ migrated: number; errors: number }> {
    console.log('🔄 Iniciando migración de carritos de localStorage a Supabase...');
    
    let migrated = 0;
    let errors = 0;

    try {
      // Obtener todas las claves de localStorage que empiecen con 'cartItems_'
      const cartKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cartItems_')) {
          cartKeys.push(key);
        }
      }

      console.log(`📦 Encontradas ${cartKeys.length} claves de carrito en localStorage`);

      for (const key of cartKeys) {
        try {
          // Extraer userId de la clave
          const userId = key.replace('cartItems_', '');
          
          // Obtener datos del localStorage
          const data = localStorage.getItem(key);
          if (!data) continue;

          const parsed = JSON.parse(data);
          let items: CartItem[] = [];

          // Compatibilidad con formato antiguo (array directo)
          if (Array.isArray(parsed)) {
            items = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            items = parsed.items;
          }

          if (items.length === 0) {
            console.log(`⚠️ Carrito vacío para usuario ${userId}, saltando...`);
            continue;
          }

          // Migrar a Supabase
          await SupabaseCartService.saveCart(userId, items);
          migrated++;
          
          console.log(`✅ Migrado carrito para usuario ${userId}: ${items.length} items`);
          
          // Opcional: Limpiar del localStorage después de migrar
          // localStorage.removeItem(key);
          
        } catch (error) {
          console.error(`❌ Error migrando carrito ${key}:`, error);
          errors++;
        }
      }

      console.log(`🎉 Migración completada: ${migrated} carritos migrados, ${errors} errores`);
      
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
      errors++;
    }

    return { migrated, errors };
  }

  /**
   * Migra el carrito de un usuario específico
   */
  static async migrateUserCart(userId: string): Promise<boolean> {
    try {
      console.log(`🔄 Migrando carrito para usuario: ${userId}`);
      
      const key = `cartItems_${userId}`;
      const data = localStorage.getItem(key);
      
      if (!data) {
        console.log(`⚠️ No hay carrito en localStorage para usuario ${userId}`);
        return false;
      }

      const parsed = JSON.parse(data);
      let items: CartItem[] = [];

      // Compatibilidad con formato antiguo
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        items = parsed.items;
      }

      if (items.length === 0) {
        console.log(`⚠️ Carrito vacío para usuario ${userId}`);
        return false;
      }

      // Migrar a Supabase
      await SupabaseCartService.saveCart(userId, items);
      
      console.log(`✅ Carrito migrado para usuario ${userId}: ${items.length} items`);
      
      // Opcional: Limpiar del localStorage
      // localStorage.removeItem(key);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error migrando carrito para usuario ${userId}:`, error);
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene carrito en localStorage
   */
  static hasLocalStorageCart(userId: string): boolean {
    const key = `cartItems_${userId}`;
    const data = localStorage.getItem(key);
    
    if (!data) return false;
    
    try {
      const parsed = JSON.parse(data);
      let items: CartItem[] = [];

      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        items = parsed.items;
      }

      return items.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene estadísticas de migración
   */
  static getMigrationStats(): { totalCarts: number; totalItems: number } {
    let totalCarts = 0;
    let totalItems = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cartItems_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            let items: CartItem[] = [];

            if (Array.isArray(parsed)) {
              items = parsed;
            } else if (parsed.items && Array.isArray(parsed.items)) {
              items = parsed.items;
            }

            if (items.length > 0) {
              totalCarts++;
              totalItems += items.length;
            }
          }
        } catch (error) {
          console.error(`Error procesando carrito ${key}:`, error);
        }
      }
    }

    return { totalCarts, totalItems };
  }

  /**
   * Limpia todos los carritos de localStorage
   */
  static clearAllLocalStorageCarts(): void {
    console.log('🧹 Limpiando todos los carritos de localStorage...');
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cartItems_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`✅ ${keysToRemove.length} carritos eliminados de localStorage`);
  }
}

