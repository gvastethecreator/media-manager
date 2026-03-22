/**
 * Batch Operation Dialog Component
 *
 * A dialog for configuring batch operations before execution,
 * allowing users to set options like priority, error handling, and progress display.
 */

import { AlertTriangle, Copy, FolderOpen, Move, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { BatchOperationOptions } from '@/services/file/batch-operations.service';
import type { AnyEntityWithStats } from '@/types/entities';

export type BatchOperationDialogType = 'copy' | 'move' | 'delete';

interface BatchOperationDialogProps {
	items: AnyEntityWithStats[];
	onCancel?: () => void;
	onConfirm: (options: BatchOperationOptions & { targetPath?: string }) => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	targetPath?: string;
	type: BatchOperationDialogType;
}

export function BatchOperationDialog({
	open,
	onOpenChange,
	type,
	items,
	targetPath: initialTargetPath,
	onConfirm,
	onCancel,
}: BatchOperationDialogProps) {
	const [targetPath, setTargetPath] = useState(initialTargetPath || '');
	const [description, setDescription] = useState('');
	const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
	const [overwrite, setOverwrite] = useState(false);
	const [continueOnError, setContinueOnError] = useState(type !== 'delete');
	const [showProgress, setShowProgress] = useState(true);
	const [preserveTimestamps, setPreserveTimestamps] = useState(true);
	const [recursive, setRecursive] = useState(true);

	const handleConfirm = () => {
		const options: BatchOperationOptions & { targetPath?: string } = {
			priority,
			showProgress,
			continueOnError,
			description: description.trim() || undefined,
		};

		if (type !== 'delete') {
			options.targetPath = targetPath;
		}

		onConfirm(options);
		onOpenChange(false);
	};

	const handleCancel = () => {
		onCancel?.();
		onOpenChange(false);
	};

	const getOperationIcon = () => {
		switch (type) {
			case 'copy':
				return <Copy className="h-5 w-5 text-primary" />;
			case 'move':
				return <Move className="h-5 w-5 text-warning" />;
			case 'delete':
				return <Trash2 className="h-5 w-5 text-destructive" />;
			default:
				return null;
		}
	};

	const getOperationTitle = () => {
		const itemCount = items.length;
		const itemText = itemCount === 1 ? 'elemento' : 'elementos';

		switch (type) {
			case 'copy':
				return `Copiar ${itemCount} ${itemText}`;
			case 'move':
				return `Mover ${itemCount} ${itemText}`;
			case 'delete':
				return `Eliminar ${itemCount} ${itemText}`;
			default:
				return '';
		}
	};

	const getOperationDescription = () => {
		switch (type) {
			case 'copy':
				return 'Los archivos se copiarán al destino especificado manteniendo los originales.';
			case 'move':
				return 'Los archivos se moverán al destino especificado eliminándolos de su ubicación actual.';
			case 'delete':
				return 'Los archivos se eliminarán permanentemente. Esta acción no se puede deshacer.';
			default:
				return '';
		}
	};

	const getTotalSize = () => {
		return items.reduce((total, item) => {
			// Acceder a size desde la entidad base, no desde las estadísticas
			const itemSize = 'size' in item ? (item as any).size : 0;
			return total + (itemSize || 0);
		}, 0);
	};

	const isValid = () => {
		if (type === 'delete') {
			return items.length > 0;
		}
		return items.length > 0 && targetPath.trim().length > 0;
	};

	const getPriorityDescription = (p: string) => {
		switch (p) {
			case 'urgent':
				return 'Se ejecutará inmediatamente';
			case 'high':
				return 'Alta prioridad en la cola';
			case 'normal':
				return 'Prioridad estándar';
			case 'low':
				return 'Se ejecutará cuando no haya otras operaciones';
			default:
				return '';
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{getOperationIcon()}
						{getOperationTitle()}
					</DialogTitle>
					<DialogDescription>{getOperationDescription()}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Items Summary */}
					<div className="rounded-lg bg-muted/50 p-4">
						<div className="mb-2 flex items-center justify-between">
							<h4 className="font-medium text-sm">Elementos seleccionados</h4>
							<Badge variant="outline">
								{items.length} {items.length === 1 ? 'elemento' : 'elementos'}
							</Badge>
						</div>

						<div className="grid grid-cols-2 gap-4 text-muted-foreground text-sm">
							<div>
								<span className="font-medium">Tamaño total:</span>
								<span className="ml-2">{formatBytes(getTotalSize())}</span>
							</div>
							<div>
								<span className="font-medium">Tipos:</span>
								<span className="ml-2">
									{items.filter((item) => item.entityType === 'folder').length} carpetas,{' '}
									{items.filter((item) => item.entityType !== 'folder').length} archivos
								</span>
							</div>
						</div>

						{/* Show first few items */}
						{items.length > 0 && (
							<div className="mt-3">
								<div className="mb-1 text-muted-foreground text-xs">Elementos:</div>
								<div className="max-h-20 space-y-1 overflow-y-auto">
									{items.slice(0, 5).map((item) => (
										<div className="truncate font-mono text-xs" key={item.id}>
											{item.name}
										</div>
									))}
									{items.length > 5 && (
										<div className="text-muted-foreground text-xs">... y {items.length - 5} elementos más</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Target Path (for copy/move) */}
					{type !== 'delete' && (
						<div className="space-y-2">
							<Label className="flex items-center gap-2" htmlFor="targetPath">
								<FolderOpen className="h-4 w-4" />
								Ruta de destino
							</Label>
							<Input
								className={cn(!targetPath.trim() && 'border-ui-error-border focus:border-ui-error-border')}
								id="targetPath"
								onChange={(e) => setTargetPath(e.target.value)}
								placeholder="Selecciona la carpeta de destino..."
								value={targetPath}
							/>
							{!targetPath.trim() && (
								<p className="flex items-center gap-1 text-destructive text-sm">
									<AlertTriangle className="h-3 w-3" />
									La ruta de destino es requerida
								</p>
							)}
						</div>
					)}

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Descripción (opcional)</Label>
						<Textarea
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descripción personalizada para esta operación..."
							rows={2}
							value={description}
						/>
					</div>

					<Separator />

					{/* Advanced Options */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Settings className="h-4 w-4" />
							<h4 className="font-medium">Opciones avanzadas</h4>
						</div>

						{/* Priority */}
						<div className="space-y-2">
							<Label>Prioridad</Label>
							<Select onValueChange={(value: any) => setPriority(value)} value={priority}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Baja</SelectItem>
									<SelectItem value="normal">Normal</SelectItem>
									<SelectItem value="high">Alta</SelectItem>
									<SelectItem value="urgent">Urgente</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-muted-foreground text-xs">{getPriorityDescription(priority)}</p>
						</div>

						{/* Options Grid */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{/* Show Progress */}
							<div className="flex items-center space-x-2">
								<Checkbox
									checked={showProgress}
									id="showProgress"
									onCheckedChange={(checked) => setShowProgress(!!checked)}
								/>
								<Label className="text-sm" htmlFor="showProgress">
									Mostrar progreso
								</Label>
							</div>

							{/* Continue on Error */}
							<div className="flex items-center space-x-2">
								<Checkbox
									checked={continueOnError}
									id="continueOnError"
									onCheckedChange={(checked) => setContinueOnError(!!checked)}
								/>
								<Label className="text-sm" htmlFor="continueOnError">
									Continuar si hay errores
								</Label>
							</div>

							{/* Overwrite (for copy/move) */}
							{type !== 'delete' && (
								<div className="flex items-center space-x-2">
									<Checkbox checked={overwrite} id="overwrite" onCheckedChange={(checked) => setOverwrite(!!checked)} />
									<Label className="text-sm" htmlFor="overwrite">
										Sobrescribir archivos existentes
									</Label>
								</div>
							)}

							{/* Preserve Timestamps (for copy/move) */}
							{type !== 'delete' && (
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={preserveTimestamps}
										id="preserveTimestamps"
										onCheckedChange={(checked) => setPreserveTimestamps(!!checked)}
									/>
									<Label className="text-sm" htmlFor="preserveTimestamps">
										Preservar fechas
									</Label>
								</div>
							)}

							{/* Recursive (for delete) */}
							{type === 'delete' && (
								<div className="flex items-center space-x-2">
									<Checkbox checked={recursive} id="recursive" onCheckedChange={(checked) => setRecursive(!!checked)} />
									<Label className="text-sm" htmlFor="recursive">
										Eliminar carpetas recursivamente
									</Label>
								</div>
							)}
						</div>
					</div>

					{/* Warning for delete operations */}
					{type === 'delete' && (
						<div className="rounded-lg border-ui-error-border bg-ui-error p-4">
							<div className="flex items-start gap-2">
								<AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
								<div>
									<h4 className="font-medium text-destructive">Advertencia</h4>
									<p className="mt-1 text-destructive text-sm">
										Esta operación eliminará permanentemente los archivos seleccionados. Esta acción no se puede
										deshacer.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button onClick={handleCancel} variant="outline">
						Cancelar
					</Button>
					<Button disabled={!isValid()} onClick={handleConfirm} variant={type === 'delete' ? 'destructive' : 'primary'}>
						{type === 'delete' ? 'Eliminar' : 'Iniciar operación'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default BatchOperationDialog;
