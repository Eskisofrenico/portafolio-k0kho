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
  const [editGroup, setEditGroup] = useState<GalleryItem[] | null>(null);

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

  const groupId = (item: GalleryItem) => item.group_id ?? item.id;
  const groups = gallery.reduce<Map<string, GalleryItem[]>>((acc, item) => {
    const gid = groupId(item);
    if (!acc.has(gid)) acc.set(gid, []);
    acc.get(gid)!.push(item);
    return acc;
  }, new Map());
  const sortedGroups = Array.from(groups.entries()).sort(
    ([, a], [, b]) => (a[0]?.order_index ?? 0) - (b[0]?.order_index ?? 0)
  );

  async function handleToggleVisibility(group: GalleryItem[]) {
    const visible = !group[0]?.is_visible;
    const ids = group.map((i) => i.id);
    const { error } = await supabase
      .from('gallery')
      .update({ is_visible: visible })
      .in('id', ids);
    if (!error) fetchGallery();
  }

  async function handleDeleteGroup(group: GalleryItem[]) {
    if (!confirm(`¿Eliminar esta entrada (${group.length} imagen${group.length > 1 ? 'es' : ''})?`)) return;
    for (const item of group) {
      if (item.image_url.includes('supabase')) {
        const fileName = item.image_url.split('/').pop();
        if (fileName) await supabase.storage.from('gallery-images').remove([fileName]);
      }
    }
    const { error } = await supabase.from('gallery').delete().in('id', group.map((i) => i.id));
    if (!error) fetchGallery();
  }

  async function handleDeleteSingleImage(item: GalleryItem) {
    // Delete from storage if hosted on supabase
    if (item.image_url.includes('supabase')) {
      const fileName = item.image_url.split('/').pop();
      if (fileName) await supabase.storage.from('gallery-images').remove([fileName]);
    }
    // Delete from database
    await supabase.from('gallery').delete().eq('id', item.id);
  }

  async function handleUpdate(
    group: GalleryItem[],
    updates: { title?: string; description?: string; service_type?: string },
    newFiles?: File[]
  ) {
    const root = group[0];
    if (!root) return;
    const ids = group.map((i) => i.id);
    const { error: updateErr } = await supabase
      .from('gallery')
      .update({
        title: updates.title ?? root.title,
        description: updates.description ?? root.description,
        service_type: updates.service_type ?? root.service_type,
      })
      .in('id', ids);
    if (updateErr) {
      console.error('Error updating:', updateErr);
      alert('Error al guardar los cambios');
      return;
    }
    const maxOrder = Math.max(...group.map((i) => i.order_index), -1);
    let nextOrder = maxOrder + 1;
    if (newFiles?.length) {
      try {
        for (const file of newFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('gallery-images')
            .upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('gallery-images').getPublicUrl(fileName);
          const { error: insertError } = await supabase.from('gallery').insert({
            image_url: publicUrl,
            title: updates.title ?? root.title,
            description: updates.description ?? root.description,
            service_type: updates.service_type ?? root.service_type,
            order_index: nextOrder++,
            group_id: groupId(root),
          });
          if (insertError) throw insertError;
        }
      } catch (e) {
        console.error('Error adding images:', e);
        alert('Error al agregar imágenes');
      }
    }
    setEditGroup(null);
    fetchGallery();
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const files = formData.getAll('images') as File[];
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const serviceType = (formData.get('service_type') as string) || '';

    const validFiles = files.filter((f) => f && f.size > 0);
    if (validFiles.length === 0) {
      alert('Selecciona al menos una imagen');
      setUploading(false);
      return;
    }

    try {
      let nextOrder = gallery.length;
      const sharedTitle = title || validFiles[0].name.replace(/\.[^/.]+$/, '');
      let firstId: string | null = null;

      for (let idx = 0; idx < validFiles.length; idx++) {
        const file = validFiles[idx];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName);

        const row: Record<string, unknown> = {
          image_url: publicUrl,
          title: sharedTitle,
          description: description || null,
          service_type: serviceType || null,
          order_index: nextOrder++,
        };
        if (idx === 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('gallery')
            .insert({ ...row, group_id: undefined })
            .select('id')
            .single();
          if (insertError) throw insertError;
          firstId = inserted?.id ?? null;
          await supabase
            .from('gallery')
            .update({ group_id: firstId })
            .eq('id', firstId);
        } else if (firstId) {
          const { error: insertError } = await supabase
            .from('gallery')
            .insert({ ...row, group_id: firstId });
          if (insertError) throw insertError;
        }
      }

      setShowUploadForm(false);
      fetchGallery();
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir las imágenes');
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
          ➕ Subir Imágenes (una o varias)
        </button>
      </div>

      {/* Grid de entradas (cada entrada puede tener varias imágenes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedGroups.map(([gid, group]) => {
          const first = group[0];
          if (!first) return null;
          return (
            <div
              key={gid}
              className={`rounded-lg border-2 shadow-lg overflow-hidden transition-all ${first.is_visible
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400'
                : 'bg-gray-50 border-gray-300 opacity-60'
                }`}
            >
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {group.length === 1 ? (
                  <Image
                    src={group[0].image_url}
                    alt={group[0].title || 'Gallery image'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-1">
                      {group.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative min-h-0">
                          <Image
                            src={item.image_url}
                            alt={item.title || 'Gallery image'}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                    {group.length > 4 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-nunito font-bold px-2 py-1 rounded">
                        +{group.length - 4} más
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-patrick text-lg text-[var(--sketch-border)] line-clamp-1">
                      {first.title || 'Sin título'}
                    </h3>
                    {first.service_type && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-nunito font-semibold mt-1">
                        {first.service_type}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(group)}
                    className={`px-2 py-1 rounded text-xs font-bold ${first.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {first.is_visible ? '👁️' : '🙈'}
                  </button>
                </div>

                {first.description && (
                  <p className="text-sm text-gray-600 font-nunito mb-3 line-clamp-2">
                    {first.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditGroup(group)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedGroups.length === 0 && (
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

      {/* Modal de Edición */}
      {editGroup && (
        <EditModal
          group={editGroup}
          onSave={(updates, newFiles) => handleUpdate(editGroup, updates, newFiles)}
          onCancel={() => setEditGroup(null)}
          onDeleteImage={handleDeleteSingleImage}
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
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      setPreviews([]);
      return;
    }
    const results: string[] = new Array(files.length).fill('');
    let done = 0;
    Array.from(files).forEach((file, i) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        results[i] = reader.result as string;
        done++;
        if (done === files.length) setPreviews(results);
      };
      reader.readAsDataURL(file);
    });
  };

  useModal(true);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl relative"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
                Subir Imágenes 🖼️
              </h2>
              <p className="text-sm text-gray-600 font-nunito mt-1">
                Puedes seleccionar varias a la vez. Título, descripción y tipo se aplican a todas.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="ml-4 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imágenes *
            </label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              required
              onChange={handleFileChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            />
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={src}
                      alt={`Preview ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Título (opcional, para todas)
            </label>
            <input
              type="text"
              name="title"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              placeholder="Nombre del trabajo"
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Descripción (opcional, para todas)
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none resize-none"
              placeholder="Describe el trabajo..."
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Tipo de Servicio (opcional, para todas)
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
              {uploading ? '⏳ Subiendo...' : '📤 Subir Imágenes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({
  group,
  onSave,
  onCancel,
  onDeleteImage,
}: {
  group: GalleryItem[];
  onSave: (updates: { title?: string; description?: string; service_type?: string }, newFiles?: File[]) => Promise<void>;
  onCancel: () => void;
  onDeleteImage: (item: GalleryItem) => Promise<void>;
}) {
  const item = group[0];
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [serviceType, setServiceType] = useState(item?.service_type || '');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localGroup, setLocalGroup] = useState(group);

  useModal(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      return;
    }
    const fileArray = Array.from(files);
    setNewFiles((prev) => [...prev, ...fileArray]);

    const newPreviews: string[] = [];
    let done = 0;
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        done++;
        if (done === fileArray.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset the input
    e.target.value = '';
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (img: GalleryItem) => {
    if (localGroup.length <= 1 && newFiles.length === 0) {
      alert('No puedes eliminar la última imagen. Si deseas eliminar toda la entrada, usa el botón "Eliminar" de la tarjeta.');
      return;
    }
    if (!confirm('¿Eliminar esta imagen?')) return;
    setDeletingId(img.id);
    await onDeleteImage(img);
    setLocalGroup((prev) => prev.filter((i) => i.id !== img.id));
    setDeletingId(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (localGroup.length === 0 && newFiles.length === 0) {
      alert('Debes tener al menos una imagen en la entrada.');
      return;
    }
    setSaving(true);
    await onSave(
      { title: title || undefined, description: description || undefined, service_type: serviceType || undefined },
      newFiles.length > 0 ? newFiles : undefined
    );
    setSaving(false);
  }

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl relative"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
                Editar entrada ✏️
              </h2>
              <p className="text-sm text-gray-600 font-nunito mt-1">
                Gestiona las imágenes de esta entrada
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="ml-4 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Existing images */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imágenes actuales ({localGroup.length})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {localGroup.map((img, i) => (
                <div key={img.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <Image
                    src={img.image_url}
                    alt={img.title || `Image ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(img)}
                    disabled={deletingId === img.id}
                    className="absolute top-1 right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50"
                    title="Eliminar imagen"
                  >
                    {deletingId === img.id ? '⏳' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new images */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Agregar nuevas imágenes
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            />
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                    <Image
                      src={src}
                      alt={`Nueva imagen ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                      Nueva
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(i)}
                      className="absolute top-1 right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Quitar de la lista"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              placeholder="Nombre del trabajo"
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none resize-none"
              placeholder="Describe el trabajo..."
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Tipo de Servicio
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            >
              <option value="">Sin categoría</option>
              <option value="icon">Icon / Headshot</option>
              <option value="chibi">Chibi</option>
              <option value="halfbody">Half Body</option>
              <option value="fullbody">Full Body</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-nunito font-bold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
