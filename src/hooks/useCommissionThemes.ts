import { useEffect, useState } from 'react';
import { supabase, type CommissionTheme } from '@/lib/supabase';

export function useCommissionThemes() {
  const [themes, setThemes] = useState<CommissionTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commission_themes')
        .select('*')
        .eq('is_available', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setThemes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar temas');
    } finally {
      setLoading(false);
    }
  }

  return { themes, loading, error, refresh: fetchThemes };
}
