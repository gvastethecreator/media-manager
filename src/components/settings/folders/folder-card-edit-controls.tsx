import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SimpleTooltip } from './common/simple-tooltip';

interface EditModeControlsProps {
	onSave: () => void;
	onCancel: () => void;
	isDisabled: boolean;
}

export function EditModeControls({ onSave, onCancel, isDisabled }: EditModeControlsProps) {
	return (
		<>
			<SimpleTooltip content="Guardar cambios">
				<Button
					className={cn(
						'h-6 w-6 text-green-600 transition-all duration-200 ease-out',
						'hover:scale-110 hover:bg-green-50 dark:hover:bg-green-950',
						'focus:outline-none focus:ring-2 focus:ring-green-200',
						'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
					)}
					disabled={isDisabled}
					onClick={onSave}
					size="icon"
					variant="ghost"
				>
					<Check className="h-3.5 w-3.5 transition-transform duration-200 hover:scale-110" />
				</Button>
			</SimpleTooltip>
			<SimpleTooltip content="Cancelar edición">
				<Button
					className={cn(
						'h-6 w-6 text-red-600 transition-all duration-200 ease-out',
						'hover:scale-110 hover:bg-red-50 dark:hover:bg-red-950',
						'focus:outline-none focus:ring-2 focus:ring-red-200',
						'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
					)}
					disabled={isDisabled}
					onClick={onCancel}
					size="icon"
					variant="ghost"
				>
					<X className="h-3.5 w-3.5 transition-transform duration-200 hover:rotate-90" />
				</Button>
			</SimpleTooltip>
		</>
	);
}
