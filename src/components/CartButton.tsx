'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '@/context/CurrencyContext';
import services from '@/data/services.json';
import extras from '@/data/extras.json';
import rules from '@/data/rules.json';
import type { SelectedCommission } from '@/types';

interface Extra {
    id: string;
    title: string;
    icon: string;
    priceCLP: number;
    priceUSD: number;
}

interface Service {
    id: string;
    title: string;
    priceCLP: number;
    priceUSD: number;
}

interface RuleItem {
    text: string;
    icon: string;
}

interface CartButtonProps {
    selectedCommissions: SelectedCommission[];
    onRemoveCommission: (id: string) => void;
    onClearCart: () => void;
}

export default function CartButton({ selectedCommissions, onRemoveCommission, onClearCart }: CartButtonProps) {
    const { formatPrice } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [commissionToDelete, setCommissionToDelete] = useState<{ id: string; title: string } | null>(null);
    const [cartActive, setCartActive] = useState(false);
    const [rulesActive, setRulesActive] = useState(false);
    const [deleteActive, setDeleteActive] = useState(false);

    const MODAL_MS = 180;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Animación de entrada/salida (para que sea fluido y no "lag")
    useEffect(() => {
        if (isOpen) {
            const t = window.setTimeout(() => setCartActive(true), 0);
            return () => window.clearTimeout(t);
        }
        setCartActive(false);
    }, [isOpen]);

    useEffect(() => {
        if (isRulesOpen) {
            const t = window.setTimeout(() => setRulesActive(true), 0);
            return () => window.clearTimeout(t);
        }
        setRulesActive(false);
    }, [isRulesOpen]);

    useEffect(() => {
        if (commissionToDelete) {
            const t = window.setTimeout(() => setDeleteActive(true), 0);
            return () => window.clearTimeout(t);
        }
        setDeleteActive(false);
    }, [commissionToDelete]);

    useEffect(() => {
        const anyModalOpen = isOpen || isRulesOpen || !!commissionToDelete;
        document.body.style.overflow = anyModalOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isRulesOpen, commissionToDelete]);

    const calculateTotal = () => {
        const totalCLP = selectedCommissions.reduce((sum, c) => sum + c.totalPriceCLP, 0);
        const totalUSD = selectedCommissions.reduce((sum, c) => sum + c.totalPriceUSD, 0);
        return { totalCLP, totalUSD };
    };

    const { totalCLP, totalUSD } = calculateTotal();

    const phoneNumber = '56976420228';

    const buildWhatsAppLink = () => {
        if (selectedCommissions.length === 0) return '#';

        const typedExtras = extras as Extra[];
        const typedServices = services as Service[];

        const lines: string[] = [
            'Hola k0kho!',
            `Vengo de tu web. Me interesa ${selectedCommissions.length > 1 ? 'las siguientes comisiones' : 'una comision'}:`,
            '',
            '--- COMISIONES ---',
            ''
        ];

        selectedCommissions.forEach((commission, index) => {
            const service = typedServices.find(s => s.id === commission.serviceId);
            if (!service) return;

            lines.push(`[${index + 1}] ${service.title}`);
            lines.push('');

            if (commission.extras.length > 0) {
                const selectedExtrasList = commission.extras
                    .map(extraId => typedExtras.find(e => e.id === extraId))
                    .filter(Boolean) as Extra[];

                if (selectedExtrasList.length > 0) {
                    lines.push('Extras:');
                    selectedExtrasList.forEach(extra => {
                        lines.push(`  - ${extra.title}`);
                    });
                    lines.push('');
                }
            }

            lines.push(`Precio: ${formatPrice(commission.totalPriceCLP, commission.totalPriceUSD)}`);
            lines.push('');
            lines.push('---');
            lines.push('');
        });

        lines.push(
            'TOTAL GENERAL:',
            formatPrice(totalCLP, totalUSD),
            '',
            '---',
            '',
            'Confirmo que lei tus reglas (No pido NSFW/Robots/Gore/Realismo).',
            '',
            'Metodo de pago: BancoEstado / PayPal.'
        );

        const encodedMessage = encodeURIComponent(lines.join('\n'));
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    };

    const handleNext = () => {
        if (selectedCommissions.length === 0) return;
        // Cerrar carrito con transición, luego abrir reglas
        setCartActive(false);
        window.setTimeout(() => {
            setIsOpen(false);
            setIsRulesOpen(true);
        }, MODAL_MS);
    };

    const handleRejectRules = () => {
        // Cerrar reglas con transición, luego volver al carrito
        setRulesActive(false);
        window.setTimeout(() => {
            setIsRulesOpen(false);
            setIsOpen(true);
        }, MODAL_MS);
    };

    const handleAcceptRules = () => {
        const link = buildWhatsAppLink();
        
        if (link !== '#') {
            // Abrir WhatsApp primero
            window.open(link, '_blank', 'noopener,noreferrer');
            
            // Vaciar el carrito después de abrir WhatsApp
            onClearCart();
        }
        
        // Cerrar modal después
        setIsRulesOpen(false);
    };

    const handleDeleteClick = (commission: SelectedCommission) => {
        const service = (services as Service[]).find(s => s.id === commission.serviceId);
        const title = service?.title || 'comisión';
        
        if (selectedCommissions.length === 1) {
            setCommissionToDelete({ id: commission.id, title });
        } else {
            onRemoveCommission(commission.id);
        }
    };

    const handleConfirmDelete = () => {
        if (commissionToDelete) {
            onRemoveCommission(commissionToDelete.id);
            setCommissionToDelete(null);
        }
    };

    if (!mounted) return null;

    return (
        <>
            {/* Botón Flotante del Carrito */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9998] p-4 rounded-full bg-accent text-white hover:bg-accent/90 transition-all shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95"
                aria-label="Ver carrito"
                style={{
                    boxShadow: '0 8px 24px rgba(230, 154, 154, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
                {selectedCommissions.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red text-white text-sm font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center border-3 border-white shadow-lg px-1.5 animate-bounce">
                        {selectedCommissions.length > 99 ? '99+' : selectedCommissions.length}
                    </span>
                )}
            </button>

            {/* Modal del Carrito */}
            {isOpen && createPortal(
                <div
                    className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity duration-[180ms] ease-out ${cartActive ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => {
                        setCartActive(false);
                        window.setTimeout(() => setIsOpen(false), MODAL_MS);
                    }}
                >
                    <div
                        className={`bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto card-sketch p-6 relative transition-transform transition-opacity duration-[180ms] ease-out will-change-transform ${cartActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.98] translate-y-2'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-full">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-accent"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-text">Carrito</h2>
                                    <p className="text-sm text-text/60">
                                        {selectedCommissions.length} comisión{selectedCommissions.length !== 1 ? 'es' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setCartActive(false);
                                    window.setTimeout(() => setIsOpen(false), MODAL_MS);
                                }}
                                className="text-text hover:text-accent transition-colors p-2 hover:bg-accent/10 rounded-full"
                                aria-label="Cerrar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Lista de Comisiones */}
                        {selectedCommissions.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-16 w-16 text-text/30 mx-auto mb-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <p className="text-text/60 text-lg">Tu carrito está vacío</p>
                                <p className="text-text/40 text-sm mt-2">
                                    Selecciona un servicio para agregarlo al carrito
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-6">
                                {selectedCommissions.map((commission) => {
                                    const service = (services as Service[]).find(s => s.id === commission.serviceId);
                                    if (!service) return null;
                                    return (
                                        <div
                                            key={commission.id}
                                            className="card-sketch p-4 text-left relative bg-washi/30"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                onPointerDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteClick(commission);
                                                }}
                                                onClick={(e) => {
                                                    // fallback por si algún navegador no dispara pointer events
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteClick(commission);
                                                }}
                                                className="absolute top-3 right-3 z-20 cursor-pointer pointer-events-auto text-red hover:text-red-dark transition-colors p-2 bg-white/95 hover:bg-white rounded-full shadow-md hover:shadow-lg"
                                                aria-label="Eliminar comisión"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                            <p className="text-lg font-bold text-accent mb-1 pr-8">
                                                {service.title}
                                            </p>
                                            {commission.extras.length > 0 && (
                                                <div className="text-sm text-text/70 mb-2">
                                                    <p className="mb-1 font-medium">Extras:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(extras as Extra[]).filter(e => commission.extras.includes(e.id)).map((extra: Extra) => (
                                                            <span key={extra.id} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                                                                {extra.icon} {extra.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-sm font-bold text-text/80">
                                                Precio: {formatPrice(commission.totalPriceCLP, commission.totalPriceUSD)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Total */}
                        {selectedCommissions.length > 0 && (
                            <div className="card-sketch bg-green/20 p-4 mb-6 border-2 border-green-dark sticky bottom-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-text font-bold text-lg">Total General:</span>
                                    <span className="text-green-dark font-bold text-2xl">
                                        {formatPrice(totalCLP, totalUSD)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setCartActive(false);
                                    window.setTimeout(() => setIsOpen(false), MODAL_MS);
                                }}
                                className="flex-1 py-3 px-6 bg-text/10 text-text font-bold rounded-lg hover:bg-text/20 transition-colors card-sketch"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                disabled={selectedCommissions.length === 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleNext();
                                }}
                                className={`flex-1 py-3 px-6 font-bold rounded-lg transition-colors btn-sketch ${
                                    selectedCommissions.length === 0
                                        ? 'bg-gray-300 text-white cursor-not-allowed'
                                        : 'bg-accent text-white hover:bg-accent/90'
                                }`}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal de Reglas / Instrucciones */}
            {isRulesOpen && createPortal(
                <div
                    className={`fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity duration-[180ms] ease-out ${rulesActive ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => {
                        setRulesActive(false);
                        window.setTimeout(() => setIsRulesOpen(false), MODAL_MS);
                    }}
                >
                    <div
                        className={`bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto card-sketch p-6 relative transition-transform transition-opacity duration-[180ms] ease-out will-change-transform ${rulesActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.98] translate-y-2'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-text mb-2">📋 Reglas Importantes</h2>
                                <p className="text-text/70">Lee esto antes de contactarme, ¡es súper importante!</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setRulesActive(false);
                                    window.setTimeout(() => setIsRulesOpen(false), MODAL_MS);
                                }}
                                className="text-text hover:text-accent transition-colors p-2 hover:bg-accent/10 rounded-full"
                                aria-label="Cerrar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="rules-allowed rounded-2xl p-6">
                                <h3 className="text-2xl text-center mb-4 text-green-dark">✅ Sí Dibujo</h3>
                                <ul className="space-y-3">
                                    {(rules.allowed as RuleItem[]).map((rule, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-3 bg-white/60 rounded-xl p-3"
                                        >
                                            <span className="text-2xl">{rule.icon}</span>
                                            <span className="font-medium text-text">{rule.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rules-forbidden rounded-2xl p-6">
                                <h3 className="text-2xl text-center mb-4 text-red-dark">❌ No Dibujo</h3>
                                <ul className="space-y-3">
                                    {(rules.forbidden as RuleItem[]).map((rule, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-3 bg-white/60 rounded-xl p-3"
                                        >
                                            <span className="text-2xl">{rule.icon}</span>
                                            <span className="font-medium text-text">{rule.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="card-sketch p-5 bg-washi/30 mb-6 text-center">
                            <p className="text-lg text-text">
                                ¿Aceptas estas reglas? Si aceptas, te llevo directo a WhatsApp con tu pedido.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRejectRules();
                                }}
                                className="flex-1 py-3 px-6 bg-text/10 text-text font-bold rounded-lg hover:bg-text/20 transition-colors card-sketch"
                            >
                                Rechazar
                            </button>
                            <button
                                type="button"
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAcceptRules();
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAcceptRules();
                                }}
                                className="flex-1 py-3 px-6 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-colors btn-sketch cursor-pointer"
                            >
                                Aceptar y abrir WhatsApp
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal de Confirmación de Eliminación */}
            {commissionToDelete && createPortal(
                <div
                    className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity duration-[180ms] ease-out ${deleteActive ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => {
                        setDeleteActive(false);
                        window.setTimeout(() => setCommissionToDelete(null), MODAL_MS);
                    }}
                >
                    <div
                        className={`bg-white rounded-2xl max-w-md w-full card-sketch p-6 relative transition-transform transition-opacity duration-[180ms] ease-out will-change-transform ${deleteActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.98] translate-y-2'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-red/20 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-text mb-2">¿Estás seguro?</h3>
                            <p className="text-text/70">
                                Estás a punto de eliminar tu última comisión:
                            </p>
                            <p className="text-accent font-bold text-lg mt-2">
                                {commissionToDelete.title}
                            </p>
                            <p className="text-text/60 text-sm mt-3">
                                Si la eliminas, tendrás que seleccionar nuevamente una comisión para contactar.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteActive(false);
                                    window.setTimeout(() => setCommissionToDelete(null), MODAL_MS);
                                }}
                                className="flex-1 py-3 px-6 bg-text/10 text-text font-bold rounded-lg hover:bg-text/20 transition-colors card-sketch"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmDelete();
                                    setCommissionToDelete(null);
                                }}
                                className="flex-1 py-3 px-6 bg-red text-white font-bold rounded-lg hover:bg-red-dark transition-colors btn-sketch"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
