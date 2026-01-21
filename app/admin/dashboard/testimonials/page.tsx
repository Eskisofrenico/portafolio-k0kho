'use client';

import { useEffect, useState } from 'react';
import { supabase, type Testimonial, type GalleryItem } from '@/lib/supabase';
import { useModal } from '@/hooks/useModal';
import Image from 'next/image';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    fetchTestimonials();
    fetchGalleryItems();
  }, []);

  async function fetchTestimonials() {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setTestimonials(data);
    }
    setLoading(false);
  }

  async function fetchGalleryItems() {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_visible', true)
      .order('order_index');

    if (!error && data) {
      setGalleryItems(data);
    }
  }

  async function handleToggleVisibility(testimonial: Testimonial) {
    const { error } = await supabase
      .from('testimonials')
      .update({ is_visible: !testimonial.is_visible })
      .eq('id', testimonial.id);

    if (!error) {
      fetchTestimonials();
    }
  }

  async function handleToggleFeatured(testimonial: Testimonial) {
    const { error } = await supabase
      .from('testimonials')
      .update({ is_featured: !testimonial.is_featured })
      .eq('id', testimonial.id);

    if (!error) {
      fetchTestimonials();
    }
  }

  function handleEdit(testimonial: Testimonial) {
    setEditingTestimonial(testimonial);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingTestimonial({
      id: '',
      client_name: '',
      client_avatar: null,
      rating: 5,
      comment: '',
      gallery_item_id: null,
      service_type: null,
      is_featured: false,
      is_visible: true,
      order_index: testimonials.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  async function handleDelete(testimonial: Testimonial) {
    if (!confirm(`¿Eliminar el testimonio de "${testimonial.client_name}"?`)) return;

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonial.id);

    if (!error) {
      fetchTestimonials();
    }
  }

  async function handleSave(formData: Partial<Testimonial>) {
    if (!editingTestimonial) return;

    if (isCreating) {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          client_name: formData.client_name!,
          client_avatar: null,
          rating: formData.rating!,
          comment: formData.comment!,
          gallery_item_id: formData.gallery_item_id || null,
          service_type: formData.service_type || null,
          is_featured: formData.is_featured !== undefined ? formData.is_featured : false,
          is_visible: formData.is_visible !== undefined ? formData.is_visible : true,
          order_index: formData.order_index || testimonials.length,
        });

      if (error) {
        console.error('Error creating testimonial:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('testimonials')
        .update(formData)
        .eq('id', editingTestimonial.id);

      if (error) {
        console.error('Error updating testimonial:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingTestimonial(null);
    setIsCreating(false);
    fetchTestimonials();
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando testimonios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pl-16 md:pl-16">
          <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
            Gestión de Testimonios ⭐
          </h1>
          <p className="text-gray-600 font-nunito text-sm md:text-base">
            Administra los comentarios y valoraciones de clientes
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all shadow-lg text-sm md:text-base w-full md:w-auto"
        >
          ➕ Agregar Testimonio
        </button>
      </div>

      {/* Lista de Testimonios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className={`rounded-lg border-2 shadow-lg p-6 transition-all ${
              testimonial.is_visible
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:border-yellow-400'
                : 'bg-gray-50 border-gray-300 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
                    {testimonial.client_name}
                  </h3>
                  {testimonial.is_featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${
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
                  <span className="text-sm text-gray-600">({testimonial.rating}/5)</span>
                </div>
                {testimonial.service_type && (
                  <p className="text-sm text-gray-500 capitalize mb-2">
                    Servicio: {testimonial.service_type}
                  </p>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-4 italic font-nunito">
              "{testimonial.comment}"
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleToggleVisibility(testimonial)}
                className={`flex-1 py-2 px-4 rounded-lg font-nunito font-bold text-sm transition-all ${
                  testimonial.is_visible
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {testimonial.is_visible ? '👁️ Visible' : '🚫 Oculto'}
              </button>
              <button
                onClick={() => handleToggleFeatured(testimonial)}
                className={`flex-1 py-2 px-4 rounded-lg font-nunito font-bold text-sm transition-all ${
                  testimonial.is_featured
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {testimonial.is_featured ? '⭐ Destacado' : '⭐ Marcar Destacado'}
              </button>
            </div>

            <button
              onClick={() => handleEdit(testimonial)}
              className="w-full bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              ✏️ Editar Testimonio
            </button>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 font-nunito text-lg mb-2">
            No hay testimonios registrados
          </p>
          <p className="text-gray-400 text-sm">
            Agrega testimonios de clientes para mostrar en la página principal
          </p>
        </div>
      )}

      {/* Modal de Edición/Creación */}
      {showForm && editingTestimonial && (
        <TestimonialEditModal
          testimonial={editingTestimonial}
          isCreating={isCreating}
          galleryItems={galleryItems}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTestimonial(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

function TestimonialEditModal({
  testimonial,
  isCreating,
  galleryItems,
  onSave,
  onCancel,
}: {
  testimonial: Testimonial;
  isCreating: boolean;
  galleryItems: GalleryItem[];
  onSave: (data: Partial<Testimonial>) => void;
  onCancel: () => void;
}) {
  useModal(true);
  const [formData, setFormData] = useState({
    client_name: testimonial.client_name,
    rating: testimonial.rating,
    comment: testimonial.comment,
    gallery_item_id: testimonial.gallery_item_id || '',
    service_type: testimonial.service_type || '',
    is_featured: testimonial.is_featured,
    is_visible: testimonial.is_visible,
    order_index: testimonial.order_index,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      client_avatar: null,
      gallery_item_id: formData.gallery_item_id || null,
      service_type: formData.service_type || null,
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
            {isCreating ? 'Crear Nuevo Testimonio' : `Editar: ${testimonial.client_name}`}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre del Cliente */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              placeholder="Ej: María González"
            />
          </div>

          {/* Valoración */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Valoración (Estrellas) *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`h-10 w-10 ${
                    star <= formData.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  } hover:scale-110 transition-transform`}
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
              <span className="text-sm text-gray-600 ml-2">
                ({formData.rating}/5)
              </span>
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Comentario *
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none resize-none"
              required
              placeholder="Comentario del cliente..."
            />
          </div>

          {/* Trabajo Relacionado */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Trabajo Relacionado (Opcional)
            </label>
            <select
              value={formData.gallery_item_id}
              onChange={(e) => setFormData({ ...formData, gallery_item_id: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            >
              <option value="">Ninguno</option>
              {galleryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || item.service_type || 'Sin título'}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Servicio */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Tipo de Servicio (Opcional)
            </label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            >
              <option value="">Ninguno</option>
              <option value="icon">Icon / Headshot</option>
              <option value="chibi">Chibi</option>
              <option value="halfbody">Half Body</option>
              <option value="fullbody">Full Body</option>
            </select>
          </div>

          {/* Opciones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="font-nunito font-bold text-gray-700">Destacado</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="font-nunito font-bold text-gray-700">Visible</span>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-nunito font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg"
            >
              {isCreating ? '➕ Crear Testimonio' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
