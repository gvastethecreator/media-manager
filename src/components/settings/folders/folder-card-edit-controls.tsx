import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
					className="h-6 w-6 text-green-600 hover:bg-green-50"
					disabled={isDisabled}
					onClick={onSave}
					size="icon"
					variant="ghost"
				>
					<Check className="h-3.5 w-3.5" />
				</Button>
			</SimpleTooltip>
			<SimpleTooltip content="Cancelar edición">
				<Button
					className="h-6 w-6 text-red-600 hover:bg-red-50"
					disabled={isDisabled}
					onClick={onCancel}
					size="icon"
					variant="ghost"
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			</SimpleTooltip>
		</>
	);
}
