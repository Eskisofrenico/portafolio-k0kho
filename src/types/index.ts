export interface SelectedCommission {
  id: string; // ID único para poder eliminar individualmente
  serviceId: string;
  extras: string[];
  totalPriceCLP: number;
  totalPriceUSD: number;
}
