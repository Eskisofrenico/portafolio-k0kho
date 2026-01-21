'use client';

import { useCurrency } from '@/context/CurrencyContext';

export default function Header() {
    const { currency, setCurrency } = useCurrency();

    return (
        <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b-2 border-dashed border-accent/30">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo / Avatar */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-red overflow-hidden border-2 border-text animate-wiggle">
                        <span className="text-2xl flex items-center justify-center h-full">🎨</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">k0kho_</h1>
                        <p className="text-sm text-text/60">Comisiones Abiertas ✨</p>
                    </div>
                </div>

                {/* Currency Toggle */}
                <div className="currency-toggle">
                    <button
                        onClick={() => setCurrency('CLP')}
                        className={currency === 'CLP' ? 'active' : ''}
                    >
                        🇨🇱 CLP
                    </button>
                    <button
                        onClick={() => setCurrency('USD')}
                        className={currency === 'USD' ? 'active' : ''}
                    >
                        🌎 USD
                    </button>
                </div>
            </div>
        </header>
    );
}
