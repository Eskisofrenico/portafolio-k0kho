-- =============================================
-- MIGRACIÓN: Sistema de Temas/Festivos para Comisiones
-- =============================================

-- Tabla: commission_themes (temas/festivos predefinidos)
CREATE TABLE IF NOT EXISTS commission_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_commission_themes_available ON commission_themes(is_available, order_index);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_commission_themes_updated_at
BEFORE UPDATE ON commission_themes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE commission_themes ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "Public read access for commission_themes" 
ON commission_themes FOR SELECT USING (is_available = true);

-- Políticas: Solo admin puede modificar
CREATE POLICY "Admin full access for commission_themes" 
ON commission_themes FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES: Temas/Festivos
-- =============================================

INSERT INTO commission_themes (id, name, icon, description, order_index, is_available) VALUES
('navidad', 'Navidad', '🎄', 'Tema navideño con decoraciones, colores rojos y verdes, nieve', 1, true),
('halloween', 'Halloween', '🎃', 'Tema de Halloween con calabazas, fantasmas, colores naranjas y negros', 2, true),
('san-valentin', 'San Valentín', '💕', 'Tema romántico con corazones, rosas, colores rosados y rojos', 3, true),
('cumpleanos', 'Cumpleaños', '🎂', 'Tema de cumpleaños con globos, confeti, pasteles', 4, true),
('verano', 'Verano', '☀️', 'Tema veraniego con playa, sol, colores brillantes', 5, true),
('invierno', 'Invierno', '❄️', 'Tema invernal con nieve, abrigos, colores fríos', 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_available = EXCLUDED.is_available,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();
