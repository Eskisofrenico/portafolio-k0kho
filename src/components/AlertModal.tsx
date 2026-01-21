'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '@/hooks/useModal';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'info' | 'warning' | 'error';
    icon?: string;
}

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    icon,
}: AlertModalProps) {
    const [mounted, setMounted] = useState(false);

    useModal(isOpen);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    // Configuración según el tipo
    const typeConfig = {
        info: {
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-300',
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
            defaultIcon: 'ℹ️',
        },
        warning: {
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-300',
            iconColor: 'text-yellow-600',
            iconBg: 'bg-yellow-100',
            defaultIcon: '⚠️',
        },
        error: {
            bgColor: 'bg-red-50',
            borderColor: 'border-red-300',
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            defaultIcon: '❌',
        },
    };

    const config = typeConfig[type];
    const displayIcon = icon || config.defaultIcon;

    return createPortal(
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-md w-full card-sketch relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Washi tape decorativo */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-washi opacity-80 rounded-sm"
                    style={{
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                ></div>

                {/* Contenido */}
                <div className="p-6 pt-8">
                    {/* Icono y Título */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className={`${config.iconBg} rounded-full p-3 flex-shrink-0`}>
                            <span className="text-2xl">{displayIcon}</span>
                        </div>
                        <div className="flex-1">
                            {title && (
                                <h3 className="text-xl font-bold text-text mb-2">
                                    {title}
                                </h3>
                            )}
                            <p className="text-text/80 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Botón de acción */}
                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-6 py-2 rounded-lg font-bold transition-all btn-sketch ${
                                type === 'error'
                                    ? 'bg-red text-white hover:bg-red-600'
                                    : type === 'warning'
                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    : 'bg-accent text-white hover:bg-accent/90'
                            }`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
