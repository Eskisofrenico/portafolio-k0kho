'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '@/context/CurrencyContext';
import extras from '@/data/extras.json';

interface Extra {
    id: string;
    title: string;
    description: string;
    icon: string;
    priceCLP: number;
    priceUSD: number;
    onlyFor?: string[];
}

interface Service {
    id: string;
    title: string;
    image: string;
    priceCLP: number;
    priceUSD: number;
    priceMaxCLP?: number;
    priceMaxUSD?: number;
    category: string;
    description: string;
}

interface CommissionModalProps {
    service: Service;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedExtras: string[], showNotification?: () => void) => void;
}

export default function CommissionModal({ service, isOpen, onClose, onConfirm }: CommissionModalProps) {
    const { currency, formatPrice } = useCurrency();
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSelectedExtras([]);
            document.body.style.overflow = 'unset';
        } else {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    // Filtrar extras disponibles para este tipo de servicio
    const availableExtras = (extras as Extra[]).filter(extra => {
        if (!extra.onlyFor) return true;
        return extra.onlyFor.includes(service.id);
    });

    // Calcular precio total
    const calculateTotal = () => {
        let totalCLP = service.priceCLP;
        let totalUSD = service.priceUSD;

        selectedExtras.forEach(extraId => {
            const extra = availableExtras.find(e => e.id === extraId);
            if (extra) {
                totalCLP += extra.priceCLP;
                totalUSD += extra.priceUSD;
            }
        });

        return { totalCLP, totalUSD };
    };

    const { totalCLP, totalUSD } = calculateTotal();

    const toggleExtra = (extraId: string) => {
        setSelectedExtras(prev =>
            prev.includes(extraId)
                ? prev.filter(id => id !== extraId)
                : [...prev, extraId]
        );
    };

    const handleAddAndContinue = () => {
        onConfirm(selectedExtras, () => {
            // Callback para mostrar notificación
            // El modal se cierra después de agregar
        });
        onClose(); // Cerrar el modal después de agregar
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto card-sketch p-6 relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-text mb-2">
                            Personalizar {service.title}
                        </h2>
                        <p className="text-text/70">{service.description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="text-text hover:text-accent transition-colors p-2 hover:bg-accent/10 rounded-full"
                        aria-label="Cerrar modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Precio Base */}
                <div className="card-sketch bg-washi/30 p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-text font-medium">Precio Base:</span>
                        <span className="text-accent font-bold text-lg">
                            {formatPrice(service.priceCLP, service.priceUSD)}
                        </span>
                    </div>
                </div>

                {/* Lista de Extras */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-text mb-4">
                        Agregar Extras (Opcional)
                    </h3>
                    <div className="space-y-3">
                        {availableExtras.map((extra) => {
                            const isSelected = selectedExtras.includes(extra.id);
                            return (
                                <button
                                    key={extra.id}
                                    onClick={() => toggleExtra(extra.id)}
                                    className={`w-full text-left card-sketch p-4 transition-all ${
                                        isSelected
                                            ? 'ring-2 ring-accent bg-accent/5 scale-[1.02]'
                                            : 'hover:scale-[1.01] hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <span className="text-3xl">{extra.icon}</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-text mb-1">
                                                    {extra.title}
                                                </h4>
                                                <p className="text-sm text-text/70">
                                                    {extra.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-accent font-bold">
                                                +{formatPrice(extra.priceCLP, extra.priceUSD)}
                                            </span>
                                            <div
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                                    isSelected
                                                        ? 'bg-accent border-accent'
                                                        : 'border-text/30'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 text-white"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Resumen de Precio */}
                <div className="card-sketch bg-green/20 p-4 mb-6 border-2 border-green-dark">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-text font-bold text-lg">Total:</span>
                        <span className="text-green-dark font-bold text-2xl">
                            {formatPrice(totalCLP, totalUSD)}
                        </span>
                    </div>
                    {selectedExtras.length > 0 && (
                        <p className="text-sm text-text/70">
                            Incluye {selectedExtras.length} extra{selectedExtras.length > 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="flex-1 py-3 px-6 bg-text/10 text-text font-bold rounded-lg hover:bg-text/20 transition-colors card-sketch"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddAndContinue();
                        }}
                        className="flex-1 py-3 px-6 bg-green text-white font-bold rounded-lg hover:bg-green-dark transition-colors btn-sketch"
                    >
                        Agregar y Continuar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
