'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { useExtras } from '@/hooks/useExtras';
import { useEmoteConfig } from '@/hooks/useEmoteConfig';
import { useModal } from '@/hooks/useModal';
import type { Extra as SupabaseExtra } from '@/lib/supabase';

interface Extra {
    id: string;
    title: string;
    description: string;
    icon: string;
    priceCLP: number;
    priceUSD: number;
    onlyFor?: string[];
}

interface EmoteCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (emotesCustomization: EmoteCustomization[]) => void;
    numberOfEmotes: number; // Cantidad de emotes según la variante seleccionada
    basePriceCLP: number;
    basePriceUSD: number;
    serviceId: string;
}

export interface EmoteCustomization {
    emoteNumber: number; // 1, 2, 3, etc.
    extras: string[]; // IDs de los extras seleccionados para este emote
}

export default function EmoteCustomizationModal({
    isOpen,
    onClose,
    onConfirm,
    numberOfEmotes,
    basePriceCLP,
    basePriceUSD,
    serviceId,
}: EmoteCustomizationModalProps) {
    const { formatPrice } = useCurrency();
    const { extras: supabaseExtras, loading: extrasLoading } = useExtras();
    const { 
        isExtraAvailableForEmote, 
        getEmoteLabel, 
        getEmoteDescription,
        loading: configLoading 
    } = useEmoteConfig(serviceId);
    const [emotesCustomization, setEmotesCustomization] = useState<EmoteCustomization[]>([]);
    const [expandedEmotes, setExpandedEmotes] = useState<Set<number>>(new Set());
    const [mounted, setMounted] = useState(false);

    // Convertir extras de Supabase al formato esperado
    const typedExtras: Extra[] = supabaseExtras.map((e: SupabaseExtra) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        icon: e.icon,
        priceCLP: e.price_clp,
        priceUSD: e.price_usd,
        onlyFor: e.only_for,
    }));

    // Filtrar extras disponibles para pack-emotes
    const baseAvailableExtras = typedExtras.filter(extra => {
        if (!extra.onlyFor || extra.onlyFor.length === 0) return true;
        return extra.onlyFor.includes(serviceId);
    });

    // Inicializar la personalización de emotes
    useEffect(() => {
        if (isOpen && numberOfEmotes > 0) {
            const initialCustomization: EmoteCustomization[] = Array.from(
                { length: numberOfEmotes },
                (_, index) => ({
                    emoteNumber: index + 1,
                    extras: [],
                })
            );
            setEmotesCustomization(initialCustomization);
            // Expandir el primer emote por defecto
            setExpandedEmotes(new Set([1]));
        }
    }, [isOpen, numberOfEmotes]);

    useModal(isOpen);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted || extrasLoading || configLoading) return null;

    // Función para obtener extras disponibles para un emote específico
    const getAvailableExtrasForEmote = (emoteNumber: number) => {
        return baseAvailableExtras.filter(extra => 
            isExtraAvailableForEmote(extra.id, emoteNumber)
        );
    };

    const toggleEmoteExpansion = (emoteNumber: number) => {
        setExpandedEmotes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(emoteNumber)) {
                newSet.delete(emoteNumber);
            } else {
                newSet.add(emoteNumber);
            }
            return newSet;
        });
    };

    const toggleExtraForEmote = (emoteNumber: number, extraId: string) => {
        setEmotesCustomization(prev => {
            return prev.map(emote => {
                if (emote.emoteNumber === emoteNumber) {
                    const hasExtra = emote.extras.includes(extraId);
                    return {
                        ...emote,
                        extras: hasExtra
                            ? emote.extras.filter(id => id !== extraId)
                            : [...emote.extras, extraId],
                    };
                }
                return emote;
            });
        });
    };

    // Calcular precio total
    const calculateTotal = () => {
        let totalCLP = basePriceCLP;
        let totalUSD = basePriceUSD;

        emotesCustomization.forEach(emote => {
            const availableExtrasForEmote = getAvailableExtrasForEmote(emote.emoteNumber);
            emote.extras.forEach(extraId => {
                const extra = availableExtrasForEmote.find(e => e.id === extraId);
                if (extra) {
                    totalCLP += extra.priceCLP;
                    totalUSD += extra.priceUSD;
                }
            });
        });

        return { totalCLP, totalUSD };
    };

    const { totalCLP, totalUSD } = calculateTotal();

    const getEmoteTotalPrice = (emoteNumber: number) => {
        const emote = emotesCustomization.find(e => e.emoteNumber === emoteNumber);
        if (!emote) return { clp: 0, usd: 0 };

        let clp = 0;
        let usd = 0;
        const availableExtrasForEmote = getAvailableExtrasForEmote(emoteNumber);

        emote.extras.forEach(extraId => {
            const extra = availableExtrasForEmote.find(e => e.id === extraId);
            if (extra) {
                clp += extra.priceCLP;
                usd += extra.priceUSD;
            }
        });

        return { clp, usd };
    };

    const handleConfirm = () => {
        onConfirm(emotesCustomization);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col card-sketch relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-dashed border-text/20 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-text mb-2">
                                Personalizar Emotes
                            </h2>
                            <p className="text-text/70">
                                Personaliza cada emote individualmente con extras opcionales
                            </p>
                            <p className="text-sm text-text/60 mt-1">
                                Pack de {numberOfEmotes} emotes
                            </p>
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
                </div>

                {/* Cuerpo con scroll */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    <div className="space-y-4">
                        {emotesCustomization.map((emote) => {
                            const isExpanded = expandedEmotes.has(emote.emoteNumber);
                            const emoteTotal = getEmoteTotalPrice(emote.emoteNumber);
                            const hasExtras = emote.extras.length > 0;

                            return (
                                <div
                                    key={emote.emoteNumber}
                                    className="card-sketch border-2 transition-all"
                                >
                                    {/* Header del Emote - Siempre visible */}
                                    <button
                                        type="button"
                                        onClick={() => toggleEmoteExpansion(emote.emoteNumber)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">
                                                {emote.emoteNumber}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-text">
                                                    {getEmoteLabel(emote.emoteNumber)}
                                                </h3>
                                                <p className="text-sm text-text/60">
                                                    {emote.extras.length > 0
                                                        ? `${emote.extras.length} extra${emote.extras.length > 1 ? 's' : ''} seleccionado${emote.extras.length > 1 ? 's' : ''}`
                                                        : getEmoteDescription(emote.emoteNumber) || 'Sin extras'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {hasExtras && (
                                                <span className="text-accent font-bold text-sm">
                                                    +{formatPrice(emoteTotal.clp, emoteTotal.usd)}
                                                </span>
                                            )}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Contenido desplegable */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-dashed border-text/20 pt-4 animate-fade-in">
                                            <p className="text-sm text-text/70 mb-4">
                                                Selecciona los extras que deseas agregar a este emote:
                                            </p>

                                            {(() => {
                                                const availableExtrasForEmote = getAvailableExtrasForEmote(emote.emoteNumber);
                                                if (availableExtrasForEmote.length === 0) {
                                                    return (
                                                        <div className="card-sketch p-4 text-text/70 bg-text/5">
                                                            No hay extras disponibles para este emote.
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="space-y-2">
                                                        {availableExtrasForEmote.map((extra) => {
                                                            const isSelected = emote.extras.includes(extra.id);
                                                            return (
                                                                <button
                                                                    key={extra.id}
                                                                    type="button"
                                                                    onClick={() => toggleExtraForEmote(emote.emoteNumber, extra.id)}
                                                                    className={`w-full text-left card-sketch p-3 transition-all ${
                                                                        isSelected
                                                                            ? 'ring-2 ring-accent bg-accent/5 scale-[1.01]'
                                                                            : 'hover:shadow-md'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-3 flex-1">
                                                                            <span className="text-2xl">{extra.icon}</span>
                                                                            <div className="flex-1">
                                                                                <h4 className="font-bold text-text text-sm mb-1">
                                                                                    {extra.title}
                                                                                </h4>
                                                                                <p className="text-xs text-text/70">
                                                                                    {extra.description}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-accent font-bold text-sm whitespace-nowrap">
                                                                                +{formatPrice(extra.priceCLP, extra.priceUSD)}
                                                                            </span>
                                                                            <div
                                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                                                    isSelected
                                                                                        ? 'bg-accent border-accent'
                                                                                        : 'border-text/30'
                                                                                }`}
                                                                            >
                                                                                {isSelected && (
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        className="h-3 w-3 text-white"
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
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer fijo: Total + Acciones */}
                <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-dashed border-text/20 p-6">
                    <div className="card-sketch bg-green/20 p-4 mb-4 border-2 border-green-dark">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-text font-bold text-lg">Total:</span>
                            <span className="text-green-dark font-bold text-2xl">
                                {formatPrice(totalCLP, totalUSD)}
                            </span>
                        </div>
                        <p className="text-sm text-text/70">
                            {(() => {
                                const totalExtras = emotesCustomization.reduce((sum, emote) => sum + emote.extras.length, 0);
                                return totalExtras > 0
                                    ? `${totalExtras} extra${totalExtras > 1 ? 's' : ''} en total`
                                    : 'Sin extras agregados';
                            })()}
                        </p>
                    </div>

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
                                handleConfirm();
                            }}
                            className="flex-1 py-3 px-6 bg-green text-white font-bold rounded-lg hover:bg-green-dark transition-colors btn-sketch"
                        >
                            Confirmar y Agregar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
