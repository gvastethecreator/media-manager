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
				className="ml-1 h-3.5 border-ui-success-border bg-ui-success px-1 py-0 text-[9px] text-ui-success-text"
				variant="outline"
			>
				Completado
			</Badge>
		);
	}

	return (
		<Badge
			className="ml-1 h-3.5 animate-pulse border-ui-info-border bg-ui-info px-1 py-0 text-[9px] text-ui-info-text"
			variant="outline"
		>
			Procesando...
		</Badge>
	);
}
