-- =============================================
-- MIGRACIÓN: Niveles de Detalle para Servicios
-- =============================================

-- Tabla: service_detail_levels (niveles de detalle)
CREATE TABLE IF NOT EXISTS service_detail_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  level_name TEXT NOT NULL, -- 'simple', 'detallado', 'premium'
  level_label TEXT NOT NULL, -- 'Simple', 'Detallado', 'Premium'
  price_clp INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  description TEXT,
  example_image TEXT,
  order_index INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_detail_levels_service ON service_detail_levels(service_id, order_index);
CREATE INDEX IF NOT EXISTS idx_detail_levels_available ON service_detail_levels(is_available);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_detail_levels_updated_at
BEFORE UPDATE ON service_detail_levels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE service_detail_levels ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "Public read access for detail levels" ON service_detail_levels FOR SELECT USING (true);

-- Políticas: Solo admin puede modificar
CREATE POLICY "Admin full access for detail levels" ON service_detail_levels FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES: Niveles de Detalle
-- =============================================

-- Niveles para Icon / Headshot
INSERT INTO service_detail_levels (service_id, level_name, level_label, price_clp, price_usd, description, order_index) VALUES
('icon', 'simple', 'Simple', 12000, 15, 'Rostro básico con colores planos', 1),
('icon', 'detallado', 'Detallado', 15000, 20, 'Rostro con sombras y detalles adicionales', 2),
('icon', 'premium', 'Premium', 18000, 25, 'Máximo detalle con efectos y acabados profesionales', 3);

-- Niveles para Chibi
INSERT INTO service_detail_levels (service_id, level_name, level_label, price_clp, price_usd, description, order_index) VALUES
('chibi', 'simple', 'Simple', 18000, 25, 'Chibi básico con colores planos', 1),
('chibi', 'detallado', 'Detallado', 20000, 30, 'Chibi con sombras y detalles', 2),
('chibi', 'premium', 'Premium', 25000, 35, 'Chibi premium con efectos y acabados especiales', 3);

-- Niveles para Half Body
INSERT INTO service_detail_levels (service_id, level_name, level_label, price_clp, price_usd, description, order_index) VALUES
('halfbody', 'simple', 'Simple', 25000, 35, 'Medio cuerpo básico', 1),
('halfbody', 'detallado', 'Detallado', 28000, 40, 'Medio cuerpo con detalles y sombras', 2),
('halfbody', 'premium', 'Premium', 35000, 50, 'Medio cuerpo premium con máximo detalle', 3);

-- Niveles para Full Body
INSERT INTO service_detail_levels (service_id, level_name, level_label, price_clp, price_usd, description, order_index) VALUES
('fullbody', 'simple', 'Simple', 40000, 55, 'Cuerpo completo básico', 1),
('fullbody', 'detallado', 'Detallado', 45000, 60, 'Cuerpo completo con detalles', 2),
('fullbody', 'premium', 'Premium', 55000, 75, 'Cuerpo completo premium con máximo detalle', 3);
