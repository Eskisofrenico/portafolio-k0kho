'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Cerrar sidebar en móvil al cargar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Ejecutar al montar
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin');
    } else {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/dashboard/services', label: 'Servicios', icon: '🎨' },
    { href: '/admin/dashboard/extras', label: 'Extras', icon: '✨' },
    { href: '/admin/dashboard/gallery', label: 'Galería', icon: '🖼️' },
    { href: '/admin/dashboard/rules', label: 'Reglas', icon: '📋' },
    { href: '/admin/dashboard/testimonials', label: 'Testimonios', icon: '⭐' },
    { href: '/admin/dashboard/emotes', label: 'Config Emotes', icon: '😊' },
    { href: '/admin/dashboard/themes', label: 'Temas/Festivos', icon: '🎉' },
    { href: '/admin/dashboard/settings', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Overlay oscuro para móvil cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Botón Toggle Sidebar - Solo visible cuando el sidebar está cerrado */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-40 bg-white border-2 border-[var(--sketch-border)] rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-all"
          aria-label="Mostrar sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-full md:w-64 bg-white border-r-2 border-[var(--sketch-border)] shadow-lg z-30 transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header fijo */}
        <div className="p-6 border-b-2 border-gray-200 relative flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 bg-white border-2 border-[var(--sketch-border)] rounded-lg p-1.5 shadow-md hover:bg-gray-50 transition-all"
            aria-label="Ocultar sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h1 className="font-patrick text-2xl text-[var(--sketch-border)] pr-10">
            Panel Admin 🎨
          </h1>
          <p className="text-sm text-gray-500 mt-1">k0kho_ Portfolio</p>
        </div>

        {/* Navegación con scroll */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const handleLinkClick = () => {
              // Cerrar sidebar solo en móvil
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            };
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-nunito transition-all ${isActive
                    ? 'bg-[#E69A9A] text-white shadow-md sidebar-active-item hover:bg-[#D88A8A]'
                    : 'hover:bg-pink-50 text-gray-700'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Botones fijos en la parte inferior */}
        <div className="p-4 border-t-2 border-gray-200 flex-shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 mb-2 text-center border-2 border-[var(--sketch-border)] text-[var(--sketch-border)] rounded-lg hover:bg-gray-50 transition-colors font-nunito font-semibold"
          >
            Ver Sitio 🌐
          </a>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-nunito font-semibold"
          >
            Cerrar Sesión 🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`p-4 md:p-8 transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64 ml-0' : 'ml-0'
          }`}
      >
        {children}
      </main>
    </div>
  );
}
