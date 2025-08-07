import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyPanelProps {
	className?: string;
}

export const EmptyPanel: React.FC<EmptyPanelProps> = ({ className = '' }) => {
	return (
		<div
			className={cn(
				'details-panel flex h-full items-center justify-center overflow-hidden border-l bg-background p-4',
				className
			)}
		>
			<div className="text-center text-muted-foreground">
				<ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
				<p className="text-sm">Selecciona un elemento para ver sus detalles</p>
			</div>
		</div>
	);
};
