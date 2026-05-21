/**
 * Sistema de curvas predefinidas basado en género y opción
 * Cada curva define cantidades específicas para cada talla
 */

export interface PredefinedCurve {
  genero: string;
  rubro: string;
  opcion: number;
  tallas: Record<string, number>;
  total: number;
  marca?: string; // undefined = aplica a todas las marcas sin especificación propia
  work?: boolean;
  silueta?: string;
}

export interface CurveOption {
  opcion: number;
  total: number;
  description: string;
}

/**
 * Curvas predefinidas según la tabla proporcionada
 */
export const PREDEFINED_CURVES: PredefinedCurve[] = [
  // MENS CALZADOS - Opción 1 (Total: 24)
  {
    genero: "Mens",
    rubro: "Calzados",
    opcion: 1,
    total: 24,
    tallas: {
      "7": 1,
      "7.5": 2,
      "8": 3,
      "8.5": 3,
      "9": 3,
      "9.5": 3,
      "10": 3,
      "10.5": 2,
      "11": 2,
      "11.5": 1,
      "12": 1,
      "13": 0,
      "14": 0,
      "15": 0,
    },
  },
  // MENS CALZADOS - Opción 2 (Total: 17)
  {
    genero: "Mens",
    rubro: "Calzados",
    opcion: 2,
    total: 17,
    tallas: {
      "7": 1,
      "7.5": 1,
      "8": 2,
      "8.5": 2,
      "9": 2,
      "9.5": 2,
      "10": 2,
      "10.5": 2,
      "11": 1,
      "11.5": 1,
      "12": 1,
      "13": 0,
      "14": 0,
      "15": 0,
    },
  },
  // MENS PRENDAS - Opción 1 (Total: 15)
  {
    genero: "Mens",
    rubro: "Prendas",
    opcion: 1,
    total: 15,
    tallas: {
      S: 2,
      M: 4,
      L: 4,
      XL: 3,
      XXL: 2,
    },
  },
  // MENS PRENDAS - Opción 2 (Total: 12)
  {
    genero: "Mens",
    rubro: "Prendas",
    opcion: 2,
    total: 12,
    tallas: {
      S: 1,
      M: 3,
      L: 3,
      XL: 3,
      XXL: 2,
    },
  },
  // WOMENS CALZADOS - Opción 1 (Total: 21)
  {
    genero: "Womens",
    rubro: "Calzados",
    opcion: 1,
    total: 21,
    tallas: {
      "6": 1,
      "6.5": 2,
      "7": 3,
      "7.5": 3,
      "8": 3,
      "8.5": 3,
      "9": 3,
      "9.5": 2,
      "10": 1,
    },
  },
  // WOMENS CALZADOS - Opción 2 (Total: 14)
  {
    genero: "Womens",
    rubro: "Calzados",
    opcion: 2,
    total: 14,
    tallas: {
      "6": 1,
      "6.5": 1,
      "7": 2,
      "7.5": 2,
      "8": 2,
      "8.5": 2,
      "9": 2,
      "9.5": 1,
      "10": 1,
    },
  },
  // WOMENS PRENDAS - Opción 1 (Total: 18)
  {
    genero: "Womens",
    rubro: "Prendas",
    opcion: 1,
    total: 18,
    tallas: {
      XS: 1,
      S: 3,
      M: 3,
      L: 2,
      XL: 1,
    },
  },
  // WOMENS PRENDAS - Opción 2 (Total: 15)
  {
    genero: "Womens",
    rubro: "Prendas",
    opcion: 2,
    total: 15,
    tallas: {
      XS: 1,
      S: 2,
      M: 2,
      L: 1,
      XL: 1,
    },
  },
  // UNISEX CALZADOS - Opción 1 (Total: 17)
  // Rango de tallas: 4-12 con medios (distribución plana)
  {
    genero: "Unisex",
    rubro: "Calzados",
    opcion: 1,
    total: 17,
    tallas: {
      "4": 1,
      "4.5": 1,
      "5": 1,
      "5.5": 1,
      "6": 1,
      "6.5": 1,
      "7": 1,
      "7.5": 1,
      "8": 1,
      "8.5": 1,
      "9": 1,
      "9.5": 1,
      "10": 1,
      "10.5": 1,
      "11": 1,
      "11.5": 1,
      "12": 1,
    },
  },
  // UNISEX CALZADOS - Opción 2 (Total: 11)
  // Rango de tallas: 4-12 con medios (curva centrada ~6.5–10)
  {
    genero: "Unisex",
    rubro: "Calzados",
    opcion: 2,
    total: 11,
    tallas: {
      "4": 0,
      "4.5": 0,
      "5": 0,
      "5.5": 0,
      "6": 1,
      "6.5": 1,
      "7": 3,
      "7.5": 1,
      "8": 2,
      "8.5": 1,
      "9": 1,
      "9.5": 1,
      "10": 1,
      "10.5": 0,
      "11": 0,
      "11.5": 0,
      "12": 0,
    },
  },
  // UNISEX CALZADOS - Opción 3 (Total: 27)
  // Rango de tallas: 4-12
  {
    genero: "Unisex",
    rubro: "Calzados",
    opcion: 3,
    total: 27,
    tallas: {
      "4": 1,
      "4.5": 1,
      "5": 1,
      "5.5": 2,
      "6": 2,
      "6.5": 2,
      "7": 2,
      "7.5": 2,
      "8": 2,
      "8.5": 2,
      "9": 2,
      "9.5": 2,
      "10": 2,
      "10.5": 1,
      "11": 1,
      "11.5": 1,
      "12": 1,
    },
  },
  // UNISEX PRENDAS - Opción 1 (Total: 18)
  {
    genero: "Unisex",
    rubro: "Prendas",
    opcion: 1,
    total: 18,
    tallas: {
      XS: 2,
      S: 3,
      M: 4,
      L: 4,
      XL: 3,
      XXL: 2,
    },
  },
  // PRESCHOOL CALZADOS - Opción 1 (Total: 19)
  {
    genero: "Preschool",
    rubro: "Calzados",
    opcion: 1,
    total: 19,
    tallas: {
      "1": 1,
      "1.5": 1,
      "2": 1,
      "2.5": 1,
      "3": 1,
      "10.5": 2,
      "11": 2,
      "11.5": 2,
      "12": 2,
      "12.5": 2,
      "13": 2,
      "13.5": 2,
    },
  },
  // PRESCHOOL CALZADOS - Opción 2 (Total: 17)
  {
    genero: "Preschool",
    rubro: "Calzados",
    opcion: 2,
    total: 17,
    tallas: {
      "1": 2,
      "1.5": 2,
      "2": 2,
      "2.5": 2,
      "3": 2,
      "10.5": 1,
      "11": 1,
      "11.5": 1,
      "12": 1,
      "12.5": 1,
      "13": 1,
      "13.5": 1,
    },
  },
  // INFANT CALZADOS - Opción 1 (Total: 10)
  {
    genero: "Infant",
    rubro: "Calzados",
    opcion: 1,
    total: 10,
    tallas: {
      "5": 1,
      "6": 1,
      "7": 2,
      "8": 2,
      "9": 2,
      "10": 2,
    },
  },
  // INFANT CALZADOS - Opción 2 (Total: 12)
  {
    genero: "Infant",
    rubro: "Calzados",
    opcion: 2,
    total: 12,
    tallas: {
      "5": 1,
      "6": 1,
      "7": 2,
      "8": 2,
      "9": 3,
      "10": 3,
    },
  },
  // GRADESCHOOL CALZADOS - Opción 1 (Total: 16)
  {
    genero: "Gradeschool",
    rubro: "Calzados",
    opcion: 1,
    total: 16,
    tallas: {
      "3.5": 2,
      "4": 2,
      "4.5": 2,
      "5": 2,
      "5.5": 2,
      "6": 2,
      "6.5": 2,
      "7": 2,
    },
  },
  // GRADESCHOOL CALZADOS - Opción 2 (Total: 16)
  {
    genero: "Gradeschool",
    rubro: "Calzados",
    opcion: 2,
    total: 16,
    tallas: {
      "3.5": 3,
      "4": 3,
      "4.5": 3,
      "5": 2,
      "5.5": 2,
      "6": 1,
      "6.5": 1,
      "7": 1,
    },
  },
  // YOUTH CALZADOS - Opción 1 (Total: 19)
  {
    genero: "Youth",
    rubro: "Calzados",
    opcion: 1,
    total: 19,
    tallas: {
      "1": 1,
      "1.5": 1,
      "2": 1,
      "2.5": 1,
      "3": 1,
      "10.5": 2,
      "11": 2,
      "11.5": 2,
      "12": 2,
      "12.5": 2,
      "13": 2,
      "13.5": 2,
    },
  },
  // YOUTH CALZADOS - Opción 2 (Total: 17)
  {
    genero: "Youth",
    rubro: "Calzados",
    opcion: 2,
    total: 17,
    tallas: {
      "1": 2,
      "1.5": 2,
      "2": 2,
      "2.5": 2,
      "3": 2,
      "10.5": 1,
      "11": 1,
      "11.5": 1,
      "12": 1,
      "12.5": 1,
      "13": 1,
      "13.5": 1,
    },
  },
  // CAT CALZADOS MENS — Opción 1 (Total: 15)
  {
    marca: "cat",
    genero: "Mens",
    rubro: "Calzados",
    opcion: 1,
    total: 15,
    tallas: {
      "7": 1,
      "7.5": 1,
      "8": 2,
      "8.5": 2,
      "9": 2,
      "9.5": 2,
      "10": 2,
      "10.5": 1,
      "11": 1,
      "12": 1,
    },
  },
  // CAT CALZADOS WOMENS — Opción 1 (Total: 14)
  {
    marca: "cat",
    genero: "Womens",
    rubro: "Calzados",
    opcion: 1,
    total: 14,
    tallas: {
      "5": 1,
      "5.5": 1,
      "6": 2,
      "6.5": 2,
      "7": 2,
      "7.5": 2,
      "8": 2,
      "8.5": 1,
      "9": 1,
    },
  },
  // CAT PRENDAS MENS TOP — Opción 1 (Total: 5)
  {
    marca: "cat",
    genero: "Mens",
    rubro: "Prendas",
    silueta: "top",
    opcion: 1,
    total: 5,
    tallas: {
      S: 1,
      M: 1,
      L: 1,
      XL: 1,
      "2XL": 1,
    },
  },
  // CAT PRENDAS MENS TOP — Opción 2 (Total: 8)
  {
    marca: "cat",
    genero: "Mens",
    rubro: "Prendas",
    silueta: "top",
    opcion: 2,
    total: 8,
    tallas: {
      S: 1,
      M: 2,
      L: 2,
      XL: 2,
      "2XL": 1,
    },
  },
  // CAT PRENDAS MENS TOP — Opción 3 (Total: 11) — solo cuando work=true (incluye 3XL y 4XL)
  {
    marca: "cat",
    genero: "Mens",
    rubro: "Prendas",
    silueta: "top",
    work: true,
    opcion: 3,
    total: 11,
    tallas: {
      S: 1,
      M: 2,
      L: 2,
      XL: 2,
      "2XL": 2,
      "3XL": 1,
      "4XL": 1,
    },
  },
  // CAT PRENDAS WOMENS TOP — Opción 1 (Total: 4)
  {
    marca: "cat",
    genero: "Womens",
    rubro: "Prendas",
    silueta: "top",
    opcion: 1,
    total: 4,
    tallas: {
      XS: 1,
      S: 1,
      M: 1,
      L: 1,
      XL: 0,
    },
  },
  // CAT PRENDAS WOMENS TOP — Opción 2 (Total: 7)
  {
    marca: "cat",
    genero: "Womens",
    rubro: "Prendas",
    silueta: "top",
    opcion: 2,
    total: 7,
    tallas: {
      XS: 1,
      S: 2,
      M: 2,
      L: 1,
      XL: 1,
    },
  },
  // CAT PRENDAS MENS PANT — Opción 1 (Total: 6)
  {
    marca: "cat",
    genero: "Mens",
    rubro: "Prendas",
    silueta: "pant",
    opcion: 1,
    total: 6,
    tallas: {
      "28": 0,
      "30": 1,
      "32": 1,
      "34": 1,
      "36": 1,
      "38": 1,
      "40": 1,
      "42": 0,
    },
  },
  // CAT PRENDAS MENS PANT — Opción 2 (Total: 9)
  {
    marca: "cat",
    genero: "Mens",
    rubro: "Prendas",
    silueta: "pant",
    opcion: 2,
    total: 9,
    tallas: {
      "28": 0,
      "30": 1,
      "32": 2,
      "34": 2,
      "36": 2,
      "38": 1,
      "40": 1,
      "42": 0,
    },
  },
  // CAT PRENDAS WOMENS PANT — Opción 1 (Total: 5)
  {
    marca: "cat",
    genero: "Womens",
    rubro: "Prendas",
    silueta: "pant",
    opcion: 1,
    total: 5,
    tallas: {
      "24": 1,
      "26": 1,
      "28": 1,
      "30": 1,
      "32": 1,
    },
  },
  // CAT PRENDAS WOMENS PANT — Opción 2 (Total: 7)
  {
    marca: "cat",
    genero: "Womens",
    rubro: "Prendas",
    silueta: "pant",
    opcion: 2,
    total: 7,
    tallas: {
      "24": 1,
      "26": 2,
      "28": 2,
      "30": 1,
      "32": 1,
    },
  },
];

