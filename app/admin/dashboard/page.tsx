'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Stats = {
  services: number;
  extras: number;
  gallery: number;
  rules: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    services: 0,
    extras: 0,
    gallery: 0,
    rules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [servicesResult, extrasResult, galleryResult, rulesResult] = await Promise.all([
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('extras').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('*', { count: 'exact', head: true }),
        supabase.from('rules').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        services: servicesResult.count || 0,
        extras: extrasResult.count || 0,
        gallery: galleryResult.count || 0,
        rules: rulesResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Servicios', value: stats.services, icon: '🎨', color: 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-300' },
    { label: 'Extras', value: stats.extras, icon: '✨', color: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300' },
    { label: 'Galería', value: stats.gallery, icon: '🖼️', color: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' },
    { label: 'Reglas', value: stats.rules, icon: '📋', color: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300' },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 pl-16 md:pl-16">
        <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
          Dashboard Principal 📊
        </h1>
        <p className="text-gray-600 font-nunito text-sm md:text-base">
          Bienvenido al panel de administración de k0kho_
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.color} border-2 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 font-nunito text-sm font-semibold">
                  {card.label}
                </p>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {card.value}
                </p>
              </div>
              <div className="text-5xl opacity-80">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instrucciones */}
      <div className="bg-white rounded-lg border-2 border-[var(--sketch-border)] shadow-lg p-8">
        <h2 className="font-patrick text-2xl text-[var(--sketch-border)] mb-4">
          Guía Rápida 📖
        </h2>
        
        <div className="space-y-4 font-nunito text-gray-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <h3 className="font-bold text-lg">Servicios</h3>
              <p>Gestiona los tipos de comisiones: Icon, Chibi, Half Body, Full Body. Edita precios, descripciones y disponibilidad.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-bold text-lg">Extras</h3>
              <p>Administra complementos como fondos, personajes extra, props. Define a qué servicios aplica cada uno.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <h3 className="font-bold text-lg">Galería</h3>
              <p>Sube y elimina trabajos de tu portafolio. Organiza por categorías y controla cuáles son visibles.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-bold text-lg">Reglas</h3>
              <p>Define qué dibujas y qué no dibujas. Mantén las reglas claras para tus clientes.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-nunito">
            <strong>💡 Tip:</strong> Todos los cambios se reflejan inmediatamente en el sitio público. Los visitantes solo verán elementos marcados como "Disponibles" o "Visibles".
          </p>
        </div>
      </div>
    </div>
  );
}
