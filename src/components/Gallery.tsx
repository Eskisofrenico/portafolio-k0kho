'use client';

import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { useServices } from '@/hooks/useServices';
import { useGallery } from '@/hooks/useGallery';
import { useExtras } from '@/hooks/useExtras';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CommissionModal from './CommissionModal';
import Toast from './Toast';
import type { SelectedCommission } from '@/types';
import type { Service as SupabaseService, Extra as SupabaseExtra, GalleryItem } from '@/lib/supabase';
import type { EmoteCustomization } from './EmoteCustomizationModal';

interface GalleryProps {
    onAddCommission: (commission: SelectedCommission) => void;
    selectedCommissions: SelectedCommission[];
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

interface Extra {
    id: string;
    title: string;
    priceCLP: number;
    priceUSD: number;
}

interface Work {
    id: string;
    image: string;
    title: string;
    type: string;
    description?: string;
}

export default function Gallery({ onAddCommission, selectedCommissions }: GalleryProps) {
    const { formatPrice } = useCurrency();
    const { services: supabaseServices, loading: servicesLoading } = useServices();
    const { gallery: supabaseGallery, loading: galleryLoading } = useGallery();
    const { extras: supabaseExtras, loading: extrasLoading } = useExtras();

    // Convertir servicios de Supabase al formato esperado
    const typedServices: Service[] = supabaseServices.map((s: SupabaseService) => ({
        id: s.id,
        title: s.title,
        image: s.image,
        priceCLP: s.price_clp_min,
        priceUSD: s.price_usd_min,
        priceMaxCLP: s.price_clp_max,
        priceMaxUSD: s.price_usd_max,
        category: s.category,
        description: s.description,
    }));

    // Convertir galería de Supabase al formato esperado
    const typedGallery: Work[] = supabaseGallery.map((g: GalleryItem) => ({
        id: g.id,
        image: g.image_url,
        title: g.title || 'Sin título',
        type: g.service_type || 'General',
        description: g.description,
    }));

    // Convertir extras de Supabase al formato esperado
    const typedExtras: Extra[] = supabaseExtras.map((e: SupabaseExtra) => ({
        id: e.id,
        title: e.title,
        priceCLP: e.price_clp,
        priceUSD: e.price_usd,
    }));
    const [selectedWork, setSelectedWork] = useState<Work | null>(null);
    const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Mostrar loading mientras se cargan los datos
    if (servicesLoading || galleryLoading || extrasLoading) {
        return (
            <section className="py-4 md:py-12 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                    <p className="mt-4 text-text/70">Cargando...</p>
                </div>
            </section>
        );
    }

    const openWorkModal = (work: Work) => {
        setSelectedWork(work);
        document.body.style.overflow = 'hidden';
    };

    const closeWorkModal = () => {
        setSelectedWork(null);
        document.body.style.overflow = 'unset';
    };

    const openCommissionModal = (service: Service) => {
        setSelectedServiceForModal(service);
        document.body.style.overflow = 'hidden';
    };

    const closeCommissionModal = () => {
        setSelectedServiceForModal(null);
        document.body.style.overflow = 'unset';
    };

    const handleConfirmCommission = (service: Service, selectedExtras: string[], detailLevel?: string, detailLevelPrice?: { clp: number; usd: number }, variantId?: string, variantPrice?: { clp: number; usd: number }, showNotification?: () => void, emotesCustomization?: EmoteCustomization[], themeId?: string, customTheme?: string) => {
        // Usar precio del nivel de detalle si está seleccionado, sino usar precio base
        let totalCLP = detailLevelPrice?.clp || service.priceCLP;
        let totalUSD = detailLevelPrice?.usd || service.priceUSD;

        // Agregar precio de la variante si está seleccionada
        if (variantPrice) {
            totalCLP += variantPrice.clp;
            totalUSD += variantPrice.usd;
        }

        // Para pack-emotes, calcular extras desde la personalización de cada emote
        if (emotesCustomization && emotesCustomization.length > 0) {
            emotesCustomization.forEach(emote => {
                emote.extras.forEach(extraId => {
                    const extra = typedExtras.find(e => e.id === extraId);
                    if (extra) {
                        totalCLP += extra.priceCLP;
                        totalUSD += extra.priceUSD;
                    }
                });
            });
        } else {
            // Para otros servicios, usar los extras seleccionados normalmente
            selectedExtras.forEach(extraId => {
                const extra = typedExtras.find(e => e.id === extraId);
                if (extra) {
                    totalCLP += extra.priceCLP;
                    totalUSD += extra.priceUSD;
                }
            });
        }

        onAddCommission({
            id: Date.now().toString(),
            serviceId: service.id,
            detailLevel: detailLevel,
            variantId: variantId,
            extras: selectedExtras,
            totalPriceCLP: totalCLP,
            totalPriceUSD: totalUSD,
            emotesCustomization: emotesCustomization,
            themeId: themeId,
            customTheme: customTheme,
        });

        // Mostrar notificación
        setShowToast(true);
        
        // Ejecutar callback para limpiar el modal (si existe)
        if (showNotification) {
            showNotification();
        }
    };

    return (
        <section className="py-4 md:py-12 px-4 animate-fade-in-delay-1">
            <div className="max-w-6xl mx-auto relative">
                {/* Personaje decorativo (solo escritorio) - Alineado con la card de Full Body sin cubrirla */}
                <div 
                    className="hidden lg:block pointer-events-none select-none absolute top-[-6.16rem] right-[-6rem] z-20 opacity-95 transform -translate-y-1/2"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)'
                    }}
                >
                    <Image
                        src="/personajes/personaje.png"
                        alt=""
                        width={420}
                        height={420}
                        priority={false}
                        className="object-contain"
                    />
                </div>

                {/* Título */}
                <div className="text-center mb-10 relative z-10">
                    <h2 className="text-4xl mb-2">✨ Mi Portafolio ✨</h2>
                    <p className="text-text/70 text-lg">¡Selecciona un tipo de comisión!</p>
                </div>

                {/* Servicios - Cards de precios */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-fade-in-delay-2 relative z-10">
                    {typedServices.map((service, index) => {
                        const isSelected = selectedCommissions.some(c => c.serviceId === service.id);
                        const selectedCount = selectedCommissions.filter(c => c.serviceId === service.id).length;
                        return (
                            <button
                                key={service.id}
                                onClick={() => openCommissionModal(service)}
                                style={{ animationDelay: `${index * 150}ms` }}
                                className={`card-sketch p-4 text-center transition-all cursor-pointer relative animate-pop-in ${
                                    isSelected
                                        ? 'ring-4 ring-accent scale-105 bg-accent/5'
                                        : 'hover:scale-102'
                                }`}
                            >
                                {/* Indicador Check Verde con contador */}
                                {isSelected && (
                                    <div className="absolute -top-3 -right-3 bg-[#A3CFA1] text-white w-9 h-9 rounded-full flex items-center justify-center animate-bounce shadow-lg z-20 border-2 border-white">
                                        {selectedCount > 1 ? (
                                            <span className="text-sm font-bold">{selectedCount}</span>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                )}

                                <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-lg">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="object-cover w-full h-full"
                                    />
                                {/* Overlay Seleccionado */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center animate-fade-in">
                                        <span className="bg-white/95 text-accent font-bold px-3 py-1 rounded-full shadow-lg text-sm transform -rotate-6 border-2 border-accent/20">
                                            {selectedCount > 1 ? `¡${selectedCount} seleccionadas!` : '¡Seleccionado!'}
                                        </span>
                                    </div>
                                )}
                                </div>
                                <h3 className="font-bold text-lg mb-1">{service.title}</h3>
                                <p className="text-accent font-bold">
                                    Desde {formatPrice(service.priceCLP, service.priceUSD)}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Masonry Grid - Trabajos Anteriores */}
                <div className="text-center mb-8">
                    <h3 className="text-2xl mb-4">📚 Trabajos Anteriores</h3>
                </div>

                <div className="masonry-grid animate-fade-in-delay-3">
                    {typedGallery.map((work) => (
                        <button
                            key={work.id}
                            className="masonry-item washi-tape block w-full text-left transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
                            onClick={() => openWorkModal(work)}
                        >
                            <div className="card-sketch overflow-hidden">
                                <div className="relative w-full aspect-square">
                                    <Image
                                        src={work.image}
                                        alt={work.title}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-3 text-center">
                                    <p className="font-bold text-text">{work.title}</p>
                                    <span className="text-sm text-accent">{work.type}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal de Comisión */}
            {mounted && selectedServiceForModal && (
                <CommissionModal
                    service={selectedServiceForModal}
                    isOpen={!!selectedServiceForModal}
                    onClose={closeCommissionModal}
                    onConfirm={(extras, detailLevel, detailLevelPrice, variantId, variantPrice, showNotification, emotesCustomization, themeId, customTheme) => {
                        handleConfirmCommission(selectedServiceForModal, extras, detailLevel, detailLevelPrice, variantId, variantPrice, showNotification, emotesCustomization, themeId, customTheme);
                    }}
                />
            )}

            {/* Toast de Notificación */}
            <Toast
                message="¡Agregado!"
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />

            {/* Modal de Trabajo */}
            {mounted && selectedWork && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={closeWorkModal}
                >
                    <div
                        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto card-sketch p-0 relative animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeWorkModal}
                            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-text rounded-full p-2 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <div className="grid md:grid-cols-2 gap-0">
                            <div className="relative w-full min-h-[300px] md:min-h-[500px] bg-gray-100">
                                <Image
                                    src={selectedWork.image}
                                    alt={selectedWork.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-contain"
                                />
                            </div>
                            <div className="p-8 flex flex-col justify-center">
                                <span className="text-accent font-bold mb-2 uppercase tracking-wider text-sm">{selectedWork.type}</span>
                                <h3 className="text-3xl font-bold mb-4 text-text">{selectedWork.title}</h3>
                                <p className="text-text/80 leading-relaxed text-lg mb-6">
                                    {selectedWork.description || "Sin descripción disponible."}
                                </p>
                                
                                {/* Testimonios Relacionados */}
                                <WorkTestimonials workId={selectedWork.id} />
                                
                                <div className="mt-auto pt-6 border-t border-dashed border-gray-300">
                                    <button
                                        onClick={closeWorkModal}
                                        className="w-full py-3 bg-accent text-text font-bold rounded-lg hover:bg-accent/90 transition-colors shadow-md"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
}

function WorkTestimonials({ workId }: { workId: string }) {
    const { testimonials, loading } = useTestimonials(false, undefined, workId);

    if (loading || testimonials.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            <h4 className="font-bold text-text mb-3 flex items-center gap-2">
                <span>⭐</span>
                Comentarios de clientes
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
                {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="card-sketch bg-washi/30 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm text-text">
                                {testimonial.client_name}
                            </span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-3 w-3 ${
                                            star <= testimonial.rating
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                        }`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-text/80 italic">
                            "{testimonial.comment}"
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
