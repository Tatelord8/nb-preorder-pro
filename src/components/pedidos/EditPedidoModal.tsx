import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Trash2, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateSizes } from '@/utils/sizeGenerator';
import { sortTallas } from '@/utils/sortTallas';
import { useToast } from '@/hooks/use-toast';
import { invalidateQueries } from '@/lib/queryClient';

const ESTADOS = ['pendiente', 'autorizado', 'completado', 'rechazado'] as const;

interface ItemEditable {
  id: string;
  producto_id: string;
  nombre: string;
  sku: string;
  rubro: string;
  genero: string;
  imagen_url?: string | null;
  precio_unitario: number;
  talles: Record<string, number>;
  deleted: boolean;
}

interface Pedido {
  id: string;
  estado: string;
  total_usd: number;
  created_at: string;
  clientes?: { nombre: string; tier: string } | null;
  vendedores?: { nombre: string } | null;
  items_pedido?: any[];
}

interface EditPedidoModalProps {
  pedido: Pedido | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPedidoModal({ pedido, open, onClose, onSaved }: EditPedidoModalProps) {
  const { toast } = useToast();
  const [estado, setEstado] = useState('');
  const [items, setItems] = useState<ItemEditable[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pedido) return;
    setEstado(pedido.estado ?? 'pendiente');
    setItems(
      (pedido.items_pedido ?? []).map((item: any) => ({
        id: item.id,
        producto_id: item.producto_id,
        nombre: item.productos?.nombre ?? 'Producto',
        sku: item.productos?.sku ?? '—',
        rubro: item.productos?.rubro ?? '',
        genero: item.productos?.genero ?? '',
        imagen_url: item.productos?.imagen_url,
        precio_unitario: item.precio_unitario ?? 0,
        talles: { ...(item.talles_cantidades ?? {}) },
        deleted: false,
      })),
    );
  }, [pedido]);

  if (!pedido) return null;

  const activeItems = items.filter((i) => !i.deleted);

  const calcSubtotal = (item: ItemEditable) =>
    Object.values(item.talles).reduce((s, q) => s + q, 0) * item.precio_unitario;

  const calcTotal = () => activeItems.reduce((s, i) => s + calcSubtotal(i), 0);

  const setTalla = (itemId: string, talla: string, value: string) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, talles: { ...i.talles, [talla]: qty } } : i,
      ),
    );
  };

  const deleteItem = (itemId: string) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, deleted: true } : i)));
  };

  const handleSave = async () => {
    if (activeItems.length === 0) {
      toast({ title: 'Error', description: 'El pedido debe tener al menos un producto.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // 1. Eliminar ítems marcados
      const toDelete = items.filter((i) => i.deleted);
      for (const item of toDelete) {
        const { error } = await supabase.from('items_pedido').delete().eq('id', item.id);
        if (error) throw error;
      }

      // 2. Actualizar ítems restantes
      for (const item of activeItems) {
        const tallesFiltrados = Object.fromEntries(
          Object.entries(item.talles).filter(([, qty]) => qty > 0),
        );
        const totalQty = Object.values(tallesFiltrados).reduce((s, q) => s + q, 0);
        const subtotal = item.precio_unitario * totalQty;
        const { error } = await supabase
          .from('items_pedido')
          .update({ talles_cantidades: tallesFiltrados as any, subtotal_usd: subtotal })
          .eq('id', item.id);
        if (error) throw error;
      }

      // 3. Actualizar pedido
      const nuevoTotal = calcTotal();
      const { error } = await supabase
        .from('pedidos')
        .update({ estado, total_usd: nuevoTotal })
        .eq('id', pedido.id);
      if (error) throw error;

      invalidateQueries.pedidos();
      toast({ title: 'Pedido actualizado', description: 'Los cambios se guardaron correctamente.' });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Editar Pedido #{pedido.id.slice(-8)}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {pedido.clientes?.nombre ?? '—'}
            {' · '}
            {new Date(pedido.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </DialogHeader>

        <Separator />

        {/* Estado */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium w-16">Estado</span>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Items */}
        <div className="overflow-y-auto max-h-[50vh] space-y-3 pr-1">
          {items.map((item) => {
            if (item.deleted) return null;
            const sizes = generateSizes({ rubro: item.rubro, genero: item.genero });
            const tallasOrdenadas = sortTallas(item.talles, item.rubro, item.genero);
            const subtotal = calcSubtotal(item);

            return (
              <div key={item.id} className="border rounded-lg p-3 space-y-3">
                {/* Header del ítem */}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                    {item.imagen_url ? (
                      <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
                    <p className="text-xs text-muted-foreground">${item.precio_unitario.toFixed(2)} c/u</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">${subtotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.values(item.talles).reduce((s, q) => s + q, 0)} uds.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará <strong>{item.nombre}</strong> del pedido. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Inputs de tallas */}
                <div className="flex flex-wrap gap-2">
                  {sizes.map((talla) => (
                    <div key={talla} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground font-medium w-12 text-center">{talla}</span>
                      <Input
                        type="number"
                        min={0}
                        value={item.talles[talla] ?? 0}
                        onChange={(e) => setTalla(item.id, talla, e.target.value)}
                        className="w-12 h-8 text-center text-sm p-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {activeItems.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Todos los productos han sido eliminados. Agregá al menos uno antes de guardar.
            </p>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{activeItems.length} {activeItems.length === 1 ? 'producto' : 'productos'}</span>
            <span className="text-muted-foreground ml-2">· Total: </span>
            <span className="font-bold text-base ml-1">${calcTotal().toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || activeItems.length === 0}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
