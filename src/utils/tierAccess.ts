// Utilidad para manejar la lógica jerárquica de tiers
export const canUserAccessTier = (userTier: string | null, productTier: string): boolean => {
  // Si no hay tier de usuario, denegar acceso
  if (!userTier) {
    return false;
  }

  // Convertir a números para comparación
  const userTierNum = parseInt(userTier);
  const productTierNum = parseInt(productTier);

  // Si no se pueden convertir a números, denegar acceso
  if (isNaN(userTierNum) || isNaN(productTierNum)) {
    return false;
  }

  // Lógica jerárquica:
  // Tier 0: Ve todos los productos (0, 1, 2, 3)
  // Tier 1: Ve Tier 1, 2, 3
  // Tier 2: Ve Tier 2, 3
  // Tier 3: Ve solo Tier 3
  if (userTierNum === 0) {
    return true; // Tier 0 ve todo
  }

  // Para otros tiers, solo pueden ver productos de su tier o superior
  return productTierNum >= userTierNum;
};

// Función para obtener el mensaje de acceso denegado
export const getAccessDeniedMessage = (userTier: string | null, productTier: string): string => {
  if (!userTier) {
    return "No tienes permisos para ver este producto.";
  }

  const userTierNum = parseInt(userTier);
  const productTierNum = parseInt(productTier);

  if (isNaN(userTierNum) || isNaN(productTierNum)) {
    return "No tienes permisos para ver este producto.";
  }

  if (userTierNum === 0) {
    return "No tienes permisos para ver este producto.";
  }

  if (productTierNum < userTierNum) {
    return `No tienes permisos para ver productos de Tier ${productTierNum}. Solo puedes acceder a productos de Tier ${userTierNum} o superior.`;
  }

  return "No tienes permisos para ver este producto.";
};
