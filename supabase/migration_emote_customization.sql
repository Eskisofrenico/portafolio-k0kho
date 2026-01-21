-- =============================================
-- MIGRACIÓN: Configuración de Personalización de Emotes
-- =============================================

-- Tabla: emote_extra_availability
-- Permite configurar qué extras están disponibles para cada emote específico
-- Si un extra no está en esta tabla, estará disponible para todos los emotes del pack
CREATE TABLE IF NOT EXISTS emote_extra_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_id TEXT NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  emote_number INTEGER NOT NULL CHECK (emote_number >= 1 AND emote_number <= 20),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(extra_id, emote_number)
);

-- Tabla: emote_config
-- Permite configurar información personalizada para cada emote
CREATE TABLE IF NOT EXISTS emote_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  emote_number INTEGER NOT NULL CHECK (emote_number >= 1 AND emote_number <= 20),
  custom_label TEXT, -- Etiqueta personalizada (ej: "Emote Feliz", "Emote Triste")
  description TEXT, -- Descripción opcional del emote
  preview_image TEXT, -- Imagen de preview opcional
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, emote_number)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_emote_extra_availability_extra ON emote_extra_availability(extra_id);
CREATE INDEX IF NOT EXISTS idx_emote_extra_availability_emote ON emote_extra_availability(emote_number);
CREATE INDEX IF NOT EXISTS idx_emote_config_service ON emote_config(service_id);
CREATE INDEX IF NOT EXISTS idx_emote_config_active ON emote_config(is_active, order_index);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_emote_extra_availability_updated_at
BEFORE UPDATE ON emote_extra_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emote_config_updated_at
BEFORE UPDATE ON emote_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE emote_extra_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE emote_config ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "Public read access for emote_extra_availability" 
ON emote_extra_availability FOR SELECT USING (true);

CREATE POLICY "Public read access for emote_config" 
ON emote_config FOR SELECT USING (true);

-- Políticas: Solo admin autenticado puede modificar
CREATE POLICY "Admin full access for emote_extra_availability" 
ON emote_extra_availability FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for emote_config" 
ON emote_config FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES (Opcional)
-- =============================================

-- Configuración por defecto para pack-emotes
-- Esto permite tener etiquetas personalizadas para cada emote
INSERT INTO emote_config (service_id, emote_number, custom_label, description, is_active, order_index)
VALUES
  ('pack-emotes', 1, 'Emote 1', 'Primer emote del pack', true, 1),
  ('pack-emotes', 2, 'Emote 2', 'Segundo emote del pack', true, 2),
  ('pack-emotes', 3, 'Emote 3', 'Tercer emote del pack', true, 3),
  ('pack-emotes', 4, 'Emote 4', 'Cuarto emote del pack', true, 4),
  ('pack-emotes', 5, 'Emote 5', 'Quinto emote del pack', true, 5)
ON CONFLICT (service_id, emote_number) DO NOTHING;

-- Nota: Por defecto, todos los extras con only_for = ['pack-emotes'] 
-- estarán disponibles para todos los emotes.
-- Si quieres restringir un extra a ciertos emotes, agrega registros en emote_extra_availability
-- Ejemplo: Si quieres que 'emote-animated' solo esté disponible para los emotes 1, 2 y 3:
-- INSERT INTO emote_extra_availability (extra_id, emote_number, is_available)
-- VALUES
--   ('emote-animated', 1, true),
--   ('emote-animated', 2, true),
--   ('emote-animated', 3, true);
