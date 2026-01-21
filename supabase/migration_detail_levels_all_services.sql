-- =============================================
-- MIGRACIÓN: Agregar includes y recommendations a todos los servicios
-- =============================================

-- Asegurar que las columnas existan
ALTER TABLE service_detail_levels 
ADD COLUMN IF NOT EXISTS includes TEXT;

ALTER TABLE service_detail_levels 
ADD COLUMN IF NOT EXISTS recommendations TEXT[] DEFAULT '{}';

-- =============================================
-- CHIBI (Full Body)
-- =============================================

-- Simple
UPDATE service_detail_levels 
SET 
  includes = 'Chibi básico con colores planos, sin sombras complejas, diseño simple y kawaii',
  recommendations = ARRAY['Streamers principiantes', 'Uso personal', 'Discord', 'Perfil de redes sociales']
WHERE level_name = 'simple' AND service_id = 'chibi';

-- Detallado
UPDATE service_detail_levels 
SET 
  includes = 'Chibi con sombras suaves, detalles en expresión y pose, colores con gradientes, efectos básicos',
  recommendations = ARRAY['Streamers activos', 'Uso profesional', 'Twitch', 'Contenido regular']
WHERE level_name = 'detallado' AND service_id = 'chibi';

-- Premium
UPDATE service_detail_levels 
SET 
  includes = 'Chibi premium con máximo detalle, efectos de iluminación, texturas, acabados profesionales y efectos especiales',
  recommendations = ARRAY['Streamers profesionales', 'Marca personal', 'Uso comercial', 'Arte de colección']
WHERE level_name = 'premium' AND service_id = 'chibi';

-- =============================================
-- HALF BODY
-- =============================================

-- Simple
UPDATE service_detail_levels 
SET 
  includes = 'Medio cuerpo básico con colores planos, sin sombras complejas, pose simple',
  recommendations = ARRAY['Perfil de redes sociales', 'Avatar básico', 'Uso personal']
WHERE level_name = 'simple' AND service_id = 'halfbody';

-- Detallado
UPDATE service_detail_levels 
SET 
  includes = 'Medio cuerpo con sombras suaves, detalles en ropa y accesorios, colores con gradientes, expresión variada',
  recommendations = ARRAY['Perfil profesional', 'Portada de perfil', 'Uso comercial básico', 'Contenido regular']
WHERE level_name = 'detallado' AND service_id = 'halfbody';

-- Premium
UPDATE service_detail_levels 
SET 
  includes = 'Medio cuerpo premium con máximo detalle, efectos de iluminación, texturas en ropa, acabados profesionales y efectos especiales',
  recommendations = ARRAY['Portada premium', 'Material promocional', 'Uso comercial avanzado', 'Arte de colección']
WHERE level_name = 'premium' AND service_id = 'halfbody';

-- =============================================
-- FULL BODY
-- =============================================

-- Simple
UPDATE service_detail_levels 
SET 
  includes = 'Cuerpo completo básico con colores planos, sin sombras complejas, pose simple',
  recommendations = ARRAY['Perfil de redes sociales', 'Avatar básico', 'Uso personal']
WHERE level_name = 'simple' AND service_id = 'fullbody';

-- Detallado
UPDATE service_detail_levels 
SET 
  includes = 'Cuerpo completo con sombras suaves, detalles en ropa, accesorios y pose, colores con gradientes, expresión variada',
  recommendations = ARRAY['Perfil profesional', 'Portada de perfil', 'Uso comercial básico', 'Contenido regular']
WHERE level_name = 'detallado' AND service_id = 'fullbody';

-- Premium
UPDATE service_detail_levels 
SET 
  includes = 'Cuerpo completo premium con máximo detalle, efectos de iluminación, texturas en ropa y accesorios, acabados profesionales, efectos especiales y composición avanzada',
  recommendations = ARRAY['Portada premium', 'Material promocional', 'Uso comercial avanzado', 'Arte de colección', 'Ilustración profesional']
WHERE level_name = 'premium' AND service_id = 'fullbody';

-- =============================================
-- ICON / HEADSHOT (si no tiene datos)
-- =============================================

-- Asegurar que Icon también tenga los datos actualizados
UPDATE service_detail_levels 
SET 
  includes = 'Rostro básico con colores planos, sin sombras complejas',
  recommendations = ARRAY['Perfil de redes sociales', 'Avatar básico', 'Uso personal']
WHERE level_name = 'simple' AND service_id = 'icon' AND (includes IS NULL OR recommendations IS NULL OR array_length(recommendations, 1) IS NULL);

UPDATE service_detail_levels 
SET 
  includes = 'Rostro con sombras suaves, detalles en ojos y cabello, colores con gradientes',
  recommendations = ARRAY['Perfil profesional', 'Portada de perfil', 'Uso comercial básico']
WHERE level_name = 'detallado' AND service_id = 'icon' AND (includes IS NULL OR recommendations IS NULL OR array_length(recommendations, 1) IS NULL);

UPDATE service_detail_levels 
SET 
  includes = 'Máximo detalle con efectos de iluminación, texturas, acabados profesionales y efectos especiales',
  recommendations = ARRAY['Portada premium', 'Material promocional', 'Uso comercial avanzado', 'Arte de colección']
WHERE level_name = 'premium' AND service_id = 'icon' AND (includes IS NULL OR recommendations IS NULL OR array_length(recommendations, 1) IS NULL);
