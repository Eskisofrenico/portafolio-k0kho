'use client';

import { useEffect, useState } from 'react';
import { supabase, type EmoteConfig, type EmoteExtraAvailability, type Extra } from '@/lib/supabase';
import { useModal } from '@/hooks/useModal';

export default function EmotesConfigPage() {
  const [emoteConfigs, setEmoteConfigs] = useState<EmoteConfig[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [emoteExtraAvailability, setEmoteExtraAvailability] = useState<EmoteExtraAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'availability'>('config');
  const [editingConfig, setEditingConfig] = useState<EmoteConfig | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Obtener configuraciones de emotes para pack-emotes
      const { data: configs } = await supabase
        .from('emote_config')
        .select('*')
        .eq('service_id', 'pack-emotes')
        .order('emote_number');

      // Obtener extras disponibles para pack-emotes
      const { data: extrasData } = await supabase
        .from('extras')
        .select('*')
        .contains('only_for', ['pack-emotes'])
        .order('order_index');

      // Obtener disponibilidad de extras por emote
      const { data: availability } = await supabase
        .from('emote_extra_availability')
        .select('*')
        .order('emote_number');

      if (configs) setEmoteConfigs(configs);
      if (extrasData) setExtras(extrasData);
      if (availability) setEmoteExtraAvailability(availability);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig(formData: Partial<EmoteConfig>, imageFile?: File) {
    if (!editingConfig) return;

    try {
      let previewImageUrl = formData.preview_image;

      // If there's a new image file, upload it to Supabase storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `emote-${formData.emote_number}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('gallery-images').getPublicUrl(fileName);
        previewImageUrl = publicUrl;
      }

      if (editingConfig.id) {
        // Actualizar
        const { error } = await supabase
          .from('emote_config')
          .update({ ...formData, preview_image: previewImageUrl })
          .eq('id', editingConfig.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('emote_config')
          .insert({
            service_id: 'pack-emotes',
            emote_number: formData.emote_number!,
            custom_label: formData.custom_label || null,
            description: formData.description || null,
            preview_image: previewImageUrl || null,
            is_active: formData.is_active !== undefined ? formData.is_active : true,
            order_index: formData.order_index || 0,
          });

        if (error) throw error;
      }

      setShowConfigForm(false);
      setEditingConfig(null);
      fetchData();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    }
  }

  async function toggleExtraAvailability(extraId: string, emoteNumber: number, e?: React.MouseEvent) {
    // Prevenir propagación del evento
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const existing = emoteExtraAvailability.find(
      e => e.extra_id === extraId && e.emote_number === emoteNumber
    );

    // Determinar el nuevo estado: si no existe registro, está disponible por defecto (true)
    // entonces al hacer click queremos desactivarlo (false)
    // Si existe, toggleamos el valor actual
    const currentState = existing ? existing.is_available : true;
    const newState = !currentState;

    // Actualización optimista del estado para feedback visual inmediato
    if (existing) {
      setEmoteExtraAvailability(prev =>
        prev.map(item =>
          item.id === existing.id
            ? { ...item, is_available: newState }
            : item
        )
      );
    } else {
      // Crear un registro temporal en el estado
      const tempId = `temp-${Date.now()}`;
      setEmoteExtraAvailability(prev => [
        ...prev,
        {
          id: tempId,
          extra_id: extraId,
          emote_number: emoteNumber,
          is_available: newState,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    }

    try {
      if (existing) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('emote_extra_availability')
          .update({ is_available: newState })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Crear nuevo registro con el estado opuesto al default
        const { data, error } = await supabase
          .from('emote_extra_availability')
          .insert({
            extra_id: extraId,
            emote_number: emoteNumber,
            is_available: newState,
          })
          .select()
          .single();

        if (error) throw error;

        // Reemplazar el registro temporal con el real
        if (data) {
          setEmoteExtraAvailability(prev =>
            prev.map(item =>
              item.id?.startsWith('temp-') && item.extra_id === extraId && item.emote_number === emoteNumber
                ? data
                : item
            )
          );
        }
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Error al actualizar la disponibilidad');
      // Revertir cambios en caso de error
      fetchData();
    }
  }

  function isExtraAvailableForEmote(extraId: string, emoteNumber: number): boolean {
    const availability = emoteExtraAvailability.find(
      e => e.extra_id === extraId && e.emote_number === emoteNumber
    );
    // Si no hay registro, el extra está disponible para todos los emotes por defecto
    return availability ? availability.is_available : true;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando configuración de emotes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 pl-16 md:pl-16">
        <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
          Configuración de Emotes 😊
        </h1>
        <p className="text-gray-600 font-nunito text-sm md:text-base">
          Personaliza la configuración de los emotes del pack
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 font-nunito font-bold transition-colors ${activeTab === 'config'
            ? 'border-b-2 border-[var(--sketch-border)] text-[var(--sketch-border)]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Configuración de Emotes
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`px-6 py-3 font-nunito font-bold transition-colors ${activeTab === 'availability'
            ? 'border-b-2 border-[var(--sketch-border)] text-[var(--sketch-border)]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Disponibilidad de Extras
        </button>
      </div>

      {/* Tab: Configuración de Emotes */}
      {activeTab === 'config' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="font-patrick text-2xl text-[var(--sketch-border)]">
              Etiquetas y Descripciones
            </h2>
            <button
              onClick={() => {
                setEditingConfig({
                  id: '',
                  service_id: 'pack-emotes',
                  emote_number: emoteConfigs.length + 1,
                  custom_label: null,
                  description: null,
                  preview_image: null,
                  is_active: true,
                  order_index: emoteConfigs.length,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                setShowConfigForm(true);
              }}
              className="bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              + Agregar Configuración
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emoteConfigs.map((config) => (
              <div
                key={config.id}
                className="bg-white border-2 border-[var(--sketch-border)] rounded-lg p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#E69A9A] text-white flex items-center justify-center font-bold">
                    {config.emote_number}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-nunito font-semibold ${config.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {config.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2 font-nunito">
                  {config.custom_label || `Emote #${config.emote_number}`}
                </h3>
                {config.description && (
                  <p className="text-sm text-gray-600 mb-3 font-nunito">
                    {config.description}
                  </p>
                )}

                <button
                  onClick={() => {
                    setEditingConfig(config);
                    setShowConfigForm(true);
                  }}
                  className="w-full bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm shadow-md"
                >
                  ✏️ Editar
                </button>
              </div>
            ))}
          </div>

          {emoteConfigs.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-nunito text-lg mb-2">
                No hay configuraciones de emotes
              </p>
              <p className="text-gray-400 text-sm">
                Agrega configuraciones para personalizar las etiquetas de cada emote
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Disponibilidad de Extras */}
      {activeTab === 'availability' && (
        <div>
          <div className="mb-4">
            <h2 className="font-patrick text-2xl text-[var(--sketch-border)] mb-2">
              Disponibilidad de Extras por Emote
            </h2>
            <p className="text-gray-600 font-nunito text-sm">
              Configura qué extras están disponibles para cada emote. Si un extra no tiene configuración,
              estará disponible para todos los emotes por defecto.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white border-2 border-[var(--sketch-border)] rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-2 border-gray-300 p-3 text-left font-nunito font-bold">
                    Extra
                  </th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <th
                      key={num}
                      className="border-2 border-gray-300 p-2 text-center font-nunito font-semibold text-sm"
                    >
                      Emote {num}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extras.map((extra) => (
                  <tr key={extra.id}>
                    <td className="border-2 border-gray-300 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{extra.icon}</span>
                        <div>
                          <p className="font-nunito font-bold text-sm">{extra.title}</p>
                          <p className="text-xs text-gray-500 font-nunito">
                            {formatPrice(extra.price_clp, extra.price_usd)}
                          </p>
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((emoteNum) => {
                      const isAvailable = isExtraAvailableForEmote(extra.id, emoteNum);
                      return (
                        <td
                          key={emoteNum}
                          className="border-2 border-gray-300 p-2 text-center"
                        >
                          <button
                            type="button"
                            onClick={(e) => toggleExtraAvailability(extra.id, emoteNum, e)}
                            className={`w-8 h-8 rounded transition-all cursor-pointer ${isAvailable
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                            title={isAvailable ? 'Click para desactivar' : 'Click para activar'}
                          >
                            {isAvailable ? '✓' : '✗'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {extras.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-nunito text-lg mb-2">
                No hay extras configurados para pack-emotes
              </p>
              <p className="text-gray-400 text-sm">
                Ve a la sección de Extras y asegúrate de que algunos tengan "pack-emotes" en "Disponible para"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edición de Configuración */}
      {showConfigForm && editingConfig && (
        <ConfigEditModal
          config={editingConfig}
          onSave={handleSaveConfig}
          onCancel={() => {
            setShowConfigForm(false);
            setEditingConfig(null);
          }}
        />
      )}
    </div>
  );
}

function ConfigEditModal({
  config,
  onSave,
  onCancel,
}: {
  config: EmoteConfig;
  onSave: (data: Partial<EmoteConfig>, imageFile?: File) => void;
  onCancel: () => void;
}) {
  useModal(true);
  const [formData, setFormData] = useState({
    emote_number: config.emote_number,
    custom_label: config.custom_label || '',
    description: config.description || '',
    preview_image: config.preview_image || '',
    is_active: config.is_active,
    order_index: config.order_index,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(config.preview_image || '');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, preview_image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(
      {
        ...formData,
        custom_label: formData.custom_label || null,
        description: formData.description || null,
        preview_image: formData.preview_image || null,
      },
      imageFile || undefined
    );
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
      >
        <div className="p-6 border-b-2 border-gray-200">
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
            {config.id ? 'Editar Configuración' : 'Nueva Configuración'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Número de Emote *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.emote_number}
              onChange={(e) =>
                setFormData({ ...formData, emote_number: parseInt(e.target.value) || 1 })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Etiqueta Personalizada
            </label>
            <input
              type="text"
              value={formData.custom_label}
              onChange={(e) => setFormData({ ...formData, custom_label: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              placeholder="Ej: Emote Feliz, Emote Triste"
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              rows={3}
              placeholder="Descripción opcional del emote"
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imagen de Preview
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview del emote"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm shadow-lg"
                  title="Quitar imagen"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="emote-image-upload"
                />
                <label
                  htmlFor="emote-image-upload"
                  className="cursor-pointer block"
                >
                  <span className="text-4xl mb-2 block">🖼️</span>
                  <span className="text-gray-600 font-nunito text-sm">
                    Click para seleccionar una imagen
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="font-nunito font-semibold">Activo</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-nunito font-bold rounded-lg transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? '⏳ Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatPrice(priceCLP: number, priceUSD: number): string {
  return `$${priceCLP.toLocaleString('es-CL')} CLP / $${priceUSD} USD`;
}
