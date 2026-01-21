'use client';

import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import services from '@/data/services.json';
import gallery from '@/data/gallery.json';
import extras from '@/data/extras.json';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CommissionModal from './CommissionModal';
import Toast from './Toast';
import type { SelectedCommission } from '@/types';

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
    const typedServices = services as Service[];
    const typedGallery = gallery as Work[];
    const typedExtras = extras as Extra[];
    const [selectedWork, setSelectedWork] = useState<Work | null>(null);
    const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const handleConfirmCommission = (service: Service, selectedExtras: string[], showNotification?: () => void) => {
        let totalCLP = service.priceCLP;
        let totalUSD = service.priceUSD;

        selectedExtras.forEach(extraId => {
            const extra = typedExtras.find(e => e.id === extraId);
            if (extra) {
                totalCLP += extra.priceCLP;
                totalUSD += extra.priceUSD;
            }
        });

        onAddCommission({
            id: Date.now().toString(),
            serviceId: service.id,
            extras: selectedExtras,
            totalPriceCLP: totalCLP,
            totalPriceUSD: totalUSD,
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
                    onConfirm={(extras, showNotification) => handleConfirmCommission(selectedServiceForModal, extras, showNotification)}
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
