'use client';

import { useState } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';
import Header from '@/components/Header';
import Gallery from '@/components/Gallery';
import RulesSection from '@/components/RulesSection';
import WhatsAppButton from '@/components/WhatsAppButton';
import Footer from '@/components/Footer';

export default function Home() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);

  return (
    <CurrencyProvider>
      <div className="min-h-screen">
        <Header />

        {/* Hero Section */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl mb-4 animate-float animate-fade-in">
              ¡Bienvenid@ a mi casita! 🏠
            </h1>
            <p className="text-xl text-text/70 mb-6 animate-fade-in-delay-1">
              Soy <strong className="text-accent">k0kho_</strong>, artista digital especializada en
              personajes anime, OCs y fanarts. ✨
            </p>
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in-delay-2">
              <span className="card-sketch px-4 py-2 text-sm">🎨 Estilo Anime</span>
              <span className="card-sketch px-4 py-2 text-sm">✨ OCs & Fanarts</span>
              <span className="card-sketch px-4 py-2 text-sm">💕 Shipps</span>
              <span className="card-sketch px-4 py-2 text-sm">🦊 Furros</span>
            </div>
          </div>
        </section>

        {/* Galería y Servicios */}
        <Gallery
          onSelectService={setSelectedService}
          selectedService={selectedService}
        />

        {/* Sección de Reglas */}
        <RulesSection
          hasAcceptedRules={hasAcceptedRules}
          onAcceptRules={setHasAcceptedRules}
        />

        {/* Botón de WhatsApp */}
        <WhatsAppButton
          isEnabled={hasAcceptedRules}
          selectedServiceId={selectedService}
        />

        <Footer />
      </div>
    </CurrencyProvider>
  );
}
