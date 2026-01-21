-- =============================================
-- SCHEMA PARA PANEL ADMINISTRATIVO k0kho_
-- =============================================

-- Tabla: services (tipos de comisiones)
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  price_clp_min INTEGER NOT NULL,
  price_clp_max INTEGER NOT NULL,
  price_usd_min INTEGER NOT NULL,
  price_usd_max INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: extras (complementos para comisiones)
CREATE TABLE extras (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  price_clp INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  only_for TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: gallery (trabajos del portafolio)
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  service_type TEXT,
  order_index INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: rules (reglas permitidas/no permitidas)
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para mejorar rendimiento
CREATE INDEX idx_services_available ON services(is_available, order_index);
CREATE INDEX idx_extras_available ON extras(is_available, order_index);
CREATE INDEX idx_gallery_visible ON gallery(is_visible, order_index);
CREATE INDEX idx_rules_type ON rules(is_allowed, order_index);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para services
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para extras
CREATE TRIGGER update_extras_updated_at
BEFORE UPDATE ON extras
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES (migración desde JSON)
-- =============================================

-- Insertar services
INSERT INTO services (id, title, image, price_clp_min, price_clp_max, price_usd_min, price_usd_max, category, description, order_index) VALUES
('icon', 'Icon / Headshot', '/dibujo1.webp', 12000, 15000, 15, 20, 'Básica', 'Dibujo de rostro o busto', 1),
('chibi', 'Chibi (Full Body)', '/dibujo2_1.webp', 18000, 20000, 25, 30, 'Especial', 'Personaje chibi completo', 2),
('halfbody', 'Half Body', '/dibujo3.webp', 25000, 28000, 35, 40, 'Estándar', 'Dibujo de medio cuerpo', 3),
('fullbody', 'Full Body', '/dibujo4_1.jpg', 40000, 45000, 55, 60, 'Premium', 'Dibujo de cuerpo completo', 4);

-- Insertar extras
INSERT INTO extras (id, title, description, icon, price_clp, price_usd, only_for, order_index) VALUES
('background-simple', 'Fondo Simple', 'Color sólido o degradado', '🎨', 3000, 5, '{"icon","chibi","halfbody","fullbody"}', 1),
('background-detailed', 'Fondo Detallado', 'Escenario completo con elementos', '🖼️', 15000, 20, '{"halfbody","fullbody"}', 2),
('extra-character', 'Personaje Extra', 'Agrega otro personaje completo', '👥', 20000, 25, '{"chibi","halfbody","fullbody"}', 3),
('props', 'Props/Accesorios', 'Objetos adicionales (armas, etc.)', '⚔️', 5000, 8, '{"icon","chibi","halfbody","fullbody"}', 4),
('outfit-change', 'Cambio de Outfit', 'Versión con ropa diferente', '👗', 8000, 12, '{"chibi","halfbody","fullbody"}', 5),
('expression-sheet', 'Hoja de Expresiones', '3-5 expresiones faciales', '😊', 12000, 18, '{"icon","chibi"}', 6);

-- Insertar gallery
INSERT INTO gallery (image_url, title, description, service_type, order_index) VALUES
('/dibujo1.webp', 'Icon Example 1', 'Estilo anime colorido', 'icon', 1),
('/dibujo2_1.webp', 'Chibi Example 1', 'Chibi kawaii', 'chibi', 2),
('/dibujo2_2.webp', 'Chibi Example 2', 'Chibi con props', 'chibi', 3),
('/dibujo3.webp', 'Half Body Example', 'Medio cuerpo detallado', 'halfbody', 4),
('/dibujo4_1.jpg', 'Full Body Example 1', 'Cuerpo completo', 'fullbody', 5),
('/dibujo4_2.jpg', 'Full Body Example 2', 'Con fondo simple', 'fullbody', 6);

-- Insertar rules
INSERT INTO rules (text, is_allowed, icon, order_index) VALUES
('Personajes/OC', true, '🎨', 1),
('Fanarts', true, '⭐', 2),
('Shipps', true, '💕', 3),
('Personas adaptadas', true, '👤', 4),
('Furros', true, '🦊', 5),
('NSFW (+18)', false, '🔞', 6),
('Gore', false, '🩸', 7),
('Copias de estilo', false, '🚫', 8),
('Robots/Mechas', false, '🤖', 9),
('Fondos complejos', false, '🏔️', 10),
('Realismo', false, '📷', 11);

-- =============================================
-- CONFIGURACIÓN DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "Public read access for services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read access for extras" ON extras FOR SELECT USING (true);
CREATE POLICY "Public read access for gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Public read access for rules" ON rules FOR SELECT USING (true);

-- Políticas: Solo admin autenticado puede modificar
-- (Necesitarás configurar autenticación de admin en Supabase)
CREATE POLICY "Admin full access for services" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for extras" ON extras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for rules" ON rules FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- STORAGE BUCKET PARA IMÁGENES
-- =============================================

-- Crear bucket para imágenes del portafolio
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true);

-- Política: Lectura pública de imágenes
CREATE POLICY "Public read access for gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');

-- Política: Solo admin puede subir/eliminar
CREATE POLICY "Admin upload access for gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');
CREATE POLICY "Admin delete access for gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');