/**
 * Obtiene las curvas disponibles para un género y rubro específico
 */
export function getCurvesForGender(
  genero: string,
  rubro?: string,
  marca?: string,
  work?: boolean | null,
  silueta?: string | null
): CurveOption[] {
  const normalizedMarca = marca?.toLowerCase().trim();
  const normalizedSilueta = silueta?.toLowerCase().trim();
  const hasWork = work !== undefined && work !== null;

  let curves = PREDEFINED_CURVES.filter((curve) => {
    if (curve.genero.toLowerCase() !== genero.toLowerCase()) return false;
    if (rubro && curve.rubro.toLowerCase() !== rubro.toLowerCase()) return false;

    if (normalizedSilueta) {
      // La curva debe tener la misma silueta
      if (curve.silueta?.toLowerCase() !== normalizedSilueta) return false;
      // Para "top": también filtrar por work si se proporcionó
      // Si la curva exige un valor de work, verificar que coincida con el producto
      if (curve.work !== undefined && curve.work !== work) return false;
    } else {
      // Sin silueta: excluir curvas que requieren silueta o work
      if (curve.silueta !== undefined || curve.work !== undefined) return false;
    }

    if (normalizedMarca) {
      return curve.marca === normalizedMarca || curve.marca === undefined;
    }
    return curve.marca === undefined;
  });

  if (normalizedMarca) {
    const marcaCurves = curves.filter((c) => c.marca === normalizedMarca);
    if (marcaCurves.length > 0) curves = marcaCurves;
  }

  return curves.map((curve) => ({
    opcion: curve.opcion,
    total: curve.total,
    description: `${curve.rubro} - Opción ${curve.opcion} (Total: ${curve.total} unidades)`,
  }));
}

