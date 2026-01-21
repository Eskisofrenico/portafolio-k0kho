import { useEffect, useState } from 'react';
import { supabase, type EmoteConfig, type EmoteExtraAvailability } from '@/lib/supabase';

export function useEmoteConfig(serviceId: string) {
  const [configs, setConfigs] = useState<EmoteConfig[]>([]);
  const [availability, setAvailability] = useState<EmoteExtraAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [serviceId]);

  async function fetchConfig() {
    try {
      setLoading(true);
      
      // Obtener configuraciones de emotes
      const { data: configsData, error: configsError } = await supabase
        .from('emote_config')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('emote_number', { ascending: true });

      if (configsError) throw configsError;

      // Obtener disponibilidad de extras (todos los registros, no solo los disponibles)
      // Necesitamos todos para saber cuáles están explícitamente deshabilitados
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('emote_extra_availability')
        .select('*');

      if (availabilityError) throw availabilityError;

      setConfigs(configsData || []);
      setAvailability(availabilityData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración de emotes');
    } finally {
      setLoading(false);
    }
  }

  // Función helper para verificar si un extra está disponible para un emote
  function isExtraAvailableForEmote(extraId: string, emoteNumber: number): boolean {
    const availabilityRecord = availability.find(
      a => a.extra_id === extraId && a.emote_number === emoteNumber
    );
    // Si no hay registro, el extra está disponible para todos los emotes por defecto
    return availabilityRecord ? availabilityRecord.is_available : true;
  }

  // Función helper para obtener la etiqueta personalizada de un emote
  function getEmoteLabel(emoteNumber: number): string {
    const config = configs.find(c => c.emote_number === emoteNumber);
    return config?.custom_label || `Emote #${emoteNumber}`;
  }

  // Función helper para obtener la descripción de un emote
  function getEmoteDescription(emoteNumber: number): string | null {
    const config = configs.find(c => c.emote_number === emoteNumber);
    return config?.description || null;
  }

  return {
    configs,
    availability,
    loading,
    error,
    refresh: fetchConfig,
    isExtraAvailableForEmote,
    getEmoteLabel,
    getEmoteDescription,
  };
}
