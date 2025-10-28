/**
 * Modal de confirmación para acciones de autorización
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ConfirmacionAutorizacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tipo: 'aprobar' | 'rechazar';
  pedidoInfo: {
    cliente: string;
    total: number;
    fecha: string;
  };
  loading?: boolean;
}

export function ConfirmacionAutorizacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tipo, 
  pedidoInfo,
  loading = false 
}: ConfirmacionAutorizacionProps) {
  const isAprobar = tipo === 'aprobar';
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isAprobar ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {isAprobar ? 'Aprobar Pedido' : 'Rechazar Pedido'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">¿Estás seguro de esta acción?</span>
            </div>
            
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div><strong>Cliente:</strong> {pedidoInfo.cliente}</div>
              <div><strong>Total:</strong> ${pedidoInfo.total.toFixed(2)}</div>
              <div><strong>Fecha:</strong> {pedidoInfo.fecha}</div>
            </div>
            
            <p>
              {isAprobar 
                ? 'El pedido será marcado como autorizado y aparecerá en los reportes.'
                : 'El pedido será marcado como rechazado y no aparecerá en los reportes.'
              }
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={loading}
            className={isAprobar ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading ? 'Procesando...' : (isAprobar ? 'Aprobar' : 'Rechazar')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}





