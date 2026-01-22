'use client';

import { useEffect, useState } from 'react';
import { supabase, type Service, type DetailLevel, type ServiceVariant } from '@/lib/supabase';
import { useModal } from '@/hooks/useModal';
import Image from 'next/image';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [managingLevelsService, setManagingLevelsService] = useState<Service | null>(null);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [managingVariantsService, setManagingVariantsService] = useState<Service | null>(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  }

  async function handleToggleAvailability(service: Service) {
    const { error } = await supabase
      .from('services')
      .update({ is_available: !service.is_available })
      .eq('id', service.id);

    if (!error) {
      fetchServices();
    }
  }

  function handleEdit(service: Service) {
    setEditingService(service);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleManageLevels(service: Service) {
    setManagingLevelsService(service);
    setShowLevelsModal(true);
  }

  function handleManageVariants(service: Service) {
    setManagingVariantsService(service);
    setShowVariantsModal(true);
  }

  function handleCreate() {
    setEditingService({
      id: '',
      title: '',
      image: '',
      price_clp_min: 0,
      price_clp_max: 0,
      price_usd_min: 0,
      price_usd_max: 0,
      category: '',
      description: '',
      is_available: true,
      order_index: services.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  function handleCancel() {
    setEditingService(null);
    setShowForm(false);
    setIsCreating(false);
  }

  async function handleSave(
    formData: Partial<Service>,
    levels?: Partial<DetailLevel>[],
    variants?: Partial<ServiceVariant>[]
  ) {
    if (!editingService) return;

    let newServiceId: string | undefined;

    if (isCreating) {
      // Crear nuevo servicio
      const serviceId = formData.title?.toLowerCase().replace(/\s+/g, '-') || `service-${Date.now()}`;
      const { error } = await supabase
        .from('services')
        .insert({
          id: serviceId,
          title: formData.title!,
          image: formData.image || '/dibujo1.webp',
          price_clp_min: formData.price_clp_min!,
          price_clp_max: formData.price_clp_max!,
          price_usd_min: formData.price_usd_min!,
          price_usd_max: formData.price_usd_max!,
          category: formData.category!,
          description: formData.description!,
          is_available: formData.is_available !== undefined ? formData.is_available : true,
          order_index: formData.order_index || services.length,
        });

      if (error) {
        console.error('Error creating service:', error);
        alert('Error al crear el servicio. Por favor, intenta de nuevo.');
        return;
      }

      newServiceId = serviceId;

      // Crear niveles de detalle si se proporcionaron
      if (levels && levels.length > 0) {
        const levelsToInsert = levels
          .filter(level => level.level_name && level.level_label)
          .map((level, index) => ({
            service_id: serviceId,
            level_name: level.level_name!,
            level_label: level.level_label!,
            price_clp: level.price_clp || 0,
            price_usd: level.price_usd || 0,
            description: level.description || null,
            includes: level.includes || null,
            recommendations: level.recommendations || [],
            example_image: level.example_image || null,
            order_index: level.order_index ?? index,
            is_available: level.is_available !== undefined ? level.is_available : true,
          }));

        if (levelsToInsert.length > 0) {
          const { error: levelsError } = await supabase
            .from('service_detail_levels')
            .insert(levelsToInsert);

          if (levelsError) {
            console.error('Error creating levels:', levelsError);
            alert('El servicio se creó, pero hubo un error al crear los niveles. Puedes agregarlos manualmente después.');
          }
        }
      }

      // Crear variantes si se proporcionaron
      if (variants && variants.length > 0) {
        const variantsToInsert = variants
          .filter(variant => variant.variant_name && variant.variant_label)
          .map((variant, index) => ({
            service_id: serviceId,
            variant_name: variant.variant_name!,
            variant_label: variant.variant_label!,
            price_clp: variant.price_clp || 0,
            price_usd: variant.price_usd || 0,
            description: variant.description || null,
            preview_image: variant.preview_image || '/dibujo1.webp',
            order_index: variant.order_index ?? index,
            is_available: variant.is_available !== undefined ? variant.is_available : true,
          }));

        if (variantsToInsert.length > 0) {
          const { error: variantsError } = await supabase
            .from('service_variants')
            .insert(variantsToInsert);

          if (variantsError) {
            console.error('Error creating variants:', variantsError);
            alert('El servicio se creó, pero hubo un error al crear las variantes. Puedes agregarlas manualmente después.');
          }
        }
      }
    } else {
      // Actualizar servicio existente
      const { error } = await supabase
        .from('services')
        .update(formData)
        .eq('id', editingService.id);

      if (error) {
        console.error('Error updating service:', error);
        alert('Error al actualizar el servicio. Por favor, intenta de nuevo.');
        return;
      }
    }

    setShowForm(false);
    setEditingService(null);
    setIsCreating(false);
    fetchServices();
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pl-16 md:pl-16">
          <h1 className="font-patrick text-3xl md:text-4xl text-[var(--sketch-border)] mb-2">
            Gestión de Servicios 🎨
          </h1>
          <p className="text-gray-600 font-nunito text-sm md:text-base">
            Administra los tipos de comisiones y sus precios
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all shadow-lg text-sm md:text-base w-full md:w-auto"
        >
          ➕ Agregar Servicio
        </button>
      </div>

      {/* Lista de Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className={`rounded-lg border-2 shadow-lg p-6 transition-all ${service.is_available
              ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-300 hover:border-pink-400'
              : 'bg-gray-50 border-gray-300 opacity-60'
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{service.category}</p>
              </div>
              <button
                onClick={() => handleToggleAvailability(service)}
                className={`px-4 py-2 rounded-lg font-nunito font-bold text-sm transition-all ${service.is_available
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {service.is_available ? '✅ Disponible' : '❌ No disponible'}
              </button>
            </div>

            <p className="text-gray-700 font-nunito mb-4">{service.description}</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-nunito font-semibold">CLP</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${service.price_clp_min.toLocaleString()} - ${service.price_clp_max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-nunito font-semibold">USD</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${service.price_usd_min} - ${service.price_usd_max}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(service)}
                className="flex-1 bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleManageLevels(service)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-nunito font-bold py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
              >
                📊 Niveles
              </button>
              <button
                onClick={() => handleManageVariants(service)}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-nunito font-bold py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
              >
                🎨 Variantes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edición/Creación */}
      {showForm && editingService && (
        <ServiceEditModal
          service={editingService}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Modal de Gestión de Niveles */}
      {showLevelsModal && managingLevelsService && (
        <DetailLevelsModal
          service={managingLevelsService}
          onClose={() => {
            setShowLevelsModal(false);
            setManagingLevelsService(null);
          }}
        />
      )}

      {/* Modal de Gestión de Variantes */}
      {showVariantsModal && managingVariantsService && (
        <VariantsModal
          service={managingVariantsService}
          onClose={() => {
            setShowVariantsModal(false);
            setManagingVariantsService(null);
          }}
        />
      )}
    </div>
  );
}

function LevelFormInline({
  level,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: {
  level: Partial<DetailLevel>;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<DetailLevel>) => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const [formData, setFormData] = useState({
    level_name: level.level_name || '',
    level_label: level.level_label || '',
    price_clp: level.price_clp || 0,
    price_usd: level.price_usd || 0,
    description: level.description || '',
    includes: level.includes || '',
    recommendations: (level.recommendations || []).join(', '),
  });

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

  const handleSubmit = () => {
    // Validar campos requeridos
    if (!formData.level_name || !formData.level_label) {
      alert('Por favor, completa los campos requeridos (Nombre y Etiqueta)');
      return;
    }

    const recommendationsArray = formData.recommendations
      ? formData.recommendations.split(',').map(r => r.trim()).filter(r => r.length > 0)
      : [];

    onSave({
      ...formData,
      recommendations: recommendationsArray,
      includes: formData.includes || null,
      description: formData.description || null,
    });
  };

  if (!isEditing) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-patrick text-lg text-[var(--sketch-border)] mb-1">
              {formData.level_label || `Nivel ${index + 1}`}
            </h4>
            <p className="text-xs text-gray-600 font-nunito font-semibold uppercase mb-2">
              {formData.level_name || 'Sin nombre'}
            </p>
            {formData.description && (
              <p className="text-sm text-gray-700 mb-2 font-nunito">{formData.description}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div>
                <span className="text-gray-500 font-nunito font-semibold text-xs">CLP: </span>
                <span className="font-bold text-gray-800">${formatNumber(formData.price_clp)}</span>
              </div>
              <div>
                <span className="text-gray-500 font-nunito font-semibold text-xs">USD: </span>
                <span className="font-bold text-gray-800">${formatNumber(formData.price_usd)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-nunito font-bold"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-nunito font-bold"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Nombre (ID) *
            </label>
            <input
              type="text"
              value={formData.level_name}
              onChange={(e) => setFormData({ ...formData, level_name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
              placeholder="simple"
            />
          </div>
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Etiqueta *
            </label>
            <input
              type="text"
              value={formData.level_label}
              onChange={(e) => setFormData({ ...formData, level_label: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
              placeholder="Simple"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
            placeholder="Descripción del nivel..."
          />
        </div>

        <div>
          <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
            Qué Incluye
          </label>
          <textarea
            value={formData.includes}
            onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
            placeholder="Lista de lo que incluye..."
          />
        </div>

        <div>
          <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
            Recomendaciones (separadas por comas)
          </label>
          <input
            type="text"
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Perfil, Portada, Uso comercial"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Precio CLP *
            </label>
            <input
              type="text"
              value={formatNumber(formData.price_clp)}
              onChange={(e) => handlePriceChange('price_clp', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Precio USD *
            </label>
            <input
              type="text"
              value={formatNumber(formData.price_usd)}
              onChange={(e) => handlePriceChange('price_usd', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-nunito font-bold hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-nunito font-bold"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantFormInline({
  variant,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: {
  variant: Partial<ServiceVariant>;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<ServiceVariant>) => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const [formData, setFormData] = useState({
    variant_name: variant.variant_name || '',
    variant_label: variant.variant_label || '',
    price_clp: variant.price_clp || 0,
    price_usd: variant.price_usd || 0,
    description: variant.description || '',
    preview_image: variant.preview_image || '',
  });

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

  const handleSubmit = () => {
    // Validar campos requeridos
    if (!formData.variant_name || !formData.variant_label) {
      alert('Por favor, completa los campos requeridos (Nombre y Etiqueta)');
      return;
    }

    onSave({
      ...formData,
      description: formData.description || null,
    });
  };

  if (!isEditing) {
    return (
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-patrick text-lg text-[var(--sketch-border)] mb-1">
              {formData.variant_label || `Variante ${index + 1}`}
            </h4>
            <p className="text-xs text-gray-600 font-nunito font-semibold uppercase mb-2">
              {formData.variant_name || 'Sin nombre'}
            </p>
            {formData.description && (
              <p className="text-sm text-gray-700 mb-2 font-nunito">{formData.description}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div>
                <span className="text-gray-500 font-nunito font-semibold text-xs">CLP: </span>
                <span className="font-bold text-gray-800">${formatNumber(formData.price_clp)}</span>
              </div>
              <div>
                <span className="text-gray-500 font-nunito font-semibold text-xs">USD: </span>
                <span className="font-bold text-gray-800">${formatNumber(formData.price_usd)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-nunito font-bold"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-nunito font-bold"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Nombre (ID) *
            </label>
            <input
              type="text"
              value={formData.variant_name}
              onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
              placeholder="frontal"
            />
          </div>
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Etiqueta *
            </label>
            <input
              type="text"
              value={formData.variant_label}
              onChange={(e) => setFormData({ ...formData, variant_label: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
              placeholder="Vista Frontal"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
            placeholder="Descripción de la variante..."
          />
        </div>

        <div>
          <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
            URL Imagen Preview
          </label>
          <input
            type="text"
            value={formData.preview_image}
            onChange={(e) => setFormData({ ...formData, preview_image: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="/dibujo1.webp"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Precio Adicional CLP *
            </label>
            <input
              type="text"
              value={formatNumber(formData.price_clp)}
              onChange={(e) => handlePriceChange('price_clp', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-nunito font-bold text-gray-700 mb-1">
              Precio Adicional USD *
            </label>
            <input
              type="text"
              value={formatNumber(formData.price_usd)}
              onChange={(e) => handlePriceChange('price_usd', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-nunito font-bold hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-nunito font-bold"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceEditModal({
  service,
  isCreating,
  onSave,
  onCancel,
}: {
  service: Service;
  isCreating: boolean;
  onSave: (data: Partial<Service>, levels?: Partial<DetailLevel>[], variants?: Partial<ServiceVariant>[]) => void;
  onCancel: () => void;
}) {
  useModal(true);
  const [formData, setFormData] = useState({
    title: service.title,
    description: service.description,
    image: service.image,
    price_clp_min: service.price_clp_min,
    price_clp_max: service.price_clp_max,
    price_usd_min: service.price_usd_min,
    price_usd_max: service.price_usd_max,
    category: service.category,
    is_available: service.is_available,
    order_index: service.order_index,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Estados para categorías existentes
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Estados para niveles y variantes (solo al crear)
  const [levels, setLevels] = useState<Partial<DetailLevel>[]>([]);
  const [variants, setVariants] = useState<Partial<ServiceVariant>[]>([]);
  const [editingLevelIndex, setEditingLevelIndex] = useState<number | null>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  // Cargar categorías existentes
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('services')
        .select('category');
      if (data) {
        const uniqueCategories = [...new Set(data.map(s => s.category).filter(Boolean))];
        setExistingCategories(uniqueCategories);
      }
    }
    fetchCategories();
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setFormData({ ...formData, image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya imagen al crear nuevo servicio
    if (isCreating && !selectedFile && !formData.image) {
      alert('Por favor, selecciona una imagen para el servicio');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image;

      // Si hay un archivo seleccionado, subirlo a Supabase Storage
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Si no hay imagen y es creación, usar una por defecto
      if (isCreating && !imageUrl) {
        imageUrl = '/dibujo1.webp';
      }

      // Guardar con la URL de la imagen (nueva o existente)
      // Si es creación, pasar también niveles y variantes
      if (isCreating) {
        onSave({ ...formData, image: imageUrl }, levels, variants);
      } else {
        onSave({ ...formData, image: imageUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // Funciones para manejar niveles (solo al crear)
  const handleAddLevel = () => {
    setLevels([...levels, {
      level_name: '',
      level_label: '',
      price_clp: 0,
      price_usd: 0,
      description: '',
      includes: '',
      recommendations: [],
      example_image: null,
      order_index: levels.length,
      is_available: true,
    }]);
    setEditingLevelIndex(levels.length);
  };

  const handleUpdateLevel = (index: number, data: Partial<DetailLevel>) => {
    const updated = [...levels];
    updated[index] = { ...updated[index], ...data };
    setLevels(updated);
    setEditingLevelIndex(null);
  };

  const handleRemoveLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
    if (editingLevelIndex === index) {
      setEditingLevelIndex(null);
    }
  };

  const handleCancelLevel = (index: number) => {
    const level = levels[index];
    // Si el nivel está vacío (nuevo y sin guardar), eliminarlo
    const isEmpty = !level.level_name && !level.level_label &&
      (!level.price_clp || level.price_clp === 0) &&
      (!level.price_usd || level.price_usd === 0);

    if (isEmpty) {
      handleRemoveLevel(index);
    } else {
      setEditingLevelIndex(null);
    }
  };

  // Funciones para manejar variantes (solo al crear)
  const handleAddVariant = () => {
    setVariants([...variants, {
      variant_name: '',
      variant_label: '',
      price_clp: 0,
      price_usd: 0,
      description: '',
      preview_image: '',
      order_index: variants.length,
      is_available: true,
    }]);
    setEditingVariantIndex(variants.length);
  };

  const handleUpdateVariant = (index: number, data: Partial<ServiceVariant>) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...data };
    setVariants(updated);
    setEditingVariantIndex(null);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
    if (editingVariantIndex === index) {
      setEditingVariantIndex(null);
    }
  };

  const handleCancelVariant = (index: number) => {
    const variant = variants[index];
    // Si la variante está vacía (nueva y sin guardar), eliminarla
    const isEmpty = !variant.variant_name && !variant.variant_label &&
      (!variant.price_clp || variant.price_clp === 0) &&
      (!variant.price_usd || variant.price_usd === 0);

    if (isEmpty) {
      handleRemoveVariant(index);
    } else {
      setEditingVariantIndex(null);
    }
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
              {isCreating ? 'Crear Nuevo Servicio' : `Editar: ${service.title}`}
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

          {/* Imagen */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imagen {!isCreating && '(dejar vacío para mantener la actual)'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            />
            {(preview || formData.image) && (
              <div className="mt-4 relative">
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={preview || formData.image || ''}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-nunito font-bold text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  Eliminar Imagen
                </button>
              </div>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Categoría
            </label>
            {showNewCategoryInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                  placeholder="Nueva categoría..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategory.trim()) {
                      setFormData({ ...formData, category: newCategory.trim() });
                      setExistingCategories([...existingCategories, newCategory.trim()]);
                      setShowNewCategoryInput(false);
                      setNewCategory('');
                    }
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-nunito font-bold"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setNewCategory('');
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-nunito font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none bg-white"
                  required
                >
                  <option value="">Seleccionar categoría...</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-nunito font-bold text-sm"
                  title="Agregar nueva categoría"
                >
                  + Nueva
                </button>
              </div>
            )}
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

          {/* Precios CLP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio Mín. (CLP)
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_clp_min)}
                onChange={(e) => handlePriceChange('price_clp_min', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio Máx. (CLP)
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_clp_max)}
                onChange={(e) => handlePriceChange('price_clp_max', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
            </div>
          </div>

          {/* Precios USD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio Mín. (USD)
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_usd_min)}
                onChange={(e) => handlePriceChange('price_usd_min', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio Máx. (USD)
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_usd_max)}
                onChange={(e) => handlePriceChange('price_usd_max', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
            </div>
          </div>

          {/* Sección de Niveles de Detalle (solo al crear) */}
          {isCreating && (
            <div className="pt-6 border-t-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-patrick text-xl text-[var(--sketch-border)]">
                  📊 Niveles de Detalle
                </h3>
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-nunito font-bold text-sm"
                >
                  ➕ Agregar Nivel
                </button>
              </div>

              {levels.length === 0 ? (
                <p className="text-gray-500 text-sm font-nunito italic">
                  No hay niveles agregados. (Opcional)
                </p>
              ) : (
                <div className="space-y-4">
                  {levels.map((level, index) => (
                    <LevelFormInline
                      key={index}
                      level={level}
                      index={index}
                      isEditing={editingLevelIndex === index}
                      onEdit={() => setEditingLevelIndex(index)}
                      onSave={(data: Partial<DetailLevel>) => handleUpdateLevel(index, data)}
                      onCancel={() => handleCancelLevel(index)}
                      onRemove={() => handleRemoveLevel(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sección de Variantes (solo al crear) */}
          {isCreating && (
            <div className="pt-6 border-t-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-patrick text-xl text-[var(--sketch-border)]">
                  🎨 Variantes
                </h3>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all font-nunito font-bold text-sm"
                >
                  ➕ Agregar Variante
                </button>
              </div>

              {variants.length === 0 ? (
                <p className="text-gray-500 text-sm font-nunito italic">
                  No hay variantes agregadas. (Opcional)
                </p>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <VariantFormInline
                      key={index}
                      variant={variant}
                      index={index}
                      isEditing={editingVariantIndex === index}
                      onEdit={() => setEditingVariantIndex(index)}
                      onSave={(data: Partial<ServiceVariant>) => handleUpdateVariant(index, data)}
                      onCancel={() => handleCancelVariant(index)}
                      onRemove={() => handleRemoveVariant(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '⏳ Subiendo...' : isCreating ? '➕ Crear Servicio Completo' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailLevelsModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  useModal(true);
  const [levels, setLevels] = useState<DetailLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState<DetailLevel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<DetailLevel | null>(null);

  useEffect(() => {
    fetchLevels();
  }, []);

  async function fetchLevels() {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_detail_levels')
      .select('*')
      .eq('service_id', service.id)
      .order('order_index');

    if (!error && data) {
      setLevels(data);
    }
    setLoading(false);
  }

  function handleCreate() {
    setEditingLevel({
      id: '',
      service_id: service.id,
      level_name: '',
      level_label: '',
      price_clp: 0,
      price_usd: 0,
      description: null,
      includes: null,
      recommendations: [],
      example_image: null,
      order_index: levels.length,
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  function handleEdit(level: DetailLevel) {
    setEditingLevel(level);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleDelete(level: DetailLevel) {
    setLevelToDelete(level);
  }

  async function handleConfirmDelete() {
    if (!levelToDelete) return;

    const { error } = await supabase
      .from('service_detail_levels')
      .delete()
      .eq('id', levelToDelete.id);

    if (!error) {
      fetchLevels();
      setLevelToDelete(null);
    }
  }

  async function handleSave(formData: Partial<DetailLevel>) {
    if (!editingLevel) return;

    if (isCreating) {
      const { error } = await supabase
        .from('service_detail_levels')
        .insert({
          service_id: service.id,
          level_name: formData.level_name!,
          level_label: formData.level_label!,
          price_clp: formData.price_clp!,
          price_usd: formData.price_usd!,
          description: formData.description || null,
          example_image: formData.example_image || null,
          order_index: formData.order_index || levels.length,
          is_available: formData.is_available !== undefined ? formData.is_available : true,
        });

      if (error) {
        console.error('Error creating level:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('service_detail_levels')
        .update(formData)
        .eq('id', editingLevel.id);

      if (error) {
        console.error('Error updating level:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingLevel(null);
    setIsCreating(false);
    fetchLevels();
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CL');
  };

  const parseNumber = (str: string): number => {
    return parseInt(str.replace(/\./g, '')) || 0;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando niveles...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
                Niveles de Detalle: {service.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Gestiona los niveles Simple, Detallado y Premium</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="font-nunito font-bold text-lg text-gray-700">Niveles Configurados</h3>
            <button
              onClick={handleCreate}
              className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 rounded-lg transition-all shadow-md"
            >
              ➕ Agregar Nivel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {levels.map((level) => (
              <div
                key={level.id}
                className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-4 hover:border-blue-400 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-patrick text-xl text-[var(--sketch-border)] mb-1">
                      {level.level_label}
                    </h4>
                    <p className="text-xs text-gray-600 font-nunito font-semibold uppercase">
                      {level.level_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(level)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    🗑️
                  </button>
                </div>

                {level.description && (
                  <p className="text-sm text-gray-700 mb-3 font-nunito">{level.description}</p>
                )}

                {level.includes && (
                  <div className="mb-3 p-2 bg-white/40 rounded text-xs">
                    <p className="font-semibold text-gray-700 mb-1">Incluye:</p>
                    <p className="text-gray-600">{level.includes}</p>
                  </div>
                )}

                {level.recommendations && level.recommendations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Recomendado para:</p>
                    <div className="flex flex-wrap gap-1">
                      {level.recommendations.map((rec, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                        >
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white/60 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 font-nunito font-semibold text-xs">CLP</p>
                      <p className="text-lg font-bold text-gray-800">
                        ${formatNumber(level.price_clp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-nunito font-semibold text-xs">USD</p>
                      <p className="text-lg font-bold text-gray-800">
                        ${formatNumber(level.price_usd)}
                      </p>
                    </div>
                  </div>
                </div>

                {level.example_image && (
                  <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={level.example_image}
                      alt={level.level_label}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <button
                  onClick={() => handleEdit(level)}
                  className="w-full bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm shadow-md"
                >
                  ✏️ Editar
                </button>
              </div>
            ))}
          </div>

          {levels.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-nunito text-lg mb-2">
                No hay niveles configurados
              </p>
              <p className="text-gray-400 text-sm">
                Agrega niveles de detalle (Simple, Detallado, Premium) para este servicio
              </p>
            </div>
          )}
        </div>

        {/* Modal de Edición/Creación de Nivel */}
        {showForm && editingLevel && (
          <LevelEditModal
            level={editingLevel}
            isCreating={isCreating}
            existingLevels={levels}
            serviceId={service.id}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingLevel(null);
              setIsCreating(false);
            }}
          />
        )}

        {/* Modal de Confirmación de Eliminación de Nivel */}
        {levelToDelete && (
          <DeleteLevelConfirmModal
            level={levelToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={() => setLevelToDelete(null)}
          />
        )}
      </div>
    </div>
  );
}

function LevelEditModal({
  level,
  isCreating,
  existingLevels,
  serviceId,
  onSave,
  onCancel,
}: {
  level: DetailLevel;
  isCreating: boolean;
  existingLevels: DetailLevel[];
  serviceId: string;
  onSave: (data: Partial<DetailLevel>) => void;
  onCancel: () => void;
}) {
  useModal(true);
  const [selectedLevelOption, setSelectedLevelOption] = useState<string>(
    isCreating ? 'new' : level.level_name
  );
  const [newLevelName, setNewLevelName] = useState<string>(
    isCreating ? '' : level.level_name
  );
  const [formData, setFormData] = useState({
    level_name: level.level_name,
    level_label: level.level_label,
    price_clp: level.price_clp,
    price_usd: level.price_usd,
    description: level.description || '',
    includes: level.includes || '',
    recommendations: (level.recommendations || []).join(', '),
    example_image: level.example_image || '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Si estamos editando, no permitir cambiar el nombre del nivel
  const isEditing = !isCreating;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setFormData({ ...formData, example_image: '' });
  };

  const handleLevelOptionChange = (value: string) => {
    setSelectedLevelOption(value);
    if (value === 'new') {
      setNewLevelName('');
      setFormData({ ...formData, level_name: '' });
    } else {
      // Solo usar el nombre del nivel existente, mantener los demás campos del formulario
      setFormData({ ...formData, level_name: value });
      setNewLevelName('');
    }
  };

  const handleNewLevelNameChange = (value: string) => {
    setNewLevelName(value);
    setFormData({ ...formData, level_name: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.example_image;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `level-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Convertir recomendaciones de string a array
      const recommendationsArray = formData.recommendations
        ? formData.recommendations.split(',').map(r => r.trim()).filter(r => r.length > 0)
        : [];

      // Asegurar que level_name esté definido
      const finalLevelName = selectedLevelOption === 'new'
        ? newLevelName.trim().toLowerCase().replace(/\s+/g, '-')
        : formData.level_name;

      if (!finalLevelName) {
        alert('Por favor, selecciona un nivel existente o escribe el nombre de uno nuevo');
        setUploading(false);
        return;
      }

      onSave({
        ...formData,
        level_name: finalLevelName,
        example_image: imageUrl || null,
        recommendations: recommendationsArray,
        includes: formData.includes || null,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
            {isCreating ? 'Crear Nuevo Nivel' : `Editar: ${level.level_label}`}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre del Nivel (ID) - Selector */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Nombre del Nivel (ID) *
            </label>
            {isEditing ? (
              // Al editar, mostrar solo el nombre (no editable)
              <div className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {level.level_name}
                <span className="text-xs text-gray-500 ml-2 font-nunito">(No se puede cambiar al editar)</span>
              </div>
            ) : (
              // Al crear, mostrar selector con opciones
              <>
                <select
                  value={selectedLevelOption}
                  onChange={(e) => handleLevelOptionChange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                  required
                >
                  <option value="">Selecciona una opción...</option>
                  {existingLevels.map((l) => (
                    <option key={l.id} value={l.level_name}>
                      {l.level_label} ({l.level_name})
                    </option>
                  ))}
                  <option value="new">➕ Agregar Nuevo Nivel</option>
                </select>

                {/* Input para nuevo nivel */}
                {selectedLevelOption === 'new' && (
                  <div className="mt-3">
                    <label className="block text-sm font-nunito font-semibold text-gray-600 mb-2">
                      Escribe el nombre del nuevo nivel (ID):
                    </label>
                    <input
                      type="text"
                      value={newLevelName}
                      onChange={(e) => handleNewLevelNameChange(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      required={selectedLevelOption === 'new'}
                      placeholder="Ej: simple, detallado, premium, ultra"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-nunito">
                      Este será el identificador único del nivel (sin espacios, en minúsculas)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Etiqueta del Nivel */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Etiqueta (Texto a mostrar) *
            </label>
            <input
              type="text"
              value={formData.level_label}
              onChange={(e) => setFormData({ ...formData, level_label: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              placeholder="Ej: Simple, Detallado, Premium"
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
              placeholder="Describe brevemente este nivel..."
            />
          </div>

          {/* Qué Incluye */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Qué Incluye
            </label>
            <textarea
              value={formData.includes}
              onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none resize-none"
              placeholder="Ej: Rostro básico con colores planos, sin sombras complejas..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Lista detallada de lo que incluye este nivel de detalle
            </p>
          </div>

          {/* Recomendaciones */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Recomendaciones de Uso
            </label>
            <input
              type="text"
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              placeholder="Ej: Perfil de redes sociales, Portada, Uso comercial..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Separa las recomendaciones con comas (ej: Perfil, Portada, Uso comercial)
            </p>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio (CLP) *
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
                Precio (USD) *
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

          {/* Imagen de Ejemplo */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imagen de Ejemplo (Opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
            />
            {(preview || formData.example_image) && (
              <div className="mt-4 relative">
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={preview || formData.example_image || ''}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-nunito font-bold text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  Eliminar Imagen
                </button>
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
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {uploading ? '⏳ Subiendo...' : isCreating ? '➕ Crear Nivel' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VariantsModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  // Todos los hooks deben estar al principio, antes de cualquier return condicional
  useModal(true);
  const [variants, setVariants] = useState<ServiceVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<ServiceVariant | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<ServiceVariant | null>(null);

  useEffect(() => {
    fetchVariants();
  }, []);

  async function fetchVariants() {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_variants')
      .select('*')
      .eq('service_id', service.id)
      .order('order_index');

    if (!error && data) {
      setVariants(data);
    }
    setLoading(false);
  }

  function handleCreate() {
    setEditingVariant({
      id: '',
      service_id: service.id,
      variant_name: '',
      variant_label: '',
      price_clp: 0,
      price_usd: 0,
      description: null,
      preview_image: '',
      order_index: variants.length,
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsCreating(true);
    setShowForm(true);
  }

  function handleEdit(variant: ServiceVariant) {
    setEditingVariant(variant);
    setIsCreating(false);
    setShowForm(true);
  }

  function handleDelete(variant: ServiceVariant) {
    setVariantToDelete(variant);
  }

  async function handleConfirmDelete() {
    if (!variantToDelete) return;

    const { error } = await supabase
      .from('service_variants')
      .delete()
      .eq('id', variantToDelete.id);

    if (!error) {
      fetchVariants();
      setVariantToDelete(null);
    }
  }

  async function handleSave(formData: Partial<ServiceVariant>) {
    if (!editingVariant) return;

    if (isCreating) {
      const { error } = await supabase
        .from('service_variants')
        .insert({
          service_id: service.id,
          variant_name: formData.variant_name!,
          variant_label: formData.variant_label!,
          price_clp: formData.price_clp!,
          price_usd: formData.price_usd!,
          description: formData.description || null,
          preview_image: formData.preview_image!,
          order_index: formData.order_index || variants.length,
          is_available: formData.is_available !== undefined ? formData.is_available : true,
        });

      if (error) {
        console.error('Error creating variant:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('service_variants')
        .update(formData)
        .eq('id', editingVariant.id);

      if (error) {
        console.error('Error updating variant:', error);
        return;
      }
    }

    setShowForm(false);
    setEditingVariant(null);
    setIsCreating(false);
    fetchVariants();
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CL');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sketch-border)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando variantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-patrick text-3xl text-[var(--sketch-border)]">
                Variantes: {service.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Gestiona las variantes de este servicio (vistas, estilos, etc.)</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="font-nunito font-bold text-lg text-gray-700">Variantes Configuradas</h3>
            <button
              onClick={handleCreate}
              className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-4 py-2 rounded-lg transition-all shadow-md"
            >
              ➕ Agregar Variante
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4 hover:border-purple-400 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-patrick text-xl text-[var(--sketch-border)] mb-1">
                      {variant.variant_label}
                    </h4>
                    <p className="text-xs text-gray-600 font-nunito font-semibold uppercase">
                      {variant.variant_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(variant)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    🗑️
                  </button>
                </div>

                {variant.description && (
                  <p className="text-sm text-gray-700 mb-3 font-nunito">{variant.description}</p>
                )}

                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={variant.preview_image}
                    alt={variant.variant_label}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="bg-white/60 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 font-nunito font-semibold text-xs">CLP</p>
                      <p className="text-lg font-bold text-gray-800">
                        ${formatNumber(variant.price_clp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-nunito font-semibold text-xs">USD</p>
                      <p className="text-lg font-bold text-gray-800">
                        ${formatNumber(variant.price_usd)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(variant)}
                  className="w-full bg-[#E69A9A] hover:bg-[#D88A8A] text-white font-nunito font-bold py-2 rounded-lg transition-all text-sm shadow-md"
                >
                  ✏️ Editar
                </button>
              </div>
            ))}
          </div>

          {variants.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-nunito text-lg mb-2">
                No hay variantes configuradas
              </p>
              <p className="text-gray-400 text-sm">
                Agrega variantes (vistas, estilos, etc.) para este servicio
              </p>
            </div>
          )}
        </div>

        {/* Modal de Edición/Creación de Variante */}
        {showForm && editingVariant && (
          <VariantEditModal
            variant={editingVariant}
            isCreating={isCreating}
            existingVariants={variants}
            serviceId={service.id}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingVariant(null);
              setIsCreating(false);
            }}
          />
        )}

        {/* Modal de Confirmación de Eliminación de Variante */}
        {variantToDelete && (
          <DeleteVariantConfirmModal
            variant={variantToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={() => setVariantToDelete(null)}
          />
        )}
      </div>
    </div>
  );
}

function VariantEditModal({
  variant,
  isCreating,
  existingVariants,
  serviceId,
  onSave,
  onCancel,
}: {
  variant: ServiceVariant;
  isCreating: boolean;
  existingVariants: ServiceVariant[];
  serviceId: string;
  onSave: (data: Partial<ServiceVariant>) => void;
  onCancel: () => void;
}) {
  useModal(true);
  const [selectedVariantOption, setSelectedVariantOption] = useState<string>(
    isCreating ? 'new' : variant.variant_name
  );
  const [newVariantName, setNewVariantName] = useState<string>(
    isCreating ? '' : variant.variant_name
  );

  // Si estamos editando, no permitir cambiar el nombre de la variante
  const isEditing = !isCreating;
  const [formData, setFormData] = useState({
    variant_name: variant.variant_name,
    variant_label: variant.variant_label,
    price_clp: variant.price_clp,
    price_usd: variant.price_usd,
    description: variant.description || '',
    preview_image: variant.preview_image,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariantOptionChange = (value: string) => {
    setSelectedVariantOption(value);
    if (value === 'new') {
      setNewVariantName('');
      setFormData({ ...formData, variant_name: '' });
    } else {
      // Solo usar el nombre de la variante existente, mantener los demás campos del formulario
      setFormData({ ...formData, variant_name: value });
      setNewVariantName('');
    }
  };

  const handleNewVariantNameChange = (value: string) => {
    setNewVariantName(value);
    setFormData({ ...formData, variant_name: value });
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setFormData({ ...formData, preview_image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.preview_image;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `variant-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      if (!imageUrl) {
        alert('La imagen de preview es obligatoria');
        setUploading(false);
        return;
      }

      // Asegurar que variant_name esté definido
      const finalVariantName = selectedVariantOption === 'new'
        ? newVariantName.trim().toLowerCase().replace(/\s+/g, '-')
        : formData.variant_name;

      if (!finalVariantName) {
        alert('Por favor, selecciona una variante existente o escribe el nombre de una nueva');
        setUploading(false);
        return;
      }

      onSave({ ...formData, variant_name: finalVariantName, preview_image: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[var(--sketch-border)] shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 z-10">
          <h3 className="font-patrick text-2xl text-[var(--sketch-border)]">
            {isCreating ? 'Crear Nueva Variante' : `Editar: ${variant.variant_label}`}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre de la Variante (ID) - Selector */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Nombre de la Variante (ID) *
            </label>
            {isEditing ? (
              // Al editar, mostrar solo el nombre (no editable)
              <div className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {variant.variant_name}
                <span className="text-xs text-gray-500 ml-2 font-nunito">(No se puede cambiar al editar)</span>
              </div>
            ) : (
              // Al crear, mostrar selector con opciones
              <>
                <select
                  value={selectedVariantOption}
                  onChange={(e) => handleVariantOptionChange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                  required
                >
                  <option value="">Selecciona una opción...</option>
                  {existingVariants.map((v) => (
                    <option key={v.id} value={v.variant_name}>
                      {v.variant_label} ({v.variant_name})
                    </option>
                  ))}
                  <option value="new">➕ Agregar Nueva Variante</option>
                </select>

                {/* Input para nueva variante */}
                {selectedVariantOption === 'new' && (
                  <div className="mt-3">
                    <label className="block text-sm font-nunito font-semibold text-gray-600 mb-2">
                      Escribe el nombre de la nueva variante (ID):
                    </label>
                    <input
                      type="text"
                      value={newVariantName}
                      onChange={(e) => handleNewVariantNameChange(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      required={selectedVariantOption === 'new'}
                      placeholder="Ej: frontal, perfil, tres-cuartos"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-nunito">
                      Este será el identificador único de la variante (sin espacios, en minúsculas)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Etiqueta de la Variante */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Etiqueta (Texto a mostrar) *
            </label>
            <input
              type="text"
              value={formData.variant_label}
              onChange={(e) => setFormData({ ...formData, variant_label: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required
              placeholder="Ej: Vista Frontal, Vista de Perfil"
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
              placeholder="Describe esta variante..."
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio Adicional (CLP) *
              </label>
              <input
                type="text"
                value={formatNumber(formData.price_clp)}
                onChange={(e) => handlePriceChange('price_clp', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
                required
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Precio adicional sobre el nivel base</p>
            </div>
            <div>
              <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
                Precio Adicional (USD) *
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

          {/* Imagen de Preview */}
          <div>
            <label className="block text-sm font-nunito font-bold text-gray-700 mb-2">
              Imagen de Preview * (Obligatoria)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[var(--sketch-border)] focus:outline-none"
              required={isCreating}
            />
            {(preview || formData.preview_image) && (
              <div className="mt-4 relative">
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={preview || formData.preview_image || ''}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-nunito font-bold text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  Eliminar Imagen
                </button>
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
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-[#E69A9A] hover:bg-[#D88A8A] text-white rounded-lg transition-all font-nunito font-bold shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {uploading ? '⏳ Subiendo...' : isCreating ? '➕ Crear Variante' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteLevelConfirmModal({
  level,
  onConfirm,
  onCancel,
}: {
  level: DetailLevel;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useModal(true);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
    >
      <div
        className="bg-white rounded-lg max-w-md w-full border-2 border-[var(--sketch-border)] shadow-2xl"
      >
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
              Estás a punto de eliminar el nivel:
            </p>
            <p className="text-red-600 font-bold text-lg font-nunito mb-2">
              {level.level_label}
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

function DeleteVariantConfirmModal({
  variant,
  onConfirm,
  onCancel,
}: {
  variant: ServiceVariant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useModal(true);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
    >
      <div
        className="bg-white rounded-lg max-w-md w-full border-2 border-[var(--sketch-border)] shadow-2xl"
      >
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
              Estás a punto de eliminar la variante:
            </p>
            <p className="text-red-600 font-bold text-lg font-nunito mb-2">
              {variant.variant_label}
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
