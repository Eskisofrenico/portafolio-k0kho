import { useEffect, useState } from 'react';
import { supabase, type Testimonial } from '@/lib/supabase';

export function useTestimonials(featuredOnly?: boolean, serviceType?: string, galleryItemId?: string) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, [featuredOnly, serviceType, galleryItemId]);

  async function fetchTestimonials() {
    try {
      setLoading(true);
      let query = supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      if (galleryItemId) {
        query = query.eq('gallery_item_id', galleryItemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar testimonios');
    } finally {
      setLoading(false);
    }
  }

  return { testimonials, loading, error, refresh: fetchTestimonials };
}
