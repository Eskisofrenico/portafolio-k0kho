'use client';

import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function AnnouncementBanner() {
    const { getSettingValue, isSettingActive, loading } = useSiteSettings();

    const message = getSettingValue('announcement_message', '');
    const isActive = isSettingActive('announcement_message');

    // No mostrar si está cargando, no hay mensaje, o no está activo
    if (loading || !message || !isActive) return null;

    return (
        <div className="bg-gradient-to-r from-[#E69A9A] via-[#D88A8A] to-[#E69A9A] text-white py-2 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
                <span className="mx-4 text-sm font-nunito font-semibold inline-flex items-center gap-2">
                    ✨ {message} ✨
                </span>
                <span className="mx-4 text-sm font-nunito font-semibold inline-flex items-center gap-2">
                    ✨ {message} ✨
                </span>
                <span className="mx-4 text-sm font-nunito font-semibold inline-flex items-center gap-2">
                    ✨ {message} ✨
                </span>
                <span className="mx-4 text-sm font-nunito font-semibold inline-flex items-center gap-2">
                    ✨ {message} ✨
                </span>
            </div>
        </div>
    );
}
