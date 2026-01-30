import { MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyPanelProps {
	className?: string;
}

export const EmptyPanel: React.FC<EmptyPanelProps> = ({ className = '' }) => {
	return (
		<div
			className={cn(
				'details-panel flex h-full flex-col items-center justify-center gap-3 overflow-hidden border-l bg-background p-6',
				className
			)}
		>
			{/* Icon container con animación sutil */}
			<div className="flex h-16 w-16 items-center justify-center rounded-dt-lg bg-muted/50">
				<MousePointerClick className="h-8 w-8 text-muted-foreground/60" />
			</div>

			{/* Texto principal */}
			<div className="stack-xs text-center">
				<p className="heading-sm text-foreground/80">Ningún elemento seleccionado</p>
				<p className="body-sm text-muted-foreground">Selecciona un archivo o carpeta para ver sus detalles</p>
			</div>

			{/* Hint adicional */}
			<div className="mt-2 flex items-center gap-2 rounded-dt-sm bg-muted/30 px-3 py-1.5">
				<span className="text-muted-foreground text-xs">
					<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Click</kbd>
					{' para seleccionar'}
				</span>
			</div>
		</div>
	);
};