/**
 * Obtiene una curva específica por género, rubro y opción
 */
export function getCurve(
  genero: string,
  rubro: string,
  opcion: number,
  marca?: string,
  work?: boolean | null,
  silueta?: string | null
): PredefinedCurve | null {
  const normalizedMarca = marca?.toLowerCase().trim();
  const normalizedSilueta = silueta?.toLowerCase().trim();
  const hasWork = work !== undefined && work !== null;

  const matches = (curve: PredefinedCurve) => {
    if (curve.genero.toLowerCase() !== genero.toLowerCase()) return false;
    if (curve.rubro.toLowerCase() !== rubro.toLowerCase()) return false;
    if (curve.opcion !== opcion) return false;
    if (normalizedSilueta) {
      if (curve.silueta?.toLowerCase() !== normalizedSilueta) return false;
      // Si la curva exige un valor de work, verificar que coincida con el producto
      if (curve.work !== undefined && curve.work !== work) return false;
    } else {
      if (curve.silueta !== undefined || curve.work !== undefined) return false;
    }
    return true;
  };

  // Intentar curva específica de marca primero, luego genérica
  if (normalizedMarca) {
    const marcaCurve = PREDEFINED_CURVES.find(
      (curve) => matches(curve) && curve.marca === normalizedMarca
    );
    if (marcaCurve) return marcaCurve;
  }
  return PREDEFINED_CURVES.find((curve) => matches(curve) && curve.marca === undefined) || null;
}

