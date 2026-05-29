import { generateSizes } from './sizeGenerator';

/**
 * Ordena las entradas de talles_cantidades según el orden canónico
 * definido por generateSizes para el rubro/género del producto.
 * Las tallas desconocidas se ubican al final en orden alfabético.
 */
export function sortTallas(
  tallas: Record<string, number>,
  rubro: string,
  genero: string,
): [string, number][] {
  const canonicalOrder = generateSizes({ rubro, genero });
  const entries = Object.entries(tallas).filter(([, qty]) => qty > 0);

  return entries.sort(([a], [b]) => {
    const ia = canonicalOrder.indexOf(a);
    const ib = canonicalOrder.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}
