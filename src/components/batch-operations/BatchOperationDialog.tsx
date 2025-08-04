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
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: BatchOperationDialogType;
	items: AnyEntityWithStats[];
	targetPath?: string;
	onConfirm: (options: BatchOperationOptions & { targetPath?: string }) => void;
	onCancel?: () => void;
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
				return <Copy className="h-5 w-5 text-blue-500" />;
			case 'move':
				return <Move className="h-5 w-5 text-orange-500" />;
			case 'delete':
				return <Trash2 className="h-5 w-5 text-red-500" />;
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

	const getPriorityDescription = (priority: string) => {
		switch (priority) {
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
		<Dialog open={open} onOpenChange={onOpenChange}>
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
					<div className="bg-muted/50 rounded-lg p-4">
						<div className="flex items-center justify-between mb-2">
							<h4 className="font-medium text-sm">Elementos seleccionados</h4>
							<Badge variant="outline">
								{items.length} {items.length === 1 ? 'elemento' : 'elementos'}
							</Badge>
						</div>

						<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
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
								<div className="text-xs text-muted-foreground mb-1">Elementos:</div>
								<div className="space-y-1 max-h-20 overflow-y-auto">
									{items.slice(0, 5).map((item, index) => (
										<div key={index} className="text-xs font-mono truncate">
											{item.name}
										</div>
									))}
									{items.length > 5 && (
										<div className="text-xs text-muted-foreground">... y {items.length - 5} elementos más</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Target Path (for copy/move) */}
					{type !== 'delete' && (
						<div className="space-y-2">
							<Label htmlFor="targetPath" className="flex items-center gap-2">
								<FolderOpen className="h-4 w-4" />
								Ruta de destino
							</Label>
							<Input
								id="targetPath"
								value={targetPath}
								onChange={(e) => setTargetPath(e.target.value)}
								placeholder="Selecciona la carpeta de destino..."
								className={cn(!targetPath.trim() && 'border-red-200 focus:border-red-300')}
							/>
							{!targetPath.trim() && (
								<p className="text-sm text-red-600 flex items-center gap-1">
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
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descripción personalizada para esta operación..."
							rows={2}
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
							<Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
							<p className="text-xs text-muted-foreground">{getPriorityDescription(priority)}</p>
						</div>

						{/* Options Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Show Progress */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="showProgress"
									checked={showProgress}
									onCheckedChange={(checked) => setShowProgress(!!checked)}
								/>
								<Label htmlFor="showProgress" className="text-sm">
									Mostrar progreso
								</Label>
							</div>

							{/* Continue on Error */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="continueOnError"
									checked={continueOnError}
									onCheckedChange={(checked) => setContinueOnError(!!checked)}
								/>
								<Label htmlFor="continueOnError" className="text-sm">
									Continuar si hay errores
								</Label>
							</div>

							{/* Overwrite (for copy/move) */}
							{type !== 'delete' && (
								<div className="flex items-center space-x-2">
									<Checkbox id="overwrite" checked={overwrite} onCheckedChange={(checked) => setOverwrite(!!checked)} />
									<Label htmlFor="overwrite" className="text-sm">
										Sobrescribir archivos existentes
									</Label>
								</div>
							)}

							{/* Preserve Timestamps (for copy/move) */}
							{type !== 'delete' && (
								<div className="flex items-center space-x-2">
									<Checkbox
										id="preserveTimestamps"
										checked={preserveTimestamps}
										onCheckedChange={(checked) => setPreserveTimestamps(!!checked)}
									/>
									<Label htmlFor="preserveTimestamps" className="text-sm">
										Preservar fechas
									</Label>
								</div>
							)}

							{/* Recursive (for delete) */}
							{type === 'delete' && (
								<div className="flex items-center space-x-2">
									<Checkbox id="recursive" checked={recursive} onCheckedChange={(checked) => setRecursive(!!checked)} />
									<Label htmlFor="recursive" className="text-sm">
										Eliminar carpetas recursivamente
									</Label>
								</div>
							)}
						</div>
					</div>

					{/* Warning for delete operations */}
					{type === 'delete' && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex items-start gap-2">
								<AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
								<div>
									<h4 className="font-medium text-red-800">Advertencia</h4>
									<p className="text-sm text-red-700 mt-1">
										Esta operación eliminará permanentemente los archivos seleccionados. Esta acción no se puede
										deshacer.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button onClick={handleConfirm} disabled={!isValid()} variant={type === 'delete' ? 'destructive' : 'primary'}>
						{type === 'delete' ? 'Eliminar' : 'Iniciar operación'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default BatchOperationDialog;
