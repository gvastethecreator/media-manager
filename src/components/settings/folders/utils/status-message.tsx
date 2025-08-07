import { Badge } from '@/components/ui/badge';

/**
 * Función helper para obtener el mensaje de estado
 */
export function getStatusMessage(isReindexing: boolean, showCompleteAnimation: boolean, isProcessing: boolean) {
	if (!(isReindexing || showCompleteAnimation)) {
		return null;
	}

	if (!isProcessing && showCompleteAnimation) {
		return (
			<Badge
				className="ml-1 h-3.5 border-emerald-200 bg-emerald-50 px-1 py-0 text-[9px] text-emerald-500"
				variant="outline"
			>
				Completado
			</Badge>
		);
	}

	return (
		<Badge
			className="ml-1 h-3.5 animate-pulse border-blue-200 bg-blue-50 px-1 py-0 text-[9px] text-blue-500"
			variant="outline"
		>
			Procesando...
		</Badge>
	);
}
