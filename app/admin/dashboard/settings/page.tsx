'use client';

import { useEffect, useState } from 'react';
import { supabase, type SiteSettings } from '@/lib/supabase';
import { createPortal } from 'react-dom';

export default function SiteSettingsPage() {
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcementActive, setAnnouncementActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingId, setExistingId] = useState<string | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'announcement_message')
                .single();

            if (data) {
                setAnnouncementMessage(data.value || '');
                setAnnouncementActive(data.is_active || false);
                setExistingId(data.id);
            }
        } catch (error) {
            // No existe aún, se creará al guardar
            console.log('No existing announcement setting');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            if (existingId) {
                // Actualizar
                const { error } = await supabase
                    .from('site_settings')
                    .update({
                        value: announcementMessage,
                        is_active: announcementActive,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingId);

                if (error) throw error;
            } else {
                // Crear nuevo
                const { data, error } = await supabase
                    .from('site_settings')
                    .insert({
                        key: 'announcement_message',
                        value: announcementMessage,
                        is_active: announcementActive,
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) setExistingId(data.id);
            }
            setNotificationMessage('¡Configuración guardada correctamente!');
            setNotificationType('success');
            setShowNotification(true);
        } catch (error) {
            console.error('Error saving:', error);
            setNotificationMessage('Error al guardar la configuración');
            setNotificationType('error');
            setShowNotification(true);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 pl-16 md:pl-16">
                <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
                    Configuración del Sitio ⚙️
                </h1>
                <p className="text-gray-600 font-nunito text-sm md:text-base">
                    Configura anuncios y mensajes del sitio
                </p>
            </div>

            {/* Sección de Banner de Anuncio */}
            <div className="bg-white rounded-lg border-2 border-[var(--sketch-border)] shadow-lg p-6 max-w-2xl">
                <h2 className="font-patrick text-2xl text-[var(--sketch-border)] mb-4">
                    📢 Banner de Anuncio
                </h2>
                <p className="text-gray-600 font-nunito text-sm mb-6">
                    Este mensaje se mostrará en un banner animado en la parte superior del sitio.
                </p>

                <div className="space-y-4">
                    {/* Toggle de activación */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={announcementActive}
                                    onChange={(e) => setAnnouncementActive(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-14 h-8 rounded-full transition-colors ${announcementActive ? 'bg-green-500' : 'bg-gray-300'
                                    }`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${announcementActive ? 'translate-x-7' : 'translate-x-1'
                                        }`}></div>
                                </div>
                            </div>
                            <span className="font-nunito font-bold text-gray-700">
                                {announcementActive ? 'Banner activo' : 'Banner inactivo'}
                            </span>
                        </label>
                    </div>

                    {/* Mensaje */}
                    <div>
                        <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                            Mensaje del anuncio
                        </label>
                        <input
                            type="text"
                            value={announcementMessage}
                            onChange={(e) => setAnnouncementMessage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none font-nunito"
                            placeholder="Ej: ¡Comisiones abiertas! 🎨 Slots limitados..."
                        />
                    </div>

                    {/* Preview */}
                    {announcementMessage && (
                        <div className="mt-6">
                            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                                Vista previa
                            </label>
                            <div className="bg-gradient-to-r from-[#E69A9A] via-[#D88A8A] to-[#E69A9A] text-white py-2 rounded-lg overflow-hidden">
                                <div className="animate-marquee whitespace-nowrap">
                                    <span className="mx-4 text-sm font-nunito font-semibold">
                                        ✨ {announcementMessage} ✨
                                    </span>
                                    <span className="mx-4 text-sm font-nunito font-semibold">
                                        ✨ {announcementMessage} ✨
                                    </span>
                                    <span className="mx-4 text-sm font-nunito font-semibold">
                                        ✨ {announcementMessage} ✨
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botón guardar */}
                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {saving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notificación */}
            {mounted && showNotification && (
                <NotificationToast
                    message={notificationMessage}
                    type={notificationType}
                    onClose={() => setShowNotification(false)}
                />
            )}
        </div>
    );
}

function NotificationToast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Cerrar después de 3 segundos

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    const isSuccess = type === 'success';
    const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
    const iconBg = isSuccess ? 'bg-green-100' : 'bg-red-100';
    const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';

    return createPortal(
        <div className="fixed top-4 right-4 z-[10001] animate-slide-right">
            <div
                className={`bg-white rounded-lg shadow-lg border-l-4 ${borderColor} px-4 py-3 flex items-center gap-3 backdrop-blur-sm min-w-[300px] max-w-[400px]`}
                style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
            >
                <div className={`${iconBg} rounded-full p-1.5 flex-shrink-0`}>
                    {isSuccess ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${iconColor}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${iconColor}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    )}
                </div>
                <span className="font-nunito font-semibold text-sm text-gray-700 flex-1">
                    {message}
                </span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="Cerrar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>,
        document.body
    );
}
