'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { useServices } from '@/hooks/useServices';
import { useExtras } from '@/hooks/useExtras';
import { useDetailLevels } from '@/hooks/useDetailLevels';
import { useVariants } from '@/hooks/useVariants';
import { useCommissionThemes } from '@/hooks/useCommissionThemes';
import type { SelectedCommission } from '@/types';

interface WhatsAppButtonProps {
    isEnabled: boolean;
    selectedCommissions: SelectedCommission[];
}

export default function WhatsAppButton({ isEnabled, selectedCommissions }: WhatsAppButtonProps) {
    const { formatPrice } = useCurrency();
    const { services } = useServices();
    const { extras } = useExtras();
    const { themes } = useCommissionThemes();
    const { detailLevels } = useDetailLevels(); // Obtener todos los niveles
    const { variants } = useVariants(); // Obtener todas las variantes

    // Número de WhatsApp
    const phoneNumber = '56976420228';

    // Calcular precio total de todas las comisiones
    const calculateTotal = () => {
        const totalCLP = selectedCommissions.reduce((sum, c) => sum + c.totalPriceCLP, 0);
        const totalUSD = selectedCommissions.reduce((sum, c) => sum + c.totalPriceUSD, 0);
        return { totalCLP, totalUSD };
    };

    const { totalCLP, totalUSD } = calculateTotal();

    const generateWhatsAppLink = () => {
        if (selectedCommissions.length === 0) return '#';

        let message = [
            "Hola k0kho!",
            `Vengo de tu web. Me interesa ${selectedCommissions.length > 1 ? 'las siguientes comisiones' : 'una comision'}:`,
            ""
        ];

        // Listar cada comisión
        selectedCommissions.forEach((commission, index) => {
            const service = services.find(s => s.id === commission.serviceId);
            if (service) {
                message.push(`${index + 1}. ${service.title}`);
                
                // Calcular precio base
                let basePriceCLP = 0;
                let basePriceUSD = 0;
                let basePriceLabel = '';
                
                // Nivel de detalle (tiene precio)
                if (commission.detailLevel) {
                    const level = detailLevels.find(l => l.service_id === commission.serviceId && l.level_name === commission.detailLevel);
                    if (level) {
                        basePriceCLP = level.price_clp;
                        basePriceUSD = level.price_usd;
                        basePriceLabel = level.level_label;
                        message.push(`   ${basePriceLabel}: ${formatPrice(basePriceCLP, basePriceUSD)}`);
                    } else {
                        // Fallback: usar precio base del servicio
                        basePriceCLP = service.price_clp_min || 0;
                        basePriceUSD = service.price_usd_min || 0;
                        basePriceLabel = service.title;
                        message.push(`   ${basePriceLabel}: ${formatPrice(basePriceCLP, basePriceUSD)}`);
                    }
                } else {
                    // Sin nivel de detalle, usar precio base del servicio
                    basePriceCLP = service.price_clp_min || 0;
                    basePriceUSD = service.price_usd_min || 0;
                    basePriceLabel = service.title;
                    message.push(`   ${basePriceLabel}: ${formatPrice(basePriceCLP, basePriceUSD)}`);
                }
                
                // Variante (tiene precio adicional)
                if (commission.variantId) {
                    const variant = variants.find(v => v.service_id === commission.serviceId && v.id === commission.variantId);
                    if (variant) {
                        message.push(`   Variante ${variant.variant_label}: ${formatPrice(variant.price_clp, variant.price_usd)}`);
                    }
                }
                
                // Tema (sin precio, solo informativo)
                if (commission.themeId) {
                    const theme = themes.find(t => t.id === commission.themeId);
                    if (theme) {
                        message.push(`   Tema: ${theme.name}`);
                    }
                } else if (commission.customTheme) {
                    message.push(`   Tema personalizado: ${commission.customTheme}`);
                }
                
                // Extras generales (cada uno con su precio)
                if (commission.extras.length > 0) {
                    commission.extras.forEach((extraId: string) => {
                        const extra = extras.find(e => e.id === extraId);
                        if (extra) {
                            message.push(`   Extra ${extra.title}: ${formatPrice(extra.price_clp, extra.price_usd)}`);
                        }
                    });
                }
                
                // Personalización de emotes (para pack-emotes)
                if (commission.emotesCustomization && commission.emotesCustomization.length > 0) {
                    message.push("   Personalizacion de emotes:");
                    commission.emotesCustomization.forEach((emote) => {
                        message.push(`   Emote ${emote.emoteNumber}:`);
                        if (emote.extras.length > 0) {
                            emote.extras.forEach((extraId: string) => {
                                const extra = extras.find(e => e.id === extraId);
                                if (extra) {
                                    message.push(`     Extra ${extra.title}: ${formatPrice(extra.price_clp, extra.price_usd)}`);
                                }
                            });
                        } else {
                            message.push(`     Sin extras`);
                        }
                    });
                }
                
                message.push("");
            }
        });

        message.push(
            `Total: ${formatPrice(totalCLP, totalUSD)}`,
            "",
            "Confirmo que lei tus reglas (No pido NSFW/Robots/Gore/Realismo).",
            "Pago via: BancoEstado / PayPal."
        );

        const encodedMessage = encodeURIComponent(message.join('\n'));
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    };


    return (
        <section className="py-12 px-4">
            <div className="max-w-xl mx-auto text-center flex flex-col items-center">
                {selectedCommissions.length === 0 && (
                    <p className="text-text/60 mb-4">
                        👆 Selecciona un servicio arriba y agrégalo al carrito
                    </p>
                )}

                {/* Botón de WhatsApp */}
                <a
                    href={isEnabled && selectedCommissions.length > 0 ? generateWhatsAppLink() : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`whatsapp-btn inline-flex items-center gap-3 px-8 py-4 text-xl transition-all duration-300 ${
                        !isEnabled || selectedCommissions.length === 0
                            ? 'pointer-events-none opacity-50 grayscale'
                            : 'hover:scale-110 hover:shadow-xl animate-bounce-slow'
                    }`}
                    onClick={(e) => {
                        if (!isEnabled || selectedCommissions.length === 0) {
                            e.preventDefault();
                        }
                    }}
                >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {!isEnabled
                        ? 'Acepta las reglas primero ☝️'
                        : selectedCommissions.length === 0
                            ? 'Selecciona un servicio ☝️'
                            : `¡Contactar por WhatsApp! (${selectedCommissions.length})`}
                </a>

                {/* Mensajes de error específicos con animación */}
                <div className="h-6 mt-4">
                    {!isEnabled && (
                        <p className="text-red-500 text-sm animate-bounce font-medium">
                            ⚠️ Debes aceptar las reglas antes de contactar
                        </p>
                    )}
                    {isEnabled && selectedCommissions.length === 0 && (
                        <p className="text-accent text-sm animate-pulse font-medium">
                            ✨ ¡Casi listo! Elige qué tipo de dibujo quieres arriba
                        </p>
                    )}
                    {isEnabled && selectedCommissions.length > 0 && (
                        <p className="text-green-dark text-sm font-medium">
                            ✅ Revisa tu carrito antes de contactar
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
