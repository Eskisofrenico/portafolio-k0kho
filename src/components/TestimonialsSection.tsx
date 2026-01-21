'use client';

import { useTestimonials } from '@/hooks/useTestimonials';
import type { Testimonial } from '@/lib/supabase';
import Image from 'next/image';

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${
                        star <= rating
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
    );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <div className="card-sketch bg-washi/40 p-6 hover:shadow-lg transition-all flex-shrink-0 w-[350px] md:w-[400px]">
            <div className="flex items-start gap-4 mb-4">
                {/* Avatar del Cliente */}
                <div className="flex-shrink-0">
                    {testimonial.client_avatar ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                            <Image
                                src={testimonial.client_avatar}
                                alt={testimonial.client_name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent">
                            <span className="text-2xl font-bold text-accent">
                                {testimonial.client_name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className="font-bold text-text text-lg">
                                {testimonial.client_name}
                            </h4>
                            {testimonial.service_type && (
                                <p className="text-sm text-text/60 capitalize">
                                    {testimonial.service_type}
                                </p>
                            )}
                        </div>
                        {testimonial.is_featured && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                                ⭐ Destacado
                            </span>
                        )}
                    </div>
                    <StarRating rating={testimonial.rating} />
                </div>
            </div>

            <p className="text-text/80 leading-relaxed italic">
                "{testimonial.comment}"
            </p>
        </div>
    );
}

export default function TestimonialsSection() {
    const { testimonials, loading } = useTestimonials(true); // Solo destacados

    // Duplicar testimonios múltiples veces para crear efecto infinito suave
    // Duplicamos 3 veces para asegurar que siempre haya contenido visible
    const duplicatedTestimonials = testimonials.length > 0 
        ? [...testimonials, ...testimonials, ...testimonials]
        : [];

    if (loading) {
        return (
            <section className="py-8 md:py-16 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                    <p className="mt-4 text-text/70">Cargando testimonios...</p>
                </div>
            </section>
        );
    }

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-16 px-4 overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-patrick text-4xl md:text-5xl text-accent mb-4">
                        ✨ Lo que dicen nuestros clientes ✨
                    </h2>
                    <p className="text-text/70 text-lg font-nunito">
                        Testimonios reales de clientes satisfechos
                    </p>
                </div>

                {/* Carrusel Infinito */}
                <div className="relative mb-12 overflow-hidden">
                    <div
                        className="flex gap-6 scrollbar-hide animate-scroll-infinite"
                        style={{
                            animationDuration: testimonials.length > 0 
                                ? `${testimonials.length * 15}s`
                                : '40s',
                        }}
                    >
                        {duplicatedTestimonials.map((testimonial, index) => (
                            <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
                        ))}
                    </div>
                    
                    {/* Gradientes laterales para efecto fade */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-paper via-paper/50 to-transparent pointer-events-none z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-paper via-paper/50 to-transparent pointer-events-none z-10"></div>
                </div>

                {/* Promedio de Valoraciones */}
                {testimonials.length > 0 && (
                    <div className="mt-12 text-center">
                        <div className="inline-block card-sketch bg-accent/10 p-6">
                            <p className="text-text/70 font-nunito mb-2">
                                Valoración promedio
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-4xl font-bold text-accent">
                                    {(
                                        testimonials.reduce(
                                            (sum, t) => sum + t.rating,
                                            0
                                        ) / testimonials.length
                                    ).toFixed(1)}
                                </div>
                                <StarRating
                                    rating={Math.round(
                                        testimonials.reduce(
                                            (sum, t) => sum + t.rating,
                                            0
                                        ) / testimonials.length
                                    )}
                                />
                                <span className="text-text/60 text-sm">
                                    ({testimonials.length} {testimonials.length === 1 ? 'reseña' : 'reseñas'})
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </section>
    );
}
