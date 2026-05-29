import { generateSizes } from '@/utils/sizeGenerator';
import { canUserAccessTier } from '@/utils/tierAccess';
import type { CartItem } from './cart-storage.service';
import type { Producto } from './productos.service';

// Columnas del CSV en orden canónico agrupado por tipo
export const MASTER_SIZE_COLUMNS: string[] = [
  // Prendas
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL',
  // Kids prendas
  '2T', '3T', '4T', '5T',
  // Calzado (infantil/youth/preschool/unisex pequeño)
  '1', '1.5', '2', '2.5', '3', '3.5',
  // Calzado estándar
  '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5',
  '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5',
  '12', '12.5', '13', '13.5', '14', '15',
  // Talla única
  'Unic',
  // Pantalones (numérico)
  '24', '26', '28', '30', '32', '34', '36', '38', '40', '42',
];

export interface BulkRow {
  sku: string;
  nombre: string;
  rubro: string;
  genero: string;
  talles: Record<string, number>;
  totalUnidades: number;
  productoId: string;
  precio_usd: number;
}

export interface BulkParseResult {
  rows: BulkRow[];
  warnings: string[];
  errors: string[];
}

export class CartBulkService {
  /** Genera la plantilla CSV con todos los encabezados */
  static generateTemplate(productos: Producto[]): string {
    const header = ['SKU', 'Nombre', ...MASTER_SIZE_COLUMNS];

    const dataRows = productos.map((p) => {
      const validSizes = new Set(generateSizes({ rubro: p.rubro, genero: p.genero }));
      const sizeCells = MASTER_SIZE_COLUMNS.map((col) =>
        validSizes.has(col) ? '0' : '',
      );
      return [p.sku, p.nombre, ...sizeCells];
    });

    const lines = [header, ...dataRows].map((row) =>
      row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(','),
    );

    // BOM para compatibilidad con Excel en español
    return '﻿' + lines.join('\r\n');
  }

  /** Parsea un CSV cargado por el usuario y valida contra el catálogo */
  static parse(
    csvText: string,
    productos: Producto[],
    userTier: string,
  ): BulkParseResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const rows: BulkRow[] = [];

    const productoBySku = new Map<string, Producto>();
    for (const p of productos) {
      productoBySku.set(p.sku.trim().toUpperCase(), p);
    }

    const lines = csvText
      .replace(/^﻿/, '')           // quitar BOM
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      errors.push('El archivo no contiene filas de datos.');
      return { rows, warnings, errors };
    }

    const header = parseCSVLine(lines[0]).map((h) => h.trim());
    const skuIdx = header.findIndex((h) => h.toUpperCase() === 'SKU');
    if (skuIdx === -1) {
      errors.push('Columna "SKU" no encontrada. Verificá que el encabezado sea correcto.');
      return { rows, warnings, errors };
    }

    // Mapear columnas de talla presentes en el CSV
    const sizeMap: { col: string; idx: number }[] = [];
    for (let i = 0; i < header.length; i++) {
      if (MASTER_SIZE_COLUMNS.includes(header[i])) {
        sizeMap.push({ col: header[i], idx: i });
      }
    }

    for (let r = 1; r < lines.length; r++) {
      const cells = parseCSVLine(lines[r]);
      const sku = cells[skuIdx]?.trim().toUpperCase();
      if (!sku) continue;

      const producto = productoBySku.get(sku);
      if (!producto) {
        warnings.push(`Fila ${r + 1} — SKU "${sku}": no existe en el catálogo.`);
        continue;
      }

      if (!canUserAccessTier(userTier, producto.tier)) {
        warnings.push(
          `Fila ${r + 1} — SKU "${sku}" (${producto.nombre}): no disponible para tu tier. No se agregó al carrito.`,
        );
        continue;
      }

      // Acepta cualquier talla del MASTER con cantidad > 0, sin restringir por
      // generateSizes, para permitir casos como Mens con tallas desde 4.
      const talles: Record<string, number> = {};
      for (const { col, idx } of sizeMap) {
        const raw = cells[idx]?.trim().replace(',', '.') ?? '';
        const qty = parseInt(raw, 10);
        if (!isNaN(qty) && qty > 0) talles[col] = qty;
      }

      const totalUnidades = Object.values(talles).reduce((s, q) => s + q, 0);
      if (totalUnidades === 0) continue;

      rows.push({
        sku: producto.sku,
        nombre: producto.nombre,
        rubro: producto.rubro,
        genero: producto.genero,
        talles,
        totalUnidades,
        productoId: producto.id,
        precio_usd: producto.precio_usd,
      });
    }

    return { rows, warnings, errors };
  }

  /** Convierte las filas parseadas a CartItems listos para agregar */
  static toCartItems(rows: BulkRow[]): CartItem[] {
    return rows.map((row) => ({
      productoId: row.productoId,
      curvaId: null,
      cantidadCurvas: 1,
      talles: row.talles,
      type: 'custom' as const,
      genero: row.genero,
      precio_usd: row.precio_usd,
    }));
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
