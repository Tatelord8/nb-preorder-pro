/**
 * Componente de Migración de Carritos
 * Permite migrar carritos de localStorage a Supabase
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { CartMigrationService } from '@/services/cart-migration.service';
import { useToast } from '@/hooks/use-toast';

export function CartMigration() {
  const [migrating, setMigrating] = useState(false);
  const [stats, setStats] = useState<{ totalCarts: number; totalItems: number } | null>(null);
  const { toast } = useToast();

  const loadStats = () => {
    const migrationStats = CartMigrationService.getMigrationStats();
    setStats(migrationStats);
  };

  const handleMigrateAll = async () => {
    try {
      setMigrating(true);
      
      toast({
        title: "Iniciando migración",
        description: "Migrando carritos de localStorage a Supabase...",
      });

      const result = await CartMigrationService.migrateAllCarts();
      
      toast({
        title: "Migración completada",
        description: `${result.migrated} carritos migrados exitosamente. ${result.errors} errores.`,
        variant: result.errors > 0 ? "destructive" : "default",
      });

      // Actualizar estadísticas
      loadStats();
      
    } catch (error) {
      console.error('Error durante la migración:', error);
      toast({
        title: "Error en la migración",
        description: "Hubo un error durante la migración de carritos.",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleClearLocalStorage = () => {
    try {
      CartMigrationService.clearAllLocalStorageCarts();
      
      toast({
        title: "Carritos eliminados",
        description: "Todos los carritos han sido eliminados de localStorage.",
      });

      // Actualizar estadísticas
      loadStats();
      
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
      toast({
        title: "Error",
        description: "Hubo un error al limpiar localStorage.",
        variant: "destructive",
      });
    }
  };

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Migración de Carritos
        </CardTitle>
        <CardDescription>
          Migra carritos de localStorage a Supabase para persistencia entre sesiones
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalCarts}</div>
              <div className="text-sm text-muted-foreground">Carritos en localStorage</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Items totales</div>
            </div>
          </div>
        )}

        {/* Información */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              ¿Por qué migrar?
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Los carritos persistirán entre sesiones</li>
              <li>• Los datos se sincronizarán entre dispositivos</li>
              <li>• Mejor experiencia de usuario</li>
            </ul>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleMigrateAll}
            disabled={migrating || !stats || stats.totalCarts === 0}
            className="flex-1"
          >
            {migrating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Migrar Todos los Carritos
              </>
            )}
          </Button>
          
          <Button 
            onClick={loadStats}
            variant="outline"
            disabled={migrating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Limpiar localStorage */}
        {stats && stats.totalCarts > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Limpiar localStorage</p>
                <p className="text-sm text-muted-foreground">
                  Elimina todos los carritos de localStorage después de migrar
                </p>
              </div>
              <Button 
                onClick={handleClearLocalStorage}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        )}

        {/* Estado */}
        {stats && stats.totalCarts === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">
              No hay carritos en localStorage para migrar
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
