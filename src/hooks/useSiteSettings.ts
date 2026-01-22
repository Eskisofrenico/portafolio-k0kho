'use client';

import { useEffect, useState } from 'react';
import { supabase, type SiteSettings } from '@/lib/supabase';

export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('*');

            if (error) throw error;
            setSettings(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    }

    const getSetting = (key: string): SiteSettings | undefined => {
        return settings.find(s => s.key === key);
    };

    const getSettingValue = (key: string, defaultValue: string = ''): string => {
        const setting = settings.find(s => s.key === key);
        return setting?.value || defaultValue;
    };

    const isSettingActive = (key: string): boolean => {
        const setting = settings.find(s => s.key === key);
        return setting?.is_active ?? false;
    };

    return {
        settings,
        loading,
        error,
        refresh: fetchSettings,
        getSetting,
        getSettingValue,
        isSettingActive
    };
}
