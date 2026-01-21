-- =============================================
-- MIGRACIÓN: Agregar Pack Emotes como Servicio
-- =============================================

-- Insertar el nuevo servicio "Pack Emotes"
INSERT INTO services (id, title, image, price_clp_min, price_clp_max, price_usd_min, price_usd_max, category, description, order_index, is_available) 
VALUES (
  'pack-emotes',
  'Pack Emotes',
  '/dibujo1.webp', -- Imagen de ejemplo (puedes cambiarla desde el admin)
  16000,
  18000,
  20,
  25,
  'Especial',
  'Pack de 5 emotes personalizados para Twitch, Discord u otras plataformas. Incluye diferentes expresiones y estados de ánimo de tu personaje.',
  5, -- Después de Full Body
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  image = EXCLUDED.image,
  price_clp_min = EXCLUDED.price_clp_min,
  price_clp_max = EXCLUDED.price_clp_max,
  price_usd_min = EXCLUDED.price_usd_min,
  price_usd_max = EXCLUDED.price_usd_max,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_available = EXCLUDED.is_available,
  updated_at = NOW();

-- Opcional: Agregar niveles de detalle para Pack Emotes
INSERT INTO service_detail_levels (service_id, level_name, level_label, price_clp, price_usd, description, includes, recommendations, order_index, is_available)
VALUES
  ('pack-emotes', 'simple', 'Simple', 16000, 20, 'Emotes básicos con colores planos y expresiones simples', '5 emotes básicos, colores planos, sin efectos complejos', ARRAY['Streamers principiantes', 'Uso personal', 'Discord'], 1, true),
  ('pack-emotes', 'detallado', 'Detallado', 17000, 22, 'Emotes con más detalle y expresiones variadas', '5 emotes detallados, sombras suaves, expresiones variadas', ARRAY['Streamers activos', 'Uso profesional', 'Twitch'], 2, true),
  ('pack-emotes', 'premium', 'Premium', 18000, 25, 'Emotes premium con máximo detalle y efectos', '5 emotes premium, efectos especiales, máximo detalle, animaciones sugeridas', ARRAY['Streamers profesionales', 'Marca personal', 'Uso comercial'], 3, true)
ON CONFLICT DO NOTHING;

-- Opcional: Agregar variantes para Pack Emotes (diferentes cantidades)
INSERT INTO service_variants (service_id, variant_name, variant_label, price_clp, price_usd, description, preview_image, order_index, is_available)
VALUES
  ('pack-emotes', 'pack-5', 'Pack de 5 Emotes', 0, 0, 'Pack estándar con 5 emotes', '/dibujo1.webp', 1, true),
  ('pack-emotes', 'pack-7', 'Pack de 7 Emotes', 5000, 7, 'Pack extendido con 7 emotes (2 adicionales)', '/dibujo1.webp', 2, true),
  ('pack-emotes', 'pack-10', 'Pack de 10 Emotes', 10000, 12, 'Pack completo con 10 emotes (5 adicionales)', '/dibujo1.webp', 3, true)
ON CONFLICT DO NOTHING;

-- Agregar extras específicos para Pack Emotes
INSERT INTO extras (id, title, description, icon, price_clp, price_usd, only_for, order_index, is_available) 
VALUES
  ('emote-extra', 'Emote Adicional', 'Agrega 1 emote extra al pack', '➕', 3000, 5, '{"pack-emotes"}', 1, true),
  ('emote-animated', 'Versión Animada', 'Convierte todos los emotes en versión animada (GIF)', '✨', 15000, 20, '{"pack-emotes"}', 2, true),
  ('emote-variations', 'Variaciones de Color', 'Agrega 2 variaciones de color por emote', '🎨', 8000, 12, '{"pack-emotes"}', 3, true),
  ('emote-platforms', 'Múltiples Plataformas', 'Versiones optimizadas para Twitch, Discord y BTTV', '🌐', 5000, 8, '{"pack-emotes"}', 4, true),
  ('emote-expressions', 'Expresiones Extra', 'Agrega 3 expresiones adicionales al pack', '😊', 10000, 15, '{"pack-emotes"}', 5, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  price_clp = EXCLUDED.price_clp,
  price_usd = EXCLUDED.price_usd,
  only_for = EXCLUDED.only_for,
  order_index = EXCLUDED.order_index,
  is_available = EXCLUDED.is_available,
  updated_at = NOW();
