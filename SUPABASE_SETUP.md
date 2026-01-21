# 🎨 Configuración de Supabase para k0kho_ Portfolio

## 📋 Pasos para Configurar

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales (URL y API Key)

### 2. Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido completo de `supabase/schema.sql`
4. Ejecuta el script (esto creará todas las tablas, índices, triggers y datos iniciales)

### 3. Configurar Variables de Entorno

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Completa las variables en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_aqui
   ```

3. Obtén estas claves desde:
   - Dashboard de Supabase → Settings → API
   - **URL**: Project URL
   - **ANON KEY**: `anon` / `public` key
   - **SERVICE ROLE KEY**: `service_role` key (⚠️ mantén esta clave privada)

### 4. Configurar Autenticación

1. En Supabase Dashboard → Authentication → Providers
2. Habilita **Email** como método de autenticación
3. Crea un usuario administrador:
   - Ve a Authentication → Users
   - Click en "Add User"
   - Email: tu-email@ejemplo.com
   - Password: tu-contraseña-segura
   - ✅ Marca "Auto Confirm User"

### 5. Configurar Storage para Imágenes

El script SQL ya configuró el bucket `gallery-images`. Solo verifica que:

1. Ve a Storage → gallery-images
2. Verifica que el bucket sea **público**
3. Las políticas de acceso ya están configuradas (lectura pública, escritura solo para admins)

### 6. Reiniciar el Servidor de Desarrollo

```bash
pnpm dev
```

## 🚀 Acceso al Panel Administrativo

Una vez configurado:

1. Accede a: `http://localhost:3000/admin`
2. Inicia sesión con el email y contraseña que creaste
3. Serás redirigido a `/admin/dashboard`

## 📊 Estructura del Panel Admin

### Dashboard (`/admin/dashboard`)
- Vista general con estadísticas
- Acceso rápido a todas las secciones

### Servicios (`/admin/dashboard/services`)
- Editar precios (CLP y USD)
- Modificar descripciones
- Habilitar/deshabilitar servicios
- No se pueden crear ni eliminar (son 4 fijos: Icon, Chibi, Half Body, Full Body)

### Extras (`/admin/dashboard/extras`)
- Editar precios y descripciones
- Cambiar iconos
- Definir a qué servicios aplica cada extra
- Habilitar/deshabilitar extras

### Galería (`/admin/dashboard/gallery`)
- **Subir nuevas imágenes** (se almacenan en Supabase Storage)
- Agregar título, descripción y categoría
- Marcar como visible/oculto
- Eliminar imágenes (elimina de la DB y del Storage)

### Reglas (`/admin/dashboard/rules`)
- **Crear nuevas reglas**
- Editar texto e icono
- Cambiar entre "Permitido" y "Prohibido"
- Reordenar reglas
- Eliminar reglas

## 🔒 Seguridad

- **Row Level Security (RLS)** está habilitado en todas las tablas
- Los visitantes pueden **leer** datos públicos
- Solo usuarios **autenticados** pueden modificar datos
- Las claves del `.env.local` **NO** deben compartirse públicamente

## ⚠️ Notas Importantes

1. **Datos Iniciales**: El script SQL ya migró todos los datos de los archivos JSON. Puedes eliminar los archivos JSON si lo deseas, aunque se recomienda mantenerlos como respaldo.

2. **Imágenes Existentes**: Las imágenes en `/public` seguirán funcionando. Las nuevas imágenes que subas desde el panel admin se almacenarán en Supabase Storage.

3. **Migración del Frontend**: Actualmente el sitio público sigue usando los archivos JSON. Para que use Supabase, necesitarás actualizar los componentes para usar los hooks personalizados (`useServices`, `useExtras`, `useGallery`, `useRules`).

## 🛠️ Próximos Pasos (Opcional)

Si quieres que el sitio público también use Supabase en lugar de los JSON:

1. Actualizar `Gallery.tsx` para usar `useServices()` en lugar de `import services from '@/data/services.json'`
2. Actualizar `CommissionModal.tsx` para usar `useExtras()`
3. Actualizar `CartButton.tsx` para usar `useRules()`
4. Eliminar las importaciones de JSON y los archivos en `/src/data/`

## 📞 Soporte

Si tienes problemas:
- Revisa los logs de Supabase en Dashboard → Logs
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el usuario admin esté confirmado en Authentication → Users
