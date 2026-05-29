import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Package, Download, Loader2 } from 'lucide-react';
import type { PedidoFinalizado } from '@/services/reports.service';
import { sortTallas } from '@/utils/sortTallas';
import jsPDF from 'jspdf';

interface PedidoDetalleModalProps {
  pedido: PedidoFinalizado | null;
  open: boolean;
  onClose: () => void;
}

function ItemRow({ item }: { item: NonNullable<PedidoFinalizado['items_pedido']>[number] }) {
  const producto = item.productos;
  const tallas = (item as any).talles_cantidades as Record<string, number> | null;
  const tallasEntries = tallas
    ? sortTallas(tallas, producto?.rubro ?? '', producto?.genero ?? '')
    : [];
  const totalUnidades = tallasEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <div className="flex gap-4 p-3 rounded-lg border bg-card">
      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {producto?.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{producto?.nombre ?? 'Producto'}</p>
            <p className="text-xs text-muted-foreground font-mono">
              SKU: {producto?.sku ?? item.producto_id.slice(-8)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-sm">
              ${(item as any).subtotal_usd?.toFixed(2) ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">${item.precio_unitario.toFixed(2)} c/u</p>
          </div>
        </div>

        {tallasEntries.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tallasEntries.map(([talla, qty]) => (
              <Badge key={talla} variant="secondary" className="text-xs">
                {talla}: {qty}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs">
              {totalUnidades} uds.
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 6000);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

export function PedidoDetalleModal({ pedido, open, onClose }: PedidoDetalleModalProps) {
  const [exporting, setExporting] = useState(false);

  if (!pedido) return null;

  const items = pedido.items_pedido ?? [];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 12;
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const contentW = pageW - margin * 2;
      const imgSize = 22;

      let y = margin;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // — Encabezado —
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30);
      pdf.text(`Pedido #${pedido.id.slice(-8)}`, margin, y);
      y += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(110);
      const fechaLabel = new Date(pedido.created_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      let meta = fechaLabel;
      if (pedido.clientes?.nombre) meta += `  ·  ${pedido.clientes.nombre}`;
      if (pedido.vendedores?.nombre) meta += `  ·  Vendedor: ${pedido.vendedores.nombre}`;
      pdf.text(meta, margin, y, { maxWidth: contentW });
      y += 6;

      pdf.setDrawColor(200);
      pdf.line(margin, y, pageW - margin, y);
      y += 5;

      // — Items —
      for (const item of items) {
        const producto = item.productos;
        const tallas = (item as any).talles_cantidades as Record<string, number> | null;
        const tallasEntries = tallas
          ? sortTallas(tallas, producto?.rubro ?? '', producto?.genero ?? '')
          : [];
        const totalUnidades = tallasEntries.reduce((s, [, q]) => s + q, 0);

        // Calcular líneas de tallas para saber la altura del bloque
        const tallasText = tallasEntries.map(([t, q]) => `${t}: ${q}`).join('   ') +
          (tallasEntries.length ? `   (${totalUnidades} uds.)` : '');
        const tallasLines = tallasEntries.length
          ? pdf.splitTextToSize(tallasText, contentW - imgSize - 12)
          : [];
        const blockH = Math.max(imgSize + 6, 14 + tallasLines.length * 4.5 + 4);

        ensureSpace(blockH + 3);

        // Borde del bloque
        pdf.setDrawColor(220);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, y, contentW, blockH, 2, 2, 'FD');

        // Imagen
        if (producto?.imagen_url) {
          const b64 = await loadImageAsBase64(producto.imagen_url);
          if (b64) {
            pdf.addImage(b64, 'JPEG', margin + 3, y + 3, imgSize, imgSize);
          }
        }

        const textX = margin + imgSize + 6;
        const textW = contentW - imgSize - 9;
        const priceX = margin + contentW - 3;

        // Nombre
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30);
        const nombreLines = pdf.splitTextToSize(producto?.nombre ?? 'Producto', textW - 28);
        pdf.text(nombreLines, textX, y + 8);
        const afterNombre = y + 8 + (nombreLines.length - 1) * 5;

        // SKU
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120);
        pdf.text(`SKU: ${producto?.sku ?? '—'}`, textX, afterNombre + 5);

        // Tallas
        if (tallasLines.length > 0) {
          pdf.setFontSize(8);
          pdf.setTextColor(60);
          pdf.text(tallasLines, textX, afterNombre + 10);
        }

        // Subtotal (arriba derecha)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30);
        pdf.text(`$${(item as any).subtotal_usd?.toFixed(2) ?? '—'}`, priceX, y + 8, { align: 'right' });

        // Precio unitario
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120);
        pdf.text(`$${item.precio_unitario.toFixed(2)} c/u`, priceX, y + 13, { align: 'right' });

        y += blockH + 3;
      }

      // — Total —
      ensureSpace(14);
      pdf.setDrawColor(200);
      pdf.line(margin, y, pageW - margin, y);
      y += 7;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30);
      pdf.text(
        `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`,
        margin,
        y,
      );
      pdf.text(`$${pedido.total_usd.toFixed(2)}`, pageW - margin, y, { align: 'right' });

      const fechaStr = new Date(pedido.created_at).toISOString().split('T')[0];
      pdf.save(`pedido-${pedido.id.slice(-8)}-${fechaStr}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalle del Pedido #{pedido.id.slice(-8)}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleExportPDF}
              disabled={exporting || items.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Generando...' : 'Exportar PDF'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(pedido.created_at).toLocaleDateString('es-ES', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
            {' · '}
            <span className="font-medium text-foreground">Total: ${pedido.total_usd.toFixed(2)}</span>
          </p>
        </DialogHeader>

        <Separator />

        <div className="overflow-y-auto max-h-[55vh] pr-2">
          <div className="space-y-4 py-2">
            {items.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay ítems en este pedido.</p>
            )}
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center pt-1 text-sm font-medium">
              <span>{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
              <span className="text-base font-bold">${pedido.total_usd.toFixed(2)}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
