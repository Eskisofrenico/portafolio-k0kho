import { useEffect, useState } from 'react';
import { supabase, type Rule } from '@/lib/supabase';

export function useRules() {
  const [rules, setRules] = useState<{ allowed: Rule[]; forbidden: Rule[] }>({
    allowed: [],
    forbidden: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const allowed = data?.filter((rule) => rule.is_allowed) || [];
      const forbidden = data?.filter((rule) => !rule.is_allowed) || [];

      setRules({ allowed, forbidden });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  }

  return { rules, loading, error, refresh: fetchRules };
}
