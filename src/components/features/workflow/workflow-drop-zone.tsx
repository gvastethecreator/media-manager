import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { memo, useState } from 'react';
import { cn } from '@/lib/utils';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useWorkflowDrop } from '@/hooks/use-workflow-drop';

interface WorkflowDropZoneProps {
	className?: string;
	disabled?: boolean;
	onSuccess?: (workflowCount: number) => void;
	onError?: (error: string) => void;
}

/**
 * Zona de drag & drop para workflows ComfyUI
 */
export const WorkflowDropZone = memo(function WorkflowDropZone({
	className,
	disabled = false,
	onSuccess,
	onError,
}: WorkflowDropZoneProps) {
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	const { isDragging, isProcessing, dropZoneProps, handleFileInput } = useWorkflowDrop({
		onSuccess: (count) => {
			setMessage({
				type: 'success',
				text: `${count} workflow${count === 1 ? '' : 's'} importado${count === 1 ? '' : 's'} exitosamente`,
			});
			onSuccess?.(count);

			// Limpiar mensaje después de 3 segundos
			setTimeout(() => setMessage(null), 3000);
		},
		onError: (error) => {
			setMessage({ type: 'error', text: error });
			onError?.(error);

			// Limpiar mensaje después de 5 segundos
			setTimeout(() => setMessage(null), 5000);
		},
	});

	return (
		<div className={cn('space-y-4', className)}>
			{/* Zona de drop */}
			<Card
				className={cn(
					'border-2 border-dashed transition-colors duration-200',
					isDragging && !disabled && 'border-primary bg-primary/5',
					disabled && 'opacity-50 cursor-not-allowed',
					!disabled && 'hover:border-primary/50 hover:bg-muted/50'
				)}
				{...(!disabled ? dropZoneProps : {})}
			>
				<CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
					{isProcessing ? (
						<>
							<div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
							<div className="space-y-2">
								<p className="font-medium text-sm">Procesando workflows...</p>
								<p className="text-xs text-muted-foreground">Validando y importando archivos JSON</p>
							</div>
						</>
					) : (
						<>
							<div
								className={cn(
									'h-12 w-12 rounded-full flex items-center justify-center',
									isDragging && !disabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
								)}
							>
								<Upload className="h-6 w-6" />
							</div>
							<div className="space-y-2">
								<p className="font-medium">
									{isDragging && !disabled ? 'Suelta los archivos aquí' : 'Arrastra workflows ComfyUI aquí'}
								</p>
								<p className="text-sm text-muted-foreground">Archivos JSON de workflows ComfyUI (formato v1.0)</p>
							</div>
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<FileText className="h-4 w-4" />
								<span>Soporta múltiples archivos</span>
							</div>
						</>
					)}

					{!disabled && !isProcessing && (
						<div className="pt-2">
							<Button variant="outline" size="sm" asChild>
								<label className="cursor-pointer">
									Seleccionar archivos
									<input
										type="file"
										multiple
										accept=".json,application/json"
										className="hidden"
										onChange={handleFileInput}
									/>
								</label>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Mensajes de resultado */}
			{message && (
				<Alert variant={message.type === 'error' ? 'destructive' : 'success'}>
					{message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
					<AlertDescription>{message.text}</AlertDescription>
				</Alert>
			)}

			{/* Información sobre el formato */}
			<Card className="bg-muted/30">
				<CardContent className="p-4">
					<div className="space-y-2">
						<h4 className="font-medium text-sm flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Formato Soportado
						</h4>
						<div className="text-xs text-muted-foreground space-y-1">
							<p>• Archivos JSON de workflows ComfyUI v1.0</p>
							<p>• Debe contener nodos, conexiones y metadatos válidos</p>
							<p>• Se validará la estructura antes de importar</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});

WorkflowDropZone.displayName = 'WorkflowDropZone';
