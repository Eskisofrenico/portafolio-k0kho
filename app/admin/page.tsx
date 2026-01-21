'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundColor: 'var(--paper-bg)',
      backgroundImage: 'linear-gradient(var(--grid-lines) 1px, transparent 1px), linear-gradient(90deg, var(--grid-lines) 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-text relative" style={{
          boxShadow: '4px 4px 0px rgba(93, 64, 55, 0.15)'
        }}>
          {/* Washi tape decorativo */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-washi opacity-80 rounded-sm" style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}></div>
          
          <div className="text-center mb-8">
            <h1 className="font-patrick text-4xl text-text mb-2">
              Panel Admin 🎨
            </h1>
            <p className="text-text/70">k0kho_ Portfolio</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-nunito font-bold text-text mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg focus:border-accent focus:outline-none transition-colors bg-paper font-nunito"
                placeholder="admin@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-nunito font-bold text-text mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-text/30 rounded-lg focus:border-accent focus:outline-none transition-colors bg-paper font-nunito"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-text hover:bg-text/90 text-paper font-nunito font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-text/70 hover:text-accent hover:underline transition-colors font-nunito"
            >
              ← Volver al sitio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
