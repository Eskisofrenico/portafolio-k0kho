import { useEffect, useState } from 'react';
import { supabase, type Extra } from '@/lib/supabase';

export function useExtras() {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExtras();
  }, []);

  async function fetchExtras() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('extras')
        .select('*')
        .eq('is_available', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setExtras(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar extras');
    } finally {
      setLoading(false);
    }
  }

  return { extras, loading, error, refresh: fetchExtras };
}
