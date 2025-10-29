/**
 * CartStatus Component
 * Muestra el estado de sincronización del carrito con feedback visual
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, CheckCircle2, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { SaveStatus } from '@/hooks/useSupabaseCart';

interface CartStatusProps {
  status: SaveStatus;
  lastSyncTime: Date | null;
  itemCount: number;
  className?: string;
}

export function CartStatus({ status, lastSyncTime, itemCount, className = '' }: CartStatusProps) {
  const [showStatus, setShowStatus] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  // Calcular "hace cuánto" se sincronizó
  useEffect(() => {
    if (!lastSyncTime) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);

      if (diff < 10) {
        setTimeAgo('hace un momento');
      } else if (diff < 60) {
        setTimeAgo(`hace ${diff}s`);
      } else if (diff < 3600) {
        setTimeAgo(`hace ${Math.floor(diff / 60)}m`);
      } else {
        setTimeAgo(`hace ${Math.floor(diff / 3600)}h`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Mostrar status temporalmente cuando cambia
  useEffect(() => {
    if (status === 'saving' || status === 'syncing' || status === 'error') {
      setShowStatus(true);
    } else if (status === 'saved') {
      setShowStatus(true);
      // Ocultar después de 2 segundos si está guardado
      const timeout = setTimeout(() => {
        setShowStatus(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Configuración visual por estado
  const statusConfig = {
    idle: {
      icon: Cloud,
      label: 'Listo',
      color: 'bg-gray-100 text-gray-600',
      description: 'Carrito listo para usar',
    },
    saving: {
      icon: Loader2,
      label: 'Guardando...',
      color: 'bg-blue-100 text-blue-600',
      description: 'Guardando cambios localmente',
      animate: true,
    },
    saved: {
      icon: CheckCircle2,
      label: 'Guardado',
      color: 'bg-green-100 text-green-600',
      description: `Guardado localmente • ${itemCount} items`,
    },
    syncing: {
      icon: Cloud,
      label: 'Sincronizando...',
      color: 'bg-purple-100 text-purple-600',
      description: 'Sincronizando con el servidor',
      animate: true,
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      color: 'bg-red-100 text-red-600',
      description: 'Error al guardar. Tus datos están seguros localmente.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // No mostrar si está idle y no hay cambios recientes
  if (!showStatus && status === 'idle') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${config.color} ${className} flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-all cursor-help`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${config.animate ? 'animate-spin' : ''}`}
              strokeWidth={2.5}
            />
            <span>{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            {lastSyncTime && status !== 'error' && (
              <p className="text-xs text-muted-foreground">
                Última sincronización: {timeAgo}
              </p>
            )}
            {status === 'error' && (
              <p className="text-xs text-muted-foreground">
                Los cambios se guardarán automáticamente cuando se restaure la conexión
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Versión compacta del CartStatus (solo icono, sin texto)
 */
export function CartStatusIcon({ status, lastSyncTime, itemCount }: CartStatusProps) {
  const statusConfig = {
    idle: { icon: Cloud, color: 'text-gray-400' },
    saving: { icon: Loader2, color: 'text-blue-500', animate: true },
    saved: { icon: CheckCircle2, color: 'text-green-500' },
    syncing: { icon: Cloud, color: 'text-purple-500', animate: true },
    error: { icon: CloudOff, color: 'text-red-500' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Icon
              className={`h-4 w-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
              strokeWidth={2}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-medium">
              {status === 'saving' && 'Guardando...'}
              {status === 'saved' && `Guardado • ${itemCount} items`}
              {status === 'syncing' && 'Sincronizando con servidor'}
              {status === 'error' && 'Error al sincronizar'}
              {status === 'idle' && 'Listo'}
            </p>
            {lastSyncTime && (
              <p className="text-muted-foreground mt-0.5">
                Última sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
