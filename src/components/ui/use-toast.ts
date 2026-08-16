// Este proyecto usa Sonner (ver `src/providers/app-provider.tsx`).
// Este archivo mantiene la ruta histórica `@/components/ui/use-toast` sin
// depender del store legacy (que no se renderiza). Implementación directa.

import { useToast as useSonnerToast } from './toast';

export function useToast() {
	return useSonnerToast();
}
