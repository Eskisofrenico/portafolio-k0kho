-- Agrupar varias imágenes en una misma entrada de galería.
-- group_id = id del primer ítem del grupo (o del único ítem si es solo uno).

ALTER TABLE gallery ADD COLUMN IF NOT EXISTS group_id UUID;

-- Cada fila existente forma su propio grupo (group_id = id).
UPDATE gallery SET group_id = id WHERE group_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_group_id ON gallery(group_id);
