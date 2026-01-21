# Instructivo de Desarrollo: Portafolio & Comisiones "k0kho_"

## 1. Concepto y Objetivos
Crear una "Casa Digital" para la artista que funcione como un **filtro de ventas automático**.
* **Estética:** Cuaderno de dibujo / Sketchbook (Grid background).
* **Meta:** Que el cliente llegue al WhatsApp sabiendo **qué quiere, cuánto cuesta y qué NO debe pedir**.
* **Tech Stack:** Next.js (App Router), Tailwind CSS, Cloudflare Pages.

---

## 2. Sistema de Diseño (Design Tokens)
Basado en las referencias visuales del artista.

### Paleta de Colores
Configurar en `tailwind.config.ts`:
* **Fondo (Papel):** `#FFFDF6` (Crema suave).
* **Líneas Grid:** `#F2DEDE` (Rosa pálido) o `#E8E8E8`.
* **Texto Principal:** `#5D4037` (Café oscuro/Sepia - No usar negro puro).
* **Acento Marca:** `#E69A9A` (Rosa viejo/desaturado).
* **Semáforo de Reglas:**
    * ✅ **Si Dibujo (Verde):** `#A3CFA1`.
    * ❌ **No Dibujo (Rojo):** `#D87A7A`.

### Tipografía
* **Títulos/Headers:** Fuente "Handwritten" (ej: *Patrick Hand*, *Indie Flower* o *Fredoka*).
* **Cuerpo/Legibilidad:** Fuente Sans Serif redondeada (ej: *Varela Round* o *Nunito*).

### Estilos Globales (CSS)
* **Fondo:** Implementar `background-image` con gradientes lineales para simular la cuadrícula de cuaderno sin usar imágenes pesadas.
* **Bordes:** Usar `border-radius` irregulares para simular trazos a mano alzada en las tarjetas y botones.

---

## 3. Arquitectura de Datos (JSON)
Para mantener el sitio sin tocar código, centraliza la información en `src/data/`.

### `services.json` (El Catálogo)
Estructura para los productos (Icon, Chibi, Full Body, YCH):
* `id`: Identificador único.
* `title`: Nombre del servicio.
* `image`: Ruta de la foto.
* `priceCLP`: Valor en pesos.
* `priceUSD`: Valor en dólares.
* `category`: Etiqueta para filtrar (ej: "YCH", "Commission").

### `rules.json` (El Filtro)
Basado explícitamente en la lista de reglas:
* **Allowed (Green):** ["Personajes/OC", "Fanarts", "Shipps", "Personas adaptadas", "Furros"].
* **Forbidden (Red):** ["NSFW (+18)", "Gore", "Copias de estilo", "Robots/Mechas", "Fondos complejos", "Realismo"].

---

## 4. Estructura de Componentes y Flujo

### A. Navbar / Header
* **Función:** Identidad y Moneda.
* **Elementos:**
    * Logo/Avatar.
    * **Toggle de Moneda:** Switch global `CLP 🇨🇱` <-> `USD 🌎`. Este estado debe controlar todos los precios visibles en la web.

### B. Galería "Masonry" (Portafolio)
* Mostrar trabajos anteriores mezclados con los servicios.
* Las tarjetas deben tener el efecto de "cinta adhesiva" (washi tape) visualmente.

### C. Sección de Reglas (El "Gatekeeper")
* **Importante:** No ocultar esto en un link. Debe ser visible.
* **Layout:** Dos columnas claras (Verde vs Rojo).
* **Interacción:** Checkbox obligatorio al final:
    > [ ] "Leí lo que NO dibujas (Sin Robots, Sin Gore, Sin Realismo)".
    * *Lógica:* Si `checked === false`, el botón de contacto está deshabilitado (gris).

### D. Botón de Acción (WhatsApp Generator)
No enviar un mensaje vacío. El enlace debe construirse dinámicamente:

**Fórmula del Mensaje:**
```text
Hola k0kho! 👋
Vengo de tu web. Me interesa: {SERVICIO_SELECCIONADO}
Precio visto: {PRECIO_EN_MONEDA_SELECCIONADA}

✅ Confirmo que leí tus reglas (No pido NSFW/Robots).
Pago vía: BancoEstado / PayPal.