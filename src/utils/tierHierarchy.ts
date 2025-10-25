// Utilidades para manejar la jerarquía de Tiers
// Tier 0 = Más alto (Premium)
// Tier 1 = Alto (Gold) 
// Tier 2 = Medio (Silver)
// Tier 3 = Bajo (Bronze)

export type TierLevel = '0' | '1' | '2' | '3';

export interface TierInfo {
  level: TierLevel;
  name: string;
  description: string;
  priority: number; // 0 = más alto, 3 = más bajo
}

export const TIER_HIERARCHY: Record<TierLevel, TierInfo> = {
  '0': {
    level: '0',
    name: 'Premium',
    description: 'Tier más alto - Acceso completo',
    priority: 0
  },
  '1': {
    level: '1', 
    name: 'Gold',
    description: 'Tier alto - Acceso amplio',
    priority: 1
  },
  '2': {
    level: '2',
    name: 'Silver', 
    description: 'Tier medio - Acceso estándar',
    priority: 2
  },
  '3': {
    level: '3',
    name: 'Bronze',
    description: 'Tier bajo - Acceso básico', 
    priority: 3
  }
};

export const TIER_LEVELS: TierLevel[] = ['0', '1', '2', '3'];

export const TIER_NAMES = {
  '0': 'Premium',
  '1': 'Gold', 
  '2': 'Silver',
  '3': 'Bronze'
} as const;

/**
 * Obtiene información de un tier específico
 */
export function getTierInfo(tier: TierLevel): TierInfo {
  return TIER_HIERARCHY[tier];
}

/**
 * Obtiene el nombre de un tier
 */
export function getTierName(tier: TierLevel): string {
  return TIER_NAMES[tier];
}

/**
 * Compara dos tiers - retorna true si tier1 es mayor o igual que tier2
 */
export function isTierGreaterOrEqual(tier1: TierLevel, tier2: TierLevel): boolean {
  return TIER_HIERARCHY[tier1].priority <= TIER_HIERARCHY[tier2].priority;
}

/**
 * Compara dos tiers - retorna true si tier1 es mayor que tier2
 */
export function isTierGreater(tier1: TierLevel, tier2: TierLevel): boolean {
  return TIER_HIERARCHY[tier1].priority < TIER_HIERARCHY[tier2].priority;
}

/**
 * Obtiene todos los tiers disponibles ordenados por jerarquía
 */
export function getAllTiers(): TierInfo[] {
  return TIER_LEVELS.map(level => TIER_HIERARCHY[level]);
}

/**
 * Obtiene tiers que son mayores o iguales al tier especificado
 */
export function getTiersGreaterOrEqual(minTier: TierLevel): TierInfo[] {
  return TIER_LEVELS
    .filter(level => isTierGreaterOrEqual(level, minTier))
    .map(level => TIER_HIERARCHY[level]);
}

/**
 * Obtiene tiers que son menores o iguales al tier especificado
 */
export function getTiersLessOrEqual(maxTier: TierLevel): TierInfo[] {
  return TIER_LEVELS
    .filter(level => isTierGreaterOrEqual(maxTier, level))
    .map(level => TIER_HIERARCHY[level]);
}

/**
 * Valida si un string es un tier válido
 */
export function isValidTier(tier: string): tier is TierLevel {
  return TIER_LEVELS.includes(tier as TierLevel);
}

/**
 * Obtiene el tier más alto disponible
 */
export function getHighestTier(): TierLevel {
  return '0';
}

/**
 * Obtiene el tier más bajo disponible
 */
export function getLowestTier(): TierLevel {
  return '3';
}
