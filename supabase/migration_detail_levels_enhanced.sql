-- =============================================
-- MIGRACIÓN: Mejoras a Niveles de Detalle
-- Agregar campos para qué incluye y recomendaciones
-- =============================================

-- Agregar columna "includes" (qué incluye cada nivel)
ALTER TABLE service_detail_levels 
ADD COLUMN IF NOT EXISTS includes TEXT;

-- Agregar columna "recommendations" (recomendaciones según uso)
ALTER TABLE service_detail_levels 
ADD COLUMN IF NOT EXISTS recommendations TEXT[] DEFAULT '{}';

-- Actualizar datos existentes con información de ejemplo
UPDATE service_detail_levels 
SET includes = 'Rostro básico con colores planos, sin sombras complejas'
WHERE level_name = 'simple' AND service_id = 'icon';

UPDATE service_detail_levels 
SET includes = 'Rostro con sombras suaves, detalles en ojos y cabello, colores con gradientes'
WHERE level_name = 'detallado' AND service_id = 'icon';

UPDATE service_detail_levels 
SET includes = 'Máximo detalle con efectos de iluminación, texturas, acabados profesionales y efectos especiales'
WHERE level_name = 'premium' AND service_id = 'icon';

-- Agregar recomendaciones de ejemplo
UPDATE service_detail_levels 
SET recommendations = ARRAY['Perfil de redes sociales', 'Avatar básico', 'Uso personal']
WHERE level_name = 'simple' AND service_id = 'icon';

UPDATE service_detail_levels 
SET recommendations = ARRAY['Perfil profesional', 'Portada de perfil', 'Uso comercial básico']
WHERE level_name = 'detallado' AND service_id = 'icon';

UPDATE service_detail_levels 
SET recommendations = ARRAY['Portada premium', 'Material promocional', 'Uso comercial avanzado', 'Arte de colección']
WHERE level_name = 'premium' AND service_id = 'icon';
