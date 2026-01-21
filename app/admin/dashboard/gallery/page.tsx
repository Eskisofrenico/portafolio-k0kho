'use client';

import { useEffect, useState } from 'react';
import { supabase, type GalleryItem } from '@/lib/supabase';
import { useModal } from '@/hooks/useModal';
import Image from 'next/image';

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setGallery(data);
    }
    setLoading(false);
  }

  async function handleToggleVisibility(item: GalleryItem) {
    const { error } = await supabase
      .from('gallery')
      .update({ is_visible: !item.is_visible })
      .eq('id', item.id);

    if (!error) {
      fetchGallery();
    }
  }

  async function handleDelete(item: GalleryItem) {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;

    // Si la imagen está en Supabase Storage, eliminarla
    if (item.image_url.includes('supabase')) {
      const fileName = item.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('gallery-images').remove([fileName]);
      }
    }

    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', item.id);

    if (!error) {
      fetchGallery();
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('image') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const serviceType = formData.get('service_type') as string;

    try {
      // Subir imagen a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(fileName);

      // Insertar en base de datos
      const { error: insertError } = await supabase
        .from('gallery')
        .insert({
          image_url: publicUrl,
          title,
          description,
          service_type: serviceType,
          order_index: gallery.length,
        });

      if (insertError) throw insertError;

      setShowUploadForm(false);
      fetchGallery();
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando galería...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pl-16 md:pl-16">
          <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
            Gestión de Galería 🖼️
          </h1>
          <p className="text-gray-600 font-nunito text-sm md:text-base">
            Sube y administra los trabajos de tu portafolio
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all shadow-lg text-sm md:text-base w-full md:w-auto"
        >
          ➕ Subir Nueva Imagen
        </button>
      </div>

      {/* Grid de Imágenes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {gallery.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border-2 shadow-lg overflow-hidden transition-all ${
              item.is_visible
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400'
                : 'bg-gray-50 border-gray-300 opacity-60'
            }`}
          >
            <div className="relative h-48 bg-gray-100">
              <Image
                src={item.image_url}
                alt={item.title || 'Gallery image'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-patrick text-lg text-[var(--sketch-border)] line-clamp-1">
                    {item.title || 'Sin título'}
                  </h3>
                  {item.service_type && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-nunito font-semibold mt-1">
                      {item.service_type}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleToggleVisibility(item)}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    item.is_visible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.is_visible ? '👁️' : '🙈'}
                </button>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 font-nunito mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <button
                onClick={() => handleDelete(item)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 font-nunito text-lg">
            No hay imágenes en la galería. ¡Sube tu primera imagen!
          </p>
        </div>
      )}

      {/* Modal de Subida */}
      {showUploadForm && (
        <UploadModal
          onSubmit={handleUpload}
          onCancel={() => setShowUploadForm(false)}
          uploading={uploading}
        />
      )}
    </div>
  );
}

function UploadModal({
  onSubmit,
  onCancel,
  uploading,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  uploading: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useModal(true);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
            Subir Nueva Imagen 🖼️
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Upload de Imagen */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imagen *
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            />
            {preview && (
              <div className="mt-4 relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              name="title"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              placeholder="Nombre del trabajo"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none resize-none"
              placeholder="Describe el trabajo..."
            />
          </div>

          {/* Tipo de Servicio */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Tipo de Servicio
            </label>
            <select
              name="service_type"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            >
              <option value="">Sin categoría</option>
              <option value="icon">Icon / Headshot</option>
              <option value="chibi">Chibi</option>
              <option value="halfbody">Half Body</option>
              <option value="fullbody">Full Body</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-nunito font-bold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {uploading ? '⏳ Subiendo...' : '📤 Subir Imagen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
