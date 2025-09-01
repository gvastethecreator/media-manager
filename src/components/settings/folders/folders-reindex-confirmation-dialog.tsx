import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface ReindexConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isProcessing: boolean;
	progress?: number;
}

export function ReindexConfirmationDialog({
	open,
	onOpenChange,
	onConfirm,
	isProcessing,
	progress = 0,
}: ReindexConfirmationDialogProps) {
	const handleConfirm = () => {
		onConfirm();
		// No cerramos el diálogo para mostrar el progreso
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Reindexar todas las carpetas</DialogTitle>
					<DialogDescription>
						Este proceso analizará todas las carpetas registradas y actualizará sus metadatos. Puede tomar varios
						minutos dependiendo de la cantidad y tamaño de las carpetas.
					</DialogDescription>
				</DialogHeader>
				{isProcessing ? (
					<div className="space-y-4">
						<div className="flex items-center justify-center py-4">
							<RefreshCw className="h-10 w-10 animate-spin text-primary" />
						</div>
						<div className="text-center text-muted-foreground text-sm">Reindexando ({Math.round(progress)}%)</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full bg-primary transition-all duration-300 ease-in-out"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				) : (
					<div className="py-4 text-muted-foreground text-sm">
						<p>Durante este proceso:</p>
						<ul className="mt-2 ml-5 list-disc space-y-1">
							<li>Se escanearán todas las carpetas configuradas</li>
							<li>Se actualizarán los conteos de archivos y tamaños</li>
							<li>Se actualizará la fecha de indexación</li>
						</ul>
					</div>
				)}
				<DialogFooter className="flex justify-between sm:justify-between">
					<Button disabled={isProcessing} onClick={() => onOpenChange(false)} type="button" variant="outline">
						Cancelar
					</Button>
					<Button className="ml-2" disabled={isProcessing} onClick={handleConfirm} type="button">
						{isProcessing ? (
							<>
								<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
								Procesando...
							</>
						) : (
							'Confirmar'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
