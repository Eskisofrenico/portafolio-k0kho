'use client';

import { useEffect, useState } from 'react';
import { supabase, type CommissionTheme } from '@/lib/supabase';
import { useModal } from '@/hooks/useModal';

export default function ThemesPage() {
  const [themes, setThemes] = useState<CommissionTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState<CommissionTheme | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<CommissionTheme | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('commission_themes')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setThemes(data);
    }
    setLoading(false);
  }

  async function handleToggleAvailability(theme: CommissionTheme) {
    const { error } = await supabase
      .from('commission_themes')
      .update({ is_available: !theme.is_available })
      .eq('id', theme.id);

    if (!error) {
      fetchThemes();
    }
  }

  function handleEdit(theme: CommissionTheme) {
    setEditingTheme(theme);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingTheme({
      id: '',
      name: '',
      icon: '✨',
      description: '',
      is_available: true,
      order_index: themes.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  function handleCancel() {
    setEditingTheme(null);
    setShowForm(false);
    setIsCreating(false);
  }

  function handleDelete(theme: CommissionTheme) {
    setThemeToDelete(theme);
  }

  async function handleConfirmDelete() {
    if (!themeToDelete) return;

    const { error } = await supabase
      .from('commission_themes')
      .delete()
      .eq('id', themeToDelete.id);

    if (!error) {
      fetchThemes();
      setThemeToDelete(null);
    }
  }

  async function handleSave(formData: Partial<CommissionTheme>) {
    if (!editingTheme) return;

    if (isCreating) {
      const { error } = await supabase
        .from('commission_themes')
        .insert({
          id: formData.name?.toLowerCase().replace(/\s+/g, '-') || `theme-${Date.now()}`,
          name: formData.name!,
          icon: formData.icon || '✨',
          description: formData.description || null,
          is_available: formData.is_available !== undefined ? formData.is_available : true,
          order_index: formData.order_index || themes.length,
        });

      if (error) {
        console.error('Error creating theme:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('commission_themes')
        .update(formData)
        .eq('id', editingTheme.id);

      if (error) {
        console.error('Error updating theme:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingTheme(null);
    setIsCreating(false);
    fetchThemes();
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando temas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 pl-16 md:pl-16">
        <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
          Temas y Festivos 🎉
        </h1>
        <p className="text-gray-600 font-nunito text-sm md:text-base">
          Gestiona los temas festivos disponibles para las comisiones
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={handleCreate}
          className="bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 px-4 rounded-lg transition-all shadow-md"
        >
          + Agregar Tema
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`bg-white border-2 border-[var(--sketch-border)] rounded-lg p-6 shadow-lg ${
              !theme.is_available ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{theme.icon}</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 font-nunito">
                    {theme.name}
                  </h3>
                  {theme.description && (
                    <p className="text-sm text-gray-600 font-nunito mt-1">
                      {theme.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggleAvailability(theme)}
                className={`px-3 py-1 rounded text-xs font-nunito font-bold ${
                  theme.is_available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {theme.is_available ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(theme)}
                className="flex-1 bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm shadow-md"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(theme)}
                className="bg-red-500 hover:bg-red-600 text-white font-nunito font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-md"
                title="Eliminar tema"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {themes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 font-nunito text-lg mb-2">
            No hay temas configurados
          </p>
          <p className="text-gray-400 text-sm">
            Agrega temas festivos para que los clientes puedan seleccionarlos
          </p>
        </div>
      )}

      {/* Modal de Edición/Creación */}
      {showForm && editingTheme && (
        <ThemeEditModal
          theme={editingTheme}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {themeToDelete && (
        <DeleteConfirmModal
          theme={themeToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setThemeToDelete(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({
  theme,
  onConfirm,
  onCancel,
}: {
  theme: CommissionTheme;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useModal(true);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full border-2 border-[var(--sketch-border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)] mb-4">
            ¿Eliminar tema?
          </h3>
          <p className="text-gray-700 font-nunito mb-6">
            ¿Estás seguro de que quieres eliminar el tema <strong>"{theme.name}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-nunito font-bold rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-nunito font-bold rounded-lg transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeEditModal({
  theme,
  isCreating,
  onSave,
  onCancel,
}: {
  theme: CommissionTheme;
  isCreating: boolean;
  onSave: (data: Partial<CommissionTheme>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: theme.name,
    icon: theme.icon,
    description: theme.description || '',
    is_available: theme.is_available,
    order_index: theme.order_index,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      description: formData.description || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full border-2 border-[var(--sketch-border)] shadow-2xl">
        <div className="p-6 border-b-2 border-gray-200">
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
            {isCreating ? 'Crear Nuevo Tema' : `Editar: ${theme.name}`}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Nombre del Tema *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              placeholder="Ej: Navidad, Halloween"
            />
          </div>

          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Icono (Emoji) *
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none text-2xl text-center"
              required
              placeholder="🎄"
              maxLength={2}
            />
            <p className="text-xs text-gray-500 mt-1 font-nunito">
              Usa un emoji que represente el tema
            </p>
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
              placeholder="Descripción del tema (opcional)"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="font-nunito font-semibold">Disponible</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-nunito font-bold rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold rounded-lg transition-all"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
