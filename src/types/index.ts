export interface SelectedCommission {
  id: string; // ID único para poder eliminar individualmente
  serviceId: string;
  detailLevel?: string; // 'simple', 'detallado', 'premium'
  variantId?: string; // ID de la variante seleccionada
  extras: string[];
  totalPriceCLP: number;
  totalPriceUSD: number;
  // Para pack-emotes: personalización individual de cada emote
  emotesCustomization?: Array<{
    emoteNumber: number;
    extras: string[];
  }>;
  // Tema/Festivo de la comisión
  themeId?: string; // ID del tema predefinido (navidad, halloween, etc.)
  customTheme?: string; // Tema personalizado escrito por el cliente
}
