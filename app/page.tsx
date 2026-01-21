'use client';

import { useState } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';
import Header from '@/components/Header';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import CartButton from '@/components/CartButton';
import type { SelectedCommission } from '@/types';

export default function Home() {
  const [selectedCommissions, setSelectedCommissions] = useState<SelectedCommission[]>([]);

  const handleAddCommission = (commission: SelectedCommission) => {
    setSelectedCommissions(prev => [...prev, { ...commission, id: Date.now().toString() }]);
  };

  const handleRemoveCommission = (id: string) => {
    setSelectedCommissions(prev => prev.filter(c => c.id !== id));
  };

  const handleClearCart = () => {
    setSelectedCommissions([]);
  };

  return (
    <CurrencyProvider>
      <div className="min-h-screen">
        <Header />
        
        {/* Botón Flotante del Carrito */}
        <CartButton
          selectedCommissions={selectedCommissions}
          onRemoveCommission={handleRemoveCommission}
          onClearCart={handleClearCart}
        />

        {/* Hero Section */}
        <section className="pt-8 pb-2 md:py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl mb-4 animate-float animate-fade-in">
              ¡Bienvenid@ a mi casita! 🏠
            </h1>
            <p className="text-xl text-text/70 mb-6 animate-fade-in-delay-1">
              Soy <strong className="text-accent">k0kho_</strong>, artista digital especializada en
              personajes anime, OCs y fanarts. ✨
            </p>
            
            {/* Desktop: badges en fila */}
            <div className="hidden md:flex flex-wrap justify-center gap-3 animate-fade-in-delay-2">
              <span className="card-sketch px-4 py-2 text-sm">🎨 Estilo Anime</span>
              <span className="card-sketch px-4 py-2 text-sm">✨ OCs & Fanarts</span>
              <span className="card-sketch px-4 py-2 text-sm">💕 Shipps</span>
              <span className="card-sketch px-4 py-2 text-sm">🦊 Furros</span>
            </div>

            {/* Mobile: badges en 2 columnas + personaje debajo */}
            <div className="md:hidden flex flex-col items-center justify-center gap-3 animate-fade-in-delay-2">
              {/* Grid de badges 2x2 */}
              <div className="grid grid-cols-2 gap-2">
                <span className="card-sketch px-3 py-2 text-xs whitespace-nowrap">🎨 Estilo Anime</span>
                <span className="card-sketch px-3 py-2 text-xs whitespace-nowrap">✨ OCs & Fanarts</span>
                <span className="card-sketch px-3 py-2 text-xs whitespace-nowrap">💕 Shipps</span>
                <span className="card-sketch px-3 py-2 text-xs whitespace-nowrap">🦊 Furros</span>
              </div>

              {/* Personaje debajo */}
              <div 
                className="w-48 h-48 relative"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)'
                }}
              >
                <img
                  src="/personajes/personaje.png"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Galería y Servicios */}
        <Gallery
          onAddCommission={handleAddCommission}
          selectedCommissions={selectedCommissions}
        />

        <Footer />
      </div>
    </CurrencyProvider>
  );
}
