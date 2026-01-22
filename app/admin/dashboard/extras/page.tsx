'use client';

import { useEffect, useState } from 'react';
import { supabase, type Extra, type Service } from '@/lib/supabase';
import { useServices } from '@/hooks/useServices';
import { useModal } from '@/hooks/useModal';

export default function ExtrasPage() {
  const { services } = useServices();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [extraToDelete, setExtraToDelete] = useState<Extra | null>(null);

  useEffect(() => {
    fetchExtras();
  }, []);

  async function fetchExtras() {
    setLoading(true);
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setExtras(data);
    }
    setLoading(false);
  }

  async function handleToggleAvailability(extra: Extra) {
    const { error } = await supabase
      .from('extras')
      .update({ is_available: !extra.is_available })
      .eq('id', extra.id);

    if (!error) {
      fetchExtras();
    }
  }

  function handleEdit(extra: Extra) {
    setEditingExtra(extra);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingExtra({
      id: '',
      title: '',
      description: '',
      icon: '✨',
      price_clp: 0,
      price_usd: 0,
      only_for: [],
      is_available: true,
      order_index: extras.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  function handleCancel() {
    setEditingExtra(null);
    setShowForm(false);
    setIsCreating(false);
  }

  function handleDelete(extra: Extra) {
    setExtraToDelete(extra);
  }

  async function handleConfirmDelete() {
    if (!extraToDelete) return;

    const { error } = await supabase
      .from('extras')
      .delete()
      .eq('id', extraToDelete.id);

    if (!error) {
      fetchExtras();
      setExtraToDelete(null);
    }
  }

  async function handleSave(formData: Partial<Extra>) {
    if (!editingExtra) return;

    if (isCreating) {
      // Crear nuevo extra
      const { error } = await supabase
        .from('extras')
        .insert({
          id: formData.title?.toLowerCase().replace(/\s+/g, '-') || `extra-${Date.now()}`,
          title: formData.title!,
          description: formData.description!,
          icon: formData.icon || '✨',
          price_clp: formData.price_clp!,
          price_usd: formData.price_usd!,
          only_for: formData.only_for || [],
          is_available: formData.is_available !== undefined ? formData.is_available : true,
          order_index: formData.order_index || extras.length,
        });

      if (error) {
        console.error('Error creating extra:', error);
        return;
      }
    } else {
      // Actualizar extra existente
      const { error } = await supabase
        .from('extras')
        .update(formData)
        .eq('id', editingExtra.id);

      if (error) {
        console.error('Error updating extra:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingExtra(null);
    setIsCreating(false);
    fetchExtras();
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando extras...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pl-16 md:pl-16">
          <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
            Gestión de Extras ✨
          </h1>
          <p className="text-gray-600 font-nunito text-sm md:text-base">
            Administra complementos y accesorios para las comisiones
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all shadow-lg text-sm md:text-base w-full md:w-auto"
        >
          ➕ Agregar Extra
        </button>
      </div>

      {/* Lista de Extras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {extras.map((extra) => (
          <div
            key={extra.id}
            className={`rounded-lg border-2 shadow-lg p-6 transition-all ${extra.is_available
                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 hover:border-blue-400'
                : 'bg-gray-50 border-gray-300 opacity-60'
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">{extra.icon}</span>
                <h3 className="font-patrick text-xl text-[var(--sketch-border)]">
                  {extra.title}
                </h3>
              </div>
              <button
                onClick={() => handleToggleAvailability(extra)}
                className={`px-3 py-1 rounded-lg font-nunito font-bold text-xs transition-all ${extra.is_available
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {extra.is_available ? '✅' : '❌'}
              </button>
            </div>

            <p className="text-gray-700 font-nunito text-sm mb-4">{extra.description}</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 font-nunito font-semibold text-xs">CLP</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${extra.price_clp.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-nunito font-semibold text-xs">USD</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${extra.price_usd}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 font-nunito font-semibold mb-2">
                Disponible para:
              </p>
              <div className="flex flex-wrap gap-1">
                {extra.only_for.map((serviceId) => {
                  const service = services.find((s: Service) => s.id === serviceId);
                  return (
                    <span
                      key={serviceId}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-nunito font-semibold"
                    >
                      {service ? service.title : serviceId}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(extra)}
                className="flex-1 bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm shadow-md hover:shadow-lg"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(extra)}
                className="bg-red-500 hover:bg-red-600 text-white font-nunito font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-md hover:shadow-lg"
                title="Eliminar extra"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edición/Creación */}
      {showForm && editingExtra && (
        <ExtraEditModal
          extra={editingExtra}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {extraToDelete && (
        <DeleteConfirmModal
          extra={extraToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setExtraToDelete(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({
  extra,
  onConfirm,
  onCancel,
}: {
  extra: Extra;
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
              Estás a punto de eliminar el extra:
            </p>
            <p className="text-red-600 font-bold text-lg font-nunito mb-2">
              {extra.icon} {extra.title}
            </p>
            <p className="text-gray-600 text-sm font-nunito">
              Esta acción no se puede deshacer.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-nunito font-bold"
              onClick={onCancel}
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

function ExtraEditModal({
  extra,
  isCreating,
  onSave,
  onCancel,
}: {
  extra: Extra;
  isCreating: boolean;
  onSave: (data: Partial<Extra>) => void;
  onCancel: () => void;
}) {
  const { services } = useServices();
  useModal(true);
  const [formData, setFormData] = useState({
    title: extra.title,
    description: extra.description,
    icon: extra.icon,
    price_clp: extra.price_clp,
    price_usd: extra.price_usd,
    only_for: extra.only_for,
  });

  // Funciones para formatear números con separadores de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CL');
  };

  const parseNumber = (str: string): number => {
    return parseInt(str.replace(/\./g, '')) || 0;
  };

  const handlePriceChange = (field: string, value: string) => {
    const parsed = parseNumber(value);
    setFormData({ ...formData, [field]: parsed });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleServiceType = (serviceId: string) => {
    setFormData({
      ...formData,
      only_for: formData.only_for.includes(serviceId)
        ? formData.only_for.filter((id) => id !== serviceId)
        : [...formData.only_for, serviceId],
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl relative"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
              {isCreating ? 'Crear Nuevo Extra' : `Editar: ${extra.title}`}
            </h2>
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
          {/* Título */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Icono (emoji)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              maxLength={2}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none resize-none"
              required
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio (CLP)
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_clp)}
                onChange={(e) => handlePriceChange('price_clp', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio (USD)
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_usd)}
                onChange={(e) => handlePriceChange('price_usd', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
            </div>
          </div>

          {/* Servicios Compatibles */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-3">
              Disponible para estos servicios:
            </label>
            {services.length === 0 ? (
              <div className="text-center py-4 text-gray-500 font-nunito">
                Cargando servicios...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {services.map((service: Service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={formData.only_for.includes(service.id)}
                      onChange={() => toggleServiceType(service.id)}
                      className="w-5 h-5"
                    />
                    <span className="font-nunito font-semibold text-gray-700">
                      {service.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-nunito font-bold"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg"
            >
              {isCreating ? '➕ Crear Extra' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