/**
 * Obtiene todas las curvas disponibles
 */
export function getAllCurves(): PredefinedCurve[] {
  return PREDEFINED_CURVES;
}

/**
 * Obtiene las tallas disponibles en una curva específica
 */
export function getCurveSizes(
  genero: string,
  rubro: string,
  opcion: number
): string[] {
  const curve = getCurve(genero, rubro, opcion);
  return curve ? Object.keys(curve.tallas) : [];
}

/**
 * Obtiene la cantidad para una talla específica en una curva
 */
export function getCurveQuantity(
  genero: string,
  rubro: string,
  opcion: number,
  talla: string
): number {
  const curve = getCurve(genero, rubro, opcion);
  return curve ? curve.tallas[talla] || 0 : 0;
}

/**
 * Calcula el total de unidades en una curva
 */
export function getCurveTotal(
  genero: string,
  rubro: string,
  opcion: number
): number {
  const curve = getCurve(genero, rubro, opcion);
  return curve ? curve.total : 0;
}

/**
 * Aplica una curva a un producto (multiplica cantidades por número de curvas)
 */
export function applyCurveToProduct(
  genero: string,
  rubro: string,
  opcion: number,
  numberOfCurves: number = 1,
  marca?: string,
  work?: boolean | null,
  silueta?: string | null
): Record<string, number> {
  const curve = getCurve(genero, rubro, opcion, marca, work, silueta);
  if (!curve) return {};

  const result: Record<string, number> = {};
  Object.entries(curve.tallas).forEach(([talla, cantidad]) => {
    result[talla] = cantidad * numberOfCurves;
  });

  return result;
}

/**
 * Obtiene información detallada de una curva
 */
export function getCurveInfo(
  genero: string,
  rubro: string,
  opcion: number
): {
  genero: string;
  rubro: string;
  opcion: number;
  total: number;
  tallas: string[];
  description: string;
} | null {
  const curve = getCurve(genero, rubro, opcion);
  if (!curve) return null;

  return {
    genero: curve.genero,
    rubro: curve.rubro,
    opcion: curve.opcion,
    total: curve.total,
    tallas: Object.keys(curve.tallas),
    description: `${curve.rubro} ${curve.genero} - Opción ${curve.opcion} (${curve.total} unidades)`,
  };
}
