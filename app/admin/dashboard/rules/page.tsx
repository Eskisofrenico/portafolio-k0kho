'use client';

import { useEffect, useState } from 'react';
import { supabase, type Rule } from '@/lib/supabase';
import { useModal } from '@/hooks/useModal';

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    setLoading(true);
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setRules(data);
    }
    setLoading(false);
  }

  function handleEdit(rule: Rule) {
    setEditingRule(rule);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingRule({
      id: crypto.randomUUID(),
      text: '',
      is_allowed: true,
      icon: '✨',
      order_index: rules.length,
      created_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  function handleCancel() {
    setEditingRule(null);
    setShowForm(false);
    setIsCreating(false);
  }

  async function handleSave(formData: Partial<Rule>) {
    if (!editingRule) return;

    if (isCreating) {
      const { error } = await supabase
        .from('rules')
        .insert({
          text: formData.text!,
          is_allowed: formData.is_allowed!,
          icon: formData.icon!,
          order_index: formData.order_index || rules.length,
        });

      if (error) {
        console.error('Error creating rule:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('rules')
        .update(formData)
        .eq('id', editingRule.id);

      if (error) {
        console.error('Error updating rule:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingRule(null);
    setIsCreating(false);
    fetchRules();
  }

  async function handleDelete(rule: Rule) {
    if (!confirm(`¿Eliminar la regla "${rule.text}"?`)) return;

    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', rule.id);

    if (!error) {
      fetchRules();
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando reglas...</p>
      </div>
    );
  }

  const allowedRules = rules.filter((r) => r.is_allowed);
  const forbiddenRules = rules.filter((r) => !r.is_allowed);

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pl-16 md:pl-16">
          <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
            Gestión de Reglas 📋
          </h1>
          <p className="text-gray-600 font-nunito text-sm md:text-base">
            Define qué dibujas y qué no dibujas
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all shadow-lg text-sm md:text-base w-full md:w-auto"
        >
          ➕ Agregar Regla
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permitido */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 shadow-lg p-6 hover:border-yellow-400 transition-all">
          <h2 className="font-patrick text-2xl text-yellow-800 mb-4 flex items-center gap-2">
            ✅ Sí Dibujo
          </h2>
          <div className="space-y-3">
            {allowedRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{rule.icon}</span>
                  <span className="font-nunito font-semibold text-gray-800">
                    {rule.text}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-nunito font-bold transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-nunito font-bold transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {allowedRules.length === 0 && (
              <p className="text-gray-500 text-center py-4 font-nunito">
                No hay reglas permitidas
              </p>
            )}
          </div>
        </div>

        {/* No Permitido */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-300 shadow-lg p-6 hover:border-orange-400 transition-all">
          <h2 className="font-patrick text-2xl text-orange-800 mb-4 flex items-center gap-2">
            ❌ No Dibujo
          </h2>
          <div className="space-y-3">
            {forbiddenRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{rule.icon}</span>
                  <span className="font-nunito font-semibold text-gray-800">
                    {rule.text}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-nunito font-bold transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(rule)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-nunito font-bold transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {forbiddenRules.length === 0 && (
              <p className="text-gray-500 text-center py-4 font-nunito">
                No hay reglas prohibidas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición/Creación */}
      {showForm && editingRule && (
        <RuleFormModal
          rule={editingRule}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

function RuleFormModal({
  rule,
  isCreating,
  onSave,
  onCancel,
}: {
  rule: Rule;
  isCreating: boolean;
  onSave: (data: Partial<Rule>) => void;
  onCancel: () => void;
}) {
  useModal(true);
  const [formData, setFormData] = useState({
    text: rule.text,
    icon: rule.icon,
    is_allowed: rule.is_allowed,
    order_index: rule.order_index,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full border-2 border-[var(--sketch-border)] shadow-2xl relative"
      >
        <div className="bg-white border-b-2 border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
              {isCreating ? 'Crear Nueva Regla' : 'Editar Regla'}
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
          {/* Texto */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Texto de la Regla *
            </label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              placeholder="Ej: Personajes/OC"
            />
          </div>

          {/* Icono */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Icono (emoji) *
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              maxLength={2}
              placeholder="🎨"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-3">
              Tipo de Regla *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="radio"
                  checked={formData.is_allowed === true}
                  onChange={() => setFormData({ ...formData, is_allowed: true })}
                  className="w-5 h-5"
                />
                <div>
                  <span className="font-nunito font-bold text-green-700">✅ Permitido</span>
                  <p className="text-xs text-gray-600">Sí dibujo esto</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="radio"
                  checked={formData.is_allowed === false}
                  onChange={() => setFormData({ ...formData, is_allowed: false })}
                  className="w-5 h-5"
                />
                <div>
                  <span className="font-nunito font-bold text-red-700">❌ Prohibido</span>
                  <p className="text-xs text-gray-600">No dibujo esto</p>
                </div>
              </label>
            </div>
          </div>

          {/* Order Index */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Orden (menor = aparece primero)
            </label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              min="0"
            />
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
              {isCreating ? '➕ Crear Regla' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
