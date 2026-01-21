import { useEffect, useState } from 'react';
import { supabase, type ServiceVariant } from '@/lib/supabase';

export function useVariants(serviceId?: string) {
  const [variants, setVariants] = useState<ServiceVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVariants();
  }, [serviceId]);

  async function fetchVariants() {
    try {
      setLoading(true);
      let query = supabase
        .from('service_variants')
        .select('*')
        .eq('is_available', true)
        .order('order_index', { ascending: true });

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVariants(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar variantes');
    } finally {
      setLoading(false);
    }
  }

  return { variants, loading, error, refresh: fetchVariants };
}
