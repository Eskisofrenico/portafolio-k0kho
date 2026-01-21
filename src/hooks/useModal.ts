import { useEffect } from 'react';

/**
 * Hook para manejar el comportamiento de modales:
 * - Bloquea el scroll del body cuando el modal está abierto
 * - Restaura el scroll cuando el modal se cierra
 */
export function useModal(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    // Guardar el scroll actual
    const scrollY = window.scrollY;
    // Bloquear el scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // Restaurar el scroll
      const body = document.body;
      const scrollY = body.style.top;
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);
}
