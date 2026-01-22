-- Migración: Tabla de Configuración del Sitio
-- Para almacenar configuraciones como el banner de anuncio

-- Crear tabla site_settings
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial del banner de anuncio
INSERT INTO site_settings (key, value, is_active) 
VALUES ('announcement_message', '¡Comisiones abiertas! 🎨 Consulta mis precios y servicios', true)
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (para mostrar el banner)
CREATE POLICY "Configuración visible públicamente" 
ON site_settings FOR SELECT 
USING (true);

-- Política de escritura para usuarios autenticados (admin)
CREATE POLICY "Solo admin puede modificar configuración" 
ON site_settings FOR ALL 
USING (true);

-- Índice para búsqueda por clave
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();
