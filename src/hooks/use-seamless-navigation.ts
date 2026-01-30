import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook para navegación con transiciones seamless usando ViewTransition API
 */
export function useSeamlessNavigation() {
	const navigate = useNavigate();

	const navigateWithTransition = useCallback(
		(to: string | number, options?: { replace?: boolean }) => {
			// Verificar si el navegador soporta ViewTransition API
			const docAny = document as unknown as { startViewTransition?: (cb: () => void) => void };
			if (typeof docAny.startViewTransition === 'function') {
				docAny.startViewTransition(() => {
					if (typeof to === 'number') {
						navigate(to);
					} else {
						navigate(to, options);
					}
				});
			} else if (typeof to === 'number') {
				// Fallback para navegadores que no soportan ViewTransition
				navigate(to);
			} else {
				navigate(to, options);
			}
		},
		[navigate]
	);

	return { navigateWithTransition };
}
