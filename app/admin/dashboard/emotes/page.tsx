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
  const [configToDelete, setConfigToDelete] = useState<EmoteConfig | null>(null);

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
      if (editingConfig.id) {
        // Actualizar
        const { error } = await supabase
          .from('emote_config')
          .update({ 
            ...formData, 
            preview_image: null 
          })
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
            preview_image: null,
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

  async function handleConfirmDelete() {
    if (!configToDelete) return;

    try {
      // Eliminar la configuración
      const { error } = await supabase
        .from('emote_config')
        .delete()
        .eq('id', configToDelete.id);

      if (error) throw error;

      // También eliminar las disponibilidades de extras relacionadas
      await supabase
        .from('emote_extra_availability')
        .delete()
        .eq('emote_number', configToDelete.emote_number);

      setConfigToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting config:', error);
      alert('Error al eliminar la configuración');
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

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingConfig(config);
                      setShowConfigForm(true);
                    }}
                    className="flex-1 bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm shadow-md"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setConfigToDelete(config)}
                    className="bg-red-500 hover:bg-red-600 text-white font-nunito font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-md hover:shadow-lg"
                    title="Eliminar configuración"
                  >
                    🗑️
                  </button>
                </div>
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

      {/* Modal de Confirmación de Eliminación */}
      {configToDelete && (
        <DeleteConfirmModal
          config={configToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfigToDelete(null)}
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
    is_active: config.is_active,
    order_index: config.order_index,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(
      {
        ...formData,
        custom_label: formData.custom_label || null,
        description: formData.description || null,
        preview_image: null,
      },
      undefined
    );
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl relative"
      >
        <div className="p-6 border-b-2 border-gray-200">
          <div className="flex items-start justify-between">
            <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
              {config.id ? 'Editar Configuración' : 'Nueva Configuración'}
            </h3>
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
              onClick={onCancel}
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

function DeleteConfirmModal({
  config,
  onConfirm,
  onCancel,
}: {
  config: EmoteConfig;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useModal(true);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-md w-full border-2 border-[var(--sketch-border)] shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100 z-10"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="p-6">
          {/* Icono de Advertencia */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)] text-center mb-4">
            ¿Estás seguro?
          </h3>

          {/* Mensaje */}
          <div className="text-center mb-6">
            <p className="text-gray-700 font-nunito mb-2">
              Estás a punto de eliminar la configuración de emote:
            </p>
            <p className="text-red-600 font-bold text-lg font-nunito mb-2">
              {config.custom_label || `Emote #${config.emote_number}`}
            </p>
            <p className="text-gray-600 text-sm font-nunito">
              Esta acción no se puede deshacer.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-nunito font-bold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPrice(priceCLP: number, priceUSD: number): string {
  return `$${priceCLP.toLocaleString('es-CL')} CLP / $${priceUSD} USD`;
}
