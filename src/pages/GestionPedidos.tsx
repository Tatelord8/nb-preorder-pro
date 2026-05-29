import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Search, Trash2, Pencil, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useToast } from '../hooks/use-toast';
import { usePedidosWithDetails, useDeletePedido } from '../hooks/usePedidos';
import { EditPedidoModal } from '../components/pedidos/EditPedidoModal';
import type { PedidoConDetalles } from '../services/pedidos.service';

const ESTADO_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'secondary',
  autorizado: 'default',
  completado: 'default',
  rechazado: 'destructive',
};

export default function GestionPedidos() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth check — solo superadmin
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'superadmin')
        .single();
      if (!role) {
        toast({ title: 'Acceso denegado', variant: 'destructive' });
        navigate('/catalog');
      }
    })();
  }, []);

  const { data: pedidos = [], isLoading, refetch } = usePedidosWithDetails();
  const deleteMutation = useDeletePedido();

  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [editPedido, setEditPedido] = useState<PedidoConDetalles | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PedidoConDetalles | null>(null);

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchSearch =
      !search ||
      (p.clientes as any)?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchSearch;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: 'Pedido eliminado', description: `Pedido #${deleteTarget.id.slice(-8)} eliminado.` });
        setDeleteTarget(null);
        refetch();
      },
      onError: (err: any) => {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Gestión de Pedidos
        </h1>
        <p className="text-muted-foreground">Editar y eliminar pedidos de clientes</p>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 border-b flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="autorizado">Autorizado</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center whitespace-nowrap">
          {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-y-auto p-6">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron pedidos.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pedido</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ítems</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {pedidosFiltrados.map((pedido) => {
                  const cliente = (pedido as any).clientes;
                  const itemsCount = (pedido as any).items_pedido?.length ?? 0;
                  return (
                    <tr key={pedido.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{pedido.id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {cliente?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(pedido.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ESTADO_BADGE[pedido.estado ?? ''] ?? 'outline'} className="capitalize">
                          {pedido.estado ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{itemsCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${pedido.total_usd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditPedido(pedido as any)}
                            title="Editar pedido"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(pedido as any)}
                            title="Eliminar pedido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal edición */}
      <EditPedidoModal
        pedido={editPedido as any}
        open={!!editPedido}
        onClose={() => setEditPedido(null)}
        onSaved={refetch}
      />

      {/* Confirmación eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el pedido <strong>#{deleteTarget?.id.slice(-8)}</strong> de{' '}
              <strong>{(deleteTarget as any)?.clientes?.nombre ?? 'este cliente'}</strong> y todos sus ítems.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Eliminando...</>
              ) : 'Eliminar pedido'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
