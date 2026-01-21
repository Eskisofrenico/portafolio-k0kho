import { useEffect, useState } from 'react';
import { supabase, type DetailLevel } from '@/lib/supabase';

export function useDetailLevels(serviceId?: string) {
  const [detailLevels, setDetailLevels] = useState<DetailLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetailLevels();
  }, [serviceId]);

  async function fetchDetailLevels() {
    try {
      setLoading(true);
      let query = supabase
        .from('service_detail_levels')
        .select('*')
        .eq('is_available', true)
        .order('order_index', { ascending: true });

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDetailLevels(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar niveles de detalle');
    } finally {
      setLoading(false);
    }
  }

  return { detailLevels, loading, error, refresh: fetchDetailLevels };
}
