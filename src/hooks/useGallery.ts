import { useEffect, useState } from 'react';
import { supabase, type GalleryItem } from '@/lib/supabase';

export function useGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setGallery(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar galería');
    } finally {
      setLoading(false);
    }
  }

  return { gallery, loading, error, refresh: fetchGallery };
}
