import { memo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Hash } from 'lucide-react';

export interface WildcardContentViewProps {
	className?: string;
	wildcardId?: string;
}

// Implementación mínima temporal hasta completar la feature de wildcards
export const WildcardContentView = memo(function WildcardContentView({
	className,
	wildcardId,
}: WildcardContentViewProps) {
	if (!wildcardId) {
		return (
			<div className={className}>
				<EmptyState
					description="Selecciona un wildcard desde la vista de wildcards para ver su contenido."
					icon={Hash}
					title="No hay wildcard seleccionado"
				/>
			</div>
		);
	}

	return (
		<div className={className}>
			<EmptyState
				description="El sistema de wildcards se implementará en futuras versiones."
				icon={Hash}
				title="Sistema de wildcards no implementado"
			/>
		</div>
	);
});

WildcardContentView.displayName = 'WildcardContentView';
