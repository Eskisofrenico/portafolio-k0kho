'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000); // Cerrar después de 2 segundos

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-[10001]">
            <div 
                className="bg-white rounded-lg shadow-lg border-l-4 border-green px-4 py-3 flex items-center gap-3 backdrop-blur-sm animate-slide-right"
                style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
            >
                <div className="bg-green/10 rounded-full p-1.5 flex-shrink-0">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-dark"
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
                </div>
                <span className="font-semibold text-sm text-text">
                    {message}
                </span>
            </div>
        </div>,
        document.body
    );
}
