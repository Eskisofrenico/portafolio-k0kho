-- =============================================
-- MIGRACIÓN: Permitir inserción pública de testimonios
-- Los testimonios públicos se crean con is_visible = false
-- para que el admin los apruebe antes de mostrarlos
-- =============================================

-- Política: Permitir inserción pública (solo con is_visible = false)
CREATE POLICY "Public insert testimonials (pending approval)" ON testimonials 
  FOR INSERT 
  WITH CHECK (
    is_visible = false AND 
    is_featured = false
  );

-- Función para asegurar que los testimonios públicos siempre se crean como no visibles
CREATE OR REPLACE FUNCTION ensure_testimonial_pending_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no hay sesión de autenticación, forzar is_visible = false
  IF auth.role() IS NULL OR auth.role() = 'anon' THEN
    NEW.is_visible := false;
    NEW.is_featured := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicar la función antes de insertar
CREATE TRIGGER ensure_testimonial_pending_approval_trigger
BEFORE INSERT ON testimonials
FOR EACH ROW
EXECUTE FUNCTION ensure_testimonial_pending_approval();
