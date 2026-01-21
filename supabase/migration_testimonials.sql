-- =============================================
-- MIGRACIÓN: Sistema de Testimonios/Feedback
-- =============================================

-- Tabla: testimonials (comentarios y valoraciones de clientes)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_avatar TEXT, -- URL de avatar del cliente (opcional)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Valoración de 1 a 5 estrellas
  comment TEXT NOT NULL,
  gallery_item_id UUID REFERENCES gallery(id) ON DELETE SET NULL, -- Trabajo relacionado (opcional)
  service_type TEXT, -- Tipo de servicio (icon, chibi, etc.)
  is_featured BOOLEAN DEFAULT false, -- Si es destacado
  is_visible BOOLEAN DEFAULT true, -- Si se muestra públicamente
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_testimonials_visible ON testimonials(is_visible, order_index);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured, is_visible);
CREATE INDEX IF NOT EXISTS idx_testimonials_gallery ON testimonials(gallery_item_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_service ON testimonials(service_type);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON testimonials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública solo de testimonios visibles
CREATE POLICY "Public read access for visible testimonials" ON testimonials 
  FOR SELECT USING (is_visible = true);

-- Políticas: Solo admin puede modificar
CREATE POLICY "Admin full access for testimonials" ON testimonials 
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES: Testimonios de Ejemplo
-- =============================================

-- Testimonios destacados
INSERT INTO testimonials (client_name, client_avatar, rating, comment, service_type, is_featured, is_visible, order_index) VALUES
('María González', NULL, 5, '¡Increíble trabajo! El chibi quedó exactamente como lo imaginé. Muy profesional y atenta a los detalles. Definitivamente volveré a encargar más trabajos.', 'chibi', true, true, 1),
('Carlos Ramírez', NULL, 5, 'El full body que me hizo es espectacular. La atención al detalle y los colores son perfectos. Super recomendado!', 'fullbody', true, true, 2),
('Ana Martínez', NULL, 5, 'Mi icon quedó hermoso! El proceso fue muy claro y la artista fue muy paciente con mis cambios. Excelente servicio.', 'icon', true, true, 3),
('Luis Fernández', NULL, 4, 'Muy contento con mi half body. El estilo anime es perfecto y la entrega fue puntual. Sin duda volveré.', 'halfbody', true, true, 4),
('Sofía López', NULL, 5, 'El nivel de detalle en el trabajo premium es impresionante. Vale cada peso. La mejor artista que he conocido!', 'fullbody', true, true, 5);
