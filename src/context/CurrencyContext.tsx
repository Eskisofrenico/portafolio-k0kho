'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'CLP' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceCLP: number, priceUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('CLP');

  const formatPrice = (priceCLP: number, priceUSD: number) => {
    if (currency === 'CLP') {
      return `$${priceCLP.toLocaleString('es-CL')} CLP`;
    }
    return `$${priceUSD} USD`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
