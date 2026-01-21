'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { useExtras } from '@/hooks/useExtras';
import { useDetailLevels } from '@/hooks/useDetailLevels';
import { useVariants } from '@/hooks/useVariants';
import { useCommissionThemes } from '@/hooks/useCommissionThemes';
import { useModal } from '@/hooks/useModal';
import EmoteCustomizationModal, { type EmoteCustomization } from './EmoteCustomizationModal';
import AlertModal from './AlertModal';
import type { Extra as SupabaseExtra, DetailLevel, ServiceVariant, CommissionTheme } from '@/lib/supabase';

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
    onConfirm: (selectedExtras: string[], detailLevel?: string, detailLevelPrice?: { clp: number; usd: number }, variantId?: string, variantPrice?: { clp: number; usd: number }, showNotification?: () => void, emotesCustomization?: EmoteCustomization[], themeId?: string, customTheme?: string) => void;
}

export default function CommissionModal({ service, isOpen, onClose, onConfirm }: CommissionModalProps) {
    const { currency, formatPrice } = useCurrency();
    const { extras: supabaseExtras, loading: extrasLoading } = useExtras();
    const { detailLevels, loading: levelsLoading } = useDetailLevels(service.id);
    const { variants, loading: variantsLoading } = useVariants(service.id);
    const { themes, loading: themesLoading } = useCommissionThemes();
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [selectedDetailLevel, setSelectedDetailLevel] = useState<string>('');
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [selectedThemeId, setSelectedThemeId] = useState<string>('');
    const [customTheme, setCustomTheme] = useState<string>('');
    const [showCustomThemeInput, setShowCustomThemeInput] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showEmoteCustomization, setShowEmoteCustomization] = useState(false);
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; title?: string }>({
        isOpen: false,
        message: '',
    });

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

    useEffect(() => {
        setMounted(true);
    }, []);

    useModal(isOpen);

    useEffect(() => {
        if (!isOpen) {
            setSelectedExtras([]);
            setSelectedThemeId('');
            setCustomTheme('');
            setShowCustomThemeInput(false);
        }
    }, [isOpen]);

    if (!isOpen || !mounted || extrasLoading || levelsLoading || variantsLoading || themesLoading) return null;

    // Obtener nivel de detalle seleccionado
    const selectedLevel = detailLevels.find(level => level.level_name === selectedDetailLevel);
    
    // Obtener variante seleccionada
    const selectedVariant = variants.find(v => v.id === selectedVariantId);
    
    // Precio base: usar el del nivel seleccionado o el precio base del servicio
    let basePriceCLP = selectedLevel ? selectedLevel.price_clp : service.priceCLP;
    let basePriceUSD = selectedLevel ? selectedLevel.price_usd : service.priceUSD;
    
    // Agregar precio de la variante si está seleccionada
    if (selectedVariant) {
        basePriceCLP += selectedVariant.price_clp;
        basePriceUSD += selectedVariant.price_usd;
    }

    // Filtrar extras disponibles para este tipo de servicio
    const availableExtras = typedExtras.filter(extra => {
        if (!extra.onlyFor || extra.onlyFor.length === 0) return true;
        return extra.onlyFor.includes(service.id);
    });

    // Calcular precio total
    const calculateTotal = () => {
        let totalCLP = basePriceCLP;
        let totalUSD = basePriceUSD;

        // Para pack-emotes, no incluir extras aquí (se calcularán en el modal de personalización)
        if (service.id !== 'pack-emotes') {
            selectedExtras.forEach(extraId => {
                const extra = availableExtras.find(e => e.id === extraId);
                if (extra) {
                    totalCLP += extra.priceCLP;
                    totalUSD += extra.priceUSD;
                }
            });
        }

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
        // Si es pack-emotes, requiere nivel de detalle y variante
        if (service.id === 'pack-emotes') {
            if (!selectedDetailLevel) {
                setAlertModal({
                    isOpen: true,
                    message: 'Por favor, selecciona un nivel de detalle antes de continuar.',
                    title: 'Nivel de Detalle Requerido',
                });
                return;
            }
            if (!selectedVariantId) {
                setAlertModal({
                    isOpen: true,
                    message: 'Por favor, selecciona una variante (cantidad de emotes) antes de continuar.',
                    title: 'Variante Requerida',
                });
                return;
            }
            setShowEmoteCustomization(true);
            return;
        }

        // Para otros servicios, continuar con el flujo normal
        const detailLevelPrice = selectedLevel ? {
            clp: selectedLevel.price_clp,
            usd: selectedLevel.price_usd
        } : undefined;

        const variantPrice = selectedVariant ? {
            clp: selectedVariant.price_clp,
            usd: selectedVariant.price_usd
        } : undefined;

        onConfirm(
            selectedExtras,
            selectedDetailLevel || undefined,
            detailLevelPrice,
            selectedVariantId || undefined,
            variantPrice,
            () => {
                // Callback para mostrar notificación
            },
            undefined, // emotesCustomization
            selectedThemeId || undefined,
            showCustomThemeInput && customTheme.trim() ? customTheme.trim() : undefined
        );
        onClose(); // Cerrar el modal después de agregar
    };

    const handleEmoteCustomizationConfirm = (emotesCustomization: EmoteCustomization[]) => {
        // Determinar cantidad de emotes según la variante
        let numberOfEmotes = 5; // Por defecto
        if (selectedVariant) {
            if (selectedVariant.variant_name === 'pack-5') numberOfEmotes = 5;
            else if (selectedVariant.variant_name === 'pack-7') numberOfEmotes = 7;
            else if (selectedVariant.variant_name === 'pack-10') numberOfEmotes = 10;
        }

        const detailLevelPrice = selectedLevel ? {
            clp: selectedLevel.price_clp,
            usd: selectedLevel.price_usd
        } : undefined;

        const variantPrice = selectedVariant ? {
            clp: selectedVariant.price_clp,
            usd: selectedVariant.price_usd
        } : undefined;

        // Calcular extras totales de todos los emotes
        const allExtras: string[] = [];
        emotesCustomization.forEach(emote => {
            emote.extras.forEach(extraId => {
                if (!allExtras.includes(extraId)) {
                    allExtras.push(extraId);
                }
            });
        });

        onConfirm(
            allExtras,
            selectedDetailLevel || undefined,
            detailLevelPrice,
            selectedVariantId || undefined,
            variantPrice,
            () => {
                // Callback para mostrar notificación
            },
            emotesCustomization,
            selectedThemeId || undefined,
            showCustomThemeInput && customTheme.trim() ? customTheme.trim() : undefined
        );
        setShowEmoteCustomization(false);
        onClose();
    };

    // Determinar cantidad de emotes según la variante (para el modal de personalización)
    const selectedVariantForEmotes = variants.find(v => v.id === selectedVariantId);
    let numberOfEmotes = 5;
    if (selectedVariantForEmotes) {
        if (selectedVariantForEmotes.variant_name === 'pack-5') numberOfEmotes = 5;
        else if (selectedVariantForEmotes.variant_name === 'pack-7') numberOfEmotes = 7;
        else if (selectedVariantForEmotes.variant_name === 'pack-10') numberOfEmotes = 10;
    }

    return (
        <>
            {createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={onClose}
                >
            <div
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col card-sketch relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-dashed border-text/20 p-6">
                    <div className="flex items-start justify-between gap-4">
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
                </div>

                {/* Cuerpo con scroll */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    {/* Niveles de Detalle */}
                    {detailLevels.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-text mb-4">
                                Nivel de Detalle
                            </h3>
                            
                            {/* Comparación Visual Lado a Lado */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                {detailLevels.map((level) => {
                                    const isSelected = selectedDetailLevel === level.level_name;
                                    return (
                                        <button
                                            key={level.id}
                                            type="button"
                                            onClick={() => {
                                                // Si está seleccionado, desmarcarlo; si no, marcarlo
                                                setSelectedDetailLevel(isSelected ? '' : level.level_name);
                                            }}
                                            className={`text-left card-sketch p-4 transition-all ${
                                                isSelected
                                                    ? 'ring-2 ring-accent bg-accent/10 scale-[1.02]'
                                                    : 'hover:scale-[1.01] hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-text mb-1">
                                                        {level.level_label}
                                                    </h4>
                                                    <span className="text-accent font-bold text-sm">
                                                        {formatPrice(level.price_clp, level.price_usd)}
                                                    </span>
                                                </div>
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
                                            
                                            {/* Qué Incluye */}
                                            {level.includes && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-text/60 mb-1">
                                                        Incluye:
                                                    </p>
                                                    <p className="text-xs text-text/80 leading-relaxed">
                                                        {level.includes}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Recomendaciones */}
                                            {(() => {
                                                // Asegurar que recommendations sea un array válido
                                                const recommendations = Array.isArray(level.recommendations) 
                                                    ? level.recommendations 
                                                    : level.recommendations 
                                                        ? [level.recommendations] 
                                                        : [];
                                                
                                                if (recommendations.length > 0) {
                                                    return (
                                                        <div>
                                                            <p className="text-xs font-semibold text-text/60 mb-1">
                                                                Recomendado para:
                                                            </p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {recommendations.map((rec, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                                                    >
                                                                        {rec}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Variantes */}
                    {variants.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-text mb-4">
                                Variante (Opcional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {variants.map((variant) => {
                                    const isSelected = selectedVariantId === variant.id;
                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={() => setSelectedVariantId(isSelected ? '' : variant.id)}
                                            className={`text-left card-sketch p-4 transition-all ${
                                                isSelected
                                                    ? 'ring-2 ring-purple-500 bg-purple-50 scale-[1.02]'
                                                    : 'hover:scale-[1.01] hover:shadow-md'
                                            }`}
                                        >
                                            {/* Preview de la Variante */}
                                            <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
                                                <Image
                                                    src={variant.preview_image}
                                                    alt={variant.variant_label}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                        <div className="bg-purple-500 text-white rounded-full p-2">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-6 w-6"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-text mb-1">
                                                        {variant.variant_label}
                                                    </h4>
                                                    {variant.description && (
                                                        <p className="text-xs text-text/70 mb-2">
                                                            {variant.description}
                                                        </p>
                                                    )}
                                                    {variant.price_clp > 0 && (
                                                        <span className="text-purple-600 font-bold text-sm">
                                                            +{formatPrice(variant.price_clp, variant.price_usd)}
                                                        </span>
                                                    )}
                                                    {variant.price_clp === 0 && (
                                                        <span className="text-green-600 font-bold text-sm">
                                                            Sin costo adicional
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Precio Base (si no hay niveles) */}
                    {detailLevels.length === 0 && (
                        <div className="card-sketch bg-washi/30 p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-text font-medium">Precio Base:</span>
                                <span className="text-accent font-bold text-lg">
                                    {formatPrice(service.priceCLP, service.priceUSD)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Selección de Tema/Festivo */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-text mb-4">
                            Tema o Festivo (Opcional)
                        </h3>
                        <p className="text-sm text-text/60 mb-4">
                            Selecciona un tema festivo o escribe uno personalizado
                        </p>

                        {/* Temas Predefinidos */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            {themes.map((theme) => {
                                const isSelected = selectedThemeId === theme.id && !showCustomThemeInput;
                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                // Si ya está seleccionado, deseleccionar
                                                setSelectedThemeId('');
                                            } else {
                                                // Si no está seleccionado, seleccionar
                                                setSelectedThemeId(theme.id);
                                                setShowCustomThemeInput(false);
                                                setCustomTheme('');
                                            }
                                        }}
                                        className={`text-left card-sketch p-3 transition-all ${
                                            isSelected
                                                ? 'ring-2 ring-accent bg-accent/10 scale-[1.02]'
                                                : 'hover:scale-[1.01] hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl">{theme.icon}</span>
                                            <h4 className="font-bold text-text text-sm">
                                                {theme.name}
                                            </h4>
                                        </div>
                                        {theme.description && (
                                            <p className="text-xs text-text/60">
                                                {theme.description}
                                            </p>
                                        )}
                                        {isSelected && (
                                            <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <span>Seleccionado</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Opción de Tema Personalizado */}
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomThemeInput(!showCustomThemeInput);
                                    if (!showCustomThemeInput) {
                                        setSelectedThemeId('');
                                        setCustomTheme('');
                                    }
                                }}
                                className={`w-full text-left card-sketch p-3 transition-all ${
                                    showCustomThemeInput
                                        ? 'ring-2 ring-purple-500 bg-purple-50'
                                        : 'hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">✨</span>
                                    <span className="font-bold text-text">
                                        {showCustomThemeInput ? 'Tema Personalizado (Activo)' : 'Escribir Tema Personalizado'}
                                    </span>
                                </div>
                            </button>

                            {showCustomThemeInput && (
                                <div className="mt-3 card-sketch bg-purple-50/50 p-4 border-2 border-purple-200">
                                    <label className="block text-sm font-bold text-text mb-2">
                                        Describe tu tema personalizado:
                                    </label>
                                    <input
                                        type="text"
                                        value={customTheme}
                                        onChange={(e) => setCustomTheme(e.target.value)}
                                        placeholder="Ej: Tema de cumpleaños con globos azules y dorados"
                                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none card-sketch"
                                        maxLength={100}
                                    />
                                    <p className="text-xs text-text/60 mt-1">
                                        {customTheme.length}/100 caracteres
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista de Extras - Oculto para pack-emotes (se ven en el modal de personalización) */}
                    {service.id !== 'pack-emotes' && (
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-text mb-4">
                                Agregar Extras (Opcional)
                            </h3>

                            {availableExtras.length === 0 ? (
                                <div className="card-sketch p-4 text-text/70 bg-text/5">
                                    No hay extras disponibles para este servicio.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {availableExtras.map((extra) => {
                                        const isSelected = selectedExtras.includes(extra.id);
                                        return (
                                            <button
                                                key={extra.id}
                                                onClick={() => toggleExtra(extra.id)}
                                                className={`w-full text-left card-sketch p-4 transition-all ${
                                                    isSelected
                                                        ? 'ring-2 ring-accent bg-accent/5 scale-[1.01]'
                                                        : 'hover:shadow-md'
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
                                                        <span className="text-accent font-bold whitespace-nowrap">
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
                            )}
                        </div>
                    )}
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
                            {service.id === 'pack-emotes' 
                                ? 'Los extras se personalizarán en el siguiente paso'
                                : selectedExtras.length > 0
                                ? `Incluye ${selectedExtras.length} extra${selectedExtras.length > 1 ? 's' : ''}`
                                : 'Sin extras agregados'}
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
                                handleAddAndContinue();
                            }}
                            className="flex-1 py-3 px-6 bg-green text-white font-bold rounded-lg hover:bg-green-dark transition-colors btn-sketch"
                        >
                            Agregar y Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
            )}
            {mounted && showEmoteCustomization && (
                <EmoteCustomizationModal
                    isOpen={showEmoteCustomization}
                    onClose={() => setShowEmoteCustomization(false)}
                    onConfirm={handleEmoteCustomizationConfirm}
                    numberOfEmotes={numberOfEmotes}
                    basePriceCLP={totalCLP}
                    basePriceUSD={totalUSD}
                    serviceId={service.id}
                />
            )}
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: '' })}
                message={alertModal.message}
                title={alertModal.title}
                type="warning"
            />
        </>
    );
}
