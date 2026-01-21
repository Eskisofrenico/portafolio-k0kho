'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function StarRating({ 
    rating, 
    onRatingChange 
}: { 
    rating: number; 
    onRatingChange: (rating: number) => void;
}) {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    className={`h-8 w-8 transition-transform hover:scale-110 ${
                        star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-full w-full"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function AddTestimonialForm() {
    const [formData, setFormData] = useState({
        client_name: '',
        rating: 5,
        comment: '',
        service_type: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            // Obtener el último order_index
            const { data: existingTestimonials } = await supabase
                .from('testimonials')
                .select('order_index')
                .order('order_index', { ascending: false })
                .limit(1);

            const nextOrderIndex = existingTestimonials && existingTestimonials.length > 0
                ? existingTestimonials[0].order_index + 1
                : 0;

            const { error } = await supabase
                .from('testimonials')
                .insert({
                    client_name: formData.client_name.trim(),
                    client_avatar: null,
                    rating: formData.rating,
                    comment: formData.comment.trim(),
                    service_type: formData.service_type || null,
                    is_visible: false, // Pendiente de aprobación
                    is_featured: false,
                    order_index: nextOrderIndex,
                });

            if (error) throw error;

            setSubmitStatus('success');
            // Limpiar formulario
            setFormData({
                client_name: '',
                rating: 5,
                comment: '',
                service_type: '',
            });

            // Ocultar mensaje de éxito después de 5 segundos
            setTimeout(() => {
                setSubmitStatus('idle');
            }, 5000);
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Error al enviar el testimonio. Por favor, intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="py-8 md:py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="font-patrick text-4xl md:text-5xl text-accent mb-4">
                        💬 Comparte tu experiencia
                    </h2>
                    <p className="text-text/70 text-lg font-nunito">
                        ¿Trabajaste conmigo? ¡Me encantaría conocer tu opinión!
                    </p>
                </div>

                <div className="card-sketch bg-white p-6 md:p-8">
                    {submitStatus === 'success' && (
                        <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                            <p className="text-green-800 font-nunito font-bold text-center">
                                ✅ ¡Gracias por tu testimonio! Será revisado y publicado pronto.
                            </p>
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                            <p className="text-red-800 font-nunito font-bold text-center">
                                ❌ {errorMessage}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-nunito font-bold text-text mb-2">
                                Tu Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.client_name}
                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-accent focus:outline-none card-sketch"
                                required
                                placeholder="Ej: María González"
                                disabled={submitting}
                            />
                        </div>

                        {/* Valoración */}
                        <div>
                            <label className="block text-sm font-nunito font-bold text-text mb-2">
                                Valoración *
                            </label>
                            <StarRating
                                rating={formData.rating}
                                onRatingChange={(rating) => setFormData({ ...formData, rating })}
                            />
                            <p className="text-xs text-text/60 mt-2">
                                {formData.rating === 5 && '⭐ Excelente'}
                                {formData.rating === 4 && '👍 Muy bueno'}
                                {formData.rating === 3 && '👍 Bueno'}
                                {formData.rating === 2 && '😐 Regular'}
                                {formData.rating === 1 && '😞 Malo'}
                            </p>
                        </div>

                        {/* Tipo de Servicio */}
                        <div>
                            <label className="block text-sm font-nunito font-bold text-text mb-2">
                                Tipo de Servicio (Opcional)
                            </label>
                            <select
                                value={formData.service_type}
                                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-accent focus:outline-none card-sketch"
                                disabled={submitting}
                            >
                                <option value="">Selecciona un servicio...</option>
                                <option value="icon">Icon / Headshot</option>
                                <option value="chibi">Chibi</option>
                                <option value="halfbody">Half Body</option>
                                <option value="fullbody">Full Body</option>
                            </select>
                        </div>

                        {/* Comentario */}
                        <div>
                            <label className="block text-sm font-nunito font-bold text-text mb-2">
                                Tu Comentario *
                            </label>
                            <textarea
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-accent focus:outline-none resize-none card-sketch"
                                required
                                placeholder="Cuéntame sobre tu experiencia trabajando conmigo..."
                                disabled={submitting}
                                minLength={10}
                            />
                            <p className="text-xs text-text/60 mt-1">
                                Mínimo 10 caracteres
                            </p>
                        </div>

                        {/* Botón de Envío */}
                        <button
                            type="submit"
                            disabled={submitting || submitStatus === 'success'}
                            className="w-full py-4 bg-accent text-white font-nunito font-bold rounded-lg hover:bg-accent/90 transition-colors btn-sketch disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {submitting ? '⏳ Enviando...' : submitStatus === 'success' ? '✅ Enviado' : '📤 Enviar Testimonio'}
                        </button>

                        <p className="text-xs text-text/60 text-center">
                            * Tu testimonio será revisado antes de ser publicado
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}
