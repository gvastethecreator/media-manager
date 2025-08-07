import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditModeControlsProps {
	onSave: () => void;
	onCancel: () => void;
	isDisabled: boolean;
}

export function EditModeControls({ onSave, onCancel, isDisabled }: EditModeControlsProps) {
	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="h-6 w-6 text-green-600 hover:bg-green-50"
							disabled={isDisabled}
							onClick={onSave}
							size="icon"
							variant="ghost"
						>
							<Check className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent className="text-xs">Guardar cambios</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="h-6 w-6 text-red-600 hover:bg-red-50"
							disabled={isDisabled}
							onClick={onCancel}
							size="icon"
							variant="ghost"
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent className="text-xs">Cancelar edición</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</>
	);
}
