-- =============================================
-- MIGRACIÓN: Sistema de Variantes para Servicios
-- =============================================

-- Tabla: service_variants (variantes de servicios)
CREATE TABLE IF NOT EXISTS service_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- Nombre de la variante (ej: "Frontal", "Perfil", "3/4")
  variant_label TEXT NOT NULL, -- Etiqueta para mostrar (ej: "Vista Frontal", "Vista de Perfil")
  price_clp INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  description TEXT,
  preview_image TEXT NOT NULL, -- Imagen de preview de la variante
  order_index INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_variants_service ON service_variants(service_id, order_index);
CREATE INDEX IF NOT EXISTS idx_variants_available ON service_variants(is_available);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_variants_updated_at
BEFORE UPDATE ON service_variants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE service_variants ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "Public read access for variants" ON service_variants FOR SELECT USING (true);

-- Políticas: Solo admin puede modificar
CREATE POLICY "Admin full access for variants" ON service_variants FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES: Variantes de Ejemplo
-- =============================================

-- Variantes para Icon / Headshot
INSERT INTO service_variants (service_id, variant_name, variant_label, price_clp, price_usd, description, preview_image, order_index) VALUES
('icon', 'frontal', 'Vista Frontal', 0, 0, 'Vista frontal del rostro', '/dibujo1.webp', 1),
('icon', 'perfil', 'Vista de Perfil', 2000, 3, 'Vista lateral del rostro', '/dibujo1.webp', 2),
('icon', 'tres-cuartos', 'Vista 3/4', 3000, 5, 'Vista de tres cuartos', '/dibujo1.webp', 3);

-- Variantes para Chibi
INSERT INTO service_variants (service_id, variant_name, variant_label, price_clp, price_usd, description, preview_image, order_index) VALUES
('chibi', 'frontal', 'Vista Frontal', 0, 0, 'Chibi visto de frente', '/dibujo2_1.webp', 1),
('chibi', 'lateral', 'Vista Lateral', 2000, 3, 'Chibi visto de lado', '/dibujo2_1.webp', 2),
('chibi', 'tres-cuartos', 'Vista 3/4', 3000, 5, 'Chibi visto de tres cuartos', '/dibujo2_1.webp', 3);

-- Variantes para Half Body
INSERT INTO service_variants (service_id, variant_name, variant_label, price_clp, price_usd, description, preview_image, order_index) VALUES
('halfbody', 'frontal', 'Vista Frontal', 0, 0, 'Medio cuerpo visto de frente', '/dibujo3.webp', 1),
('halfbody', 'lateral', 'Vista Lateral', 3000, 5, 'Medio cuerpo visto de lado', '/dibujo3.webp', 2),
('halfbody', 'tres-cuartos', 'Vista 3/4', 4000, 7, 'Medio cuerpo visto de tres cuartos', '/dibujo3.webp', 3);

-- Variantes para Full Body
INSERT INTO service_variants (service_id, variant_name, variant_label, price_clp, price_usd, description, preview_image, order_index) VALUES
('fullbody', 'frontal', 'Vista Frontal', 0, 0, 'Cuerpo completo visto de frente', '/dibujo4_1.jpg', 1),
('fullbody', 'lateral', 'Vista Lateral', 5000, 8, 'Cuerpo completo visto de lado', '/dibujo4_1.jpg', 2),
('fullbody', 'tres-cuartos', 'Vista 3/4', 6000, 10, 'Cuerpo completo visto de tres cuartos', '/dibujo4_1.jpg', 3);
