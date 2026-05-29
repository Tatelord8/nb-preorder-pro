import { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Upload, Download, AlertTriangle, CheckCircle2, FileSpreadsheet, X,
} from 'lucide-react';
import { CartBulkService, type BulkRow } from '@/services/cart-bulk.service';
import { sortTallas } from '@/utils/sortTallas';
import type { Producto } from '@/services/productos.service';
import type { CartItem } from '@/services/cart-storage.service';

interface CartBulkUploadProps {
  open: boolean;
  onClose: () => void;
  productos: Producto[];
  userTier: string;
  onAddItems: (items: CartItem[]) => Promise<void>;
}

export function CartBulkUpload({
  open, onClose, productos, userTier, onAddItems,
}: CartBulkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setRows([]);
    setWarnings([]);
    setErrors([]);
    setFileName(null);
    setDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const handleDownloadTemplate = () => {
    const csv = CartBulkService.generateTemplate(productos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-carga-carrito.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = CartBulkService.parse(text, productos, userTier);
      setRows(result.rows);
      setWarnings(result.warnings);
      setErrors(result.errors);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleAddToCart = async () => {
    if (rows.length === 0) return;
    setAdding(true);
    try {
      const items = CartBulkService.toCartItems(rows);
      await onAddItems(items);
      setDone(true);
      setRows([]);
    } finally {
      setAdding(false);
    }
  };

  const totalUnidades = rows.reduce((s, r) => s + r.totalUnidades, 0);
  const hasContent = rows.length > 0 || warnings.length > 0 || errors.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Carga Masiva al Carrito
          </DialogTitle>
          <DialogDescription>
            Descargá la plantilla, completá las cantidades por talla y subí el archivo para agregar productos al carrito.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Paso 1: plantilla + upload */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="gap-2 flex-1" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" />
            Descargar Plantilla CSV
          </Button>

          <Button
            variant="outline"
            className="gap-2 flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {fileName ? fileName : 'Subir CSV completado'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {fileName && (
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              title="Limpiar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Estado: cargado con éxito */}
        {done && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Productos agregados al carrito correctamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Errores de parseo */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Avisos de tier / SKU no encontrado */}
        {warnings.length > 0 && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm font-medium text-yellow-800 flex items-center gap-1 mb-2">
              <AlertTriangle className="h-4 w-4" />
              {warnings.length} {warnings.length === 1 ? 'aviso' : 'avisos'}
            </p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside max-h-28 overflow-y-auto">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Preview de filas válidas */}
        {rows.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">
                {rows.length} {rows.length === 1 ? 'producto listo' : 'productos listos'} para agregar
                {' '}·{' '}
                <span className="text-muted-foreground">{totalUnidades} unidades en total</span>
              </p>
              <div className="overflow-y-auto max-h-60 space-y-2 pr-1">
                {rows.map((row) => {
                  const tallasOrdenadas = sortTallas(row.talles, row.rubro, row.genero);
                  return (
                    <div key={row.productoId} className="flex items-start gap-3 p-2 rounded border text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{row.nombre}</p>
                        <p className="text-xs text-muted-foreground font-mono">SKU: {row.sku}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tallasOrdenadas.map(([talla, qty]) => (
                            <Badge key={talla} variant="secondary" className="text-xs">
                              {talla}: {qty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${(row.precio_usd * row.totalUnidades).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{row.totalUnidades} uds.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Total estimado:{' '}
                <span className="text-base font-bold">
                  ${rows.reduce((s, r) => s + r.precio_usd * r.totalUnidades, 0).toFixed(2)}
                </span>
              </p>
              <Button onClick={handleAddToCart} disabled={adding} className="gap-2">
                {adding ? 'Agregando...' : 'Agregar al carrito'}
              </Button>
            </div>
          </>
        )}

        {/* Estado vacío post-parse sin filas válidas */}
        {hasContent && rows.length === 0 && errors.length === 0 && !done && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Ningún producto válido encontrado en el archivo.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
