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
			if ('startViewTransition' in document) {
				// @ts-expect-error - ViewTransition API es experimental
				document.startViewTransition(() => {
					if (typeof to === 'number') {
						navigate(to);
					} else {
						navigate(to, options);
					}
				});
			} else {
				// Fallback para navegadores que no soportan ViewTransition
				if (typeof to === 'number') {
					navigate(to);
				} else {
					navigate(to, options);
				}
			}
		},
		[navigate]
	);

	return { navigateWithTransition };
}
