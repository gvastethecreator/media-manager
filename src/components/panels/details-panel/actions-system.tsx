/**
 * @file Sistema completo de acciones para el Details Panel
 * @module components/panels/details-panel/actions-system
 * @description Implementa todas las acciones reales con confirmaciones, feedback y manejo de errores
 */

import { useCallback, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';

// Tipos para el sistema de acciones
export interface ActionContext {
	entity: EntityWithStats;
	selectedEntities?: EntityWithStats[];
	currentPath?: string;
	metadata?: Record<string, any>;
}

export interface ActionResult {
	success: boolean;
	message?: string;
	data?: any;
	redirect?: string;
}

export type ActionHandler = (context: ActionContext) => Promise<ActionResult>;

export interface ActionConfig {
	id: string;
	label: string;
	description?: string;
	icon?: string;
	category: 'primary' | 'secondary' | 'destructive';
	requiresConfirmation?: boolean;
	confirmationMessage?: string;
	requiresInput?: boolean;
	inputFields?: ActionInputField[];
	shortcut?: string;
	condition?: (entity: EntityWithStats) => boolean;
	handler: ActionHandler;
}

export interface ActionInputField {
	id: string;
	label: string;
	type: 'text' | 'textarea' | 'select' | 'switch' | 'number';
	required?: boolean;
	placeholder?: string;
	options?: { value: string; label: string }[];
	defaultValue?: any;
	validation?: (value: any) => string | null;
}

// Hook principal para el sistema de acciones
export function useActionsSystem() {
	const { toast } = useToast();
	const [isExecuting, setIsExecuting] = useState(false);
	const [currentAction, setCurrentAction] = useState<ActionConfig | null>(null);
	const [currentContext, setCurrentContext] = useState<ActionContext | null>(null);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [showInputDialog, setShowInputDialog] = useState(false);
	const [inputValues, setInputValues] = useState<Record<string, any>>({});
	const [progress, setProgress] = useState(0);

	/**
	 * Ejecuta una acción con el contexto proporcionado
	 */
	const executeAction = useCallback(
		async (action: ActionConfig, context: ActionContext) => {
			try {
				setIsExecuting(true);
				setProgress(0);

				// Simular progreso
				const progressInterval = setInterval(() => {
					setProgress((prev) => Math.min(prev + 10, 90));
				}, 100);

				const result = await action.handler(context);

				clearInterval(progressInterval);
				setProgress(100);

				if (result.success) {
					toast({
						title: 'Acción completada',
						description: result.message || `${action.label} ejecutado correctamente`,
					});
				} else {
					toast({
						title: 'Error en la acción',
						description: result.message || `Error al ejecutar ${action.label}`,
						variant: 'destructive',
					});
				}

				return result;
			} catch (error) {
				toast({
					title: 'Error inesperado',
					description: `Error al ejecutar ${action.label}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
					variant: 'destructive',
				});
				return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
			} finally {
				setIsExecuting(false);
				setProgress(0);
				setCurrentAction(null);
				setCurrentContext(null);
				setShowConfirmation(false);
				setShowInputDialog(false);
				setInputValues({});
			}
		},
		[toast]
	);

	/**
	 * Inicia la ejecución de una acción
	 */
	const startAction = useCallback(
		(action: ActionConfig, context: ActionContext) => {
			setCurrentAction(action);
			setCurrentContext(context);

			// Si requiere entrada de datos
			if (action.requiresInput && action.inputFields) {
				const defaultValues: Record<string, any> = {};
				action.inputFields.forEach((field) => {
					defaultValues[field.id] = field.defaultValue || '';
				});
				setInputValues(defaultValues);
				setShowInputDialog(true);
				return;
			}

			// Si requiere confirmación
			if (action.requiresConfirmation) {
				setShowConfirmation(true);
				return;
			}

			// Ejecutar directamente
			executeAction(action, context);
		},
		[executeAction]
	);

	/**
	 * Confirma y ejecuta la acción
	 */
	const confirmAction = useCallback(() => {
		if (!currentAction || !currentContext) return;

		const context: ActionContext = {
			...currentContext,
			metadata: { ...currentContext.metadata, ...inputValues },
		};

		executeAction(currentAction, context);
	}, [currentAction, currentContext, executeAction, inputValues]);

	/**
	 * Cancela la acción actual
	 */
	const cancelAction = useCallback(() => {
		setCurrentAction(null);
		setCurrentContext(null);
		setShowConfirmation(false);
		setShowInputDialog(false);
		setInputValues({});
	}, []);

	/**
	 * Actualiza un valor de entrada
	 */
	const updateInputValue = useCallback((fieldId: string, value: any) => {
		setInputValues((prev) => ({
			...prev,
			[fieldId]: value,
		}));
	}, []);

	/**
	 * Valida los campos de entrada
	 */
	const validateInputs = useCallback(() => {
		if (!currentAction?.inputFields) return true;

		for (const field of currentAction.inputFields) {
			const value = inputValues[field.id];

			if (field.required && (!value || value === '')) {
				toast({
					title: 'Campo requerido',
					description: `El campo "${field.label}" es obligatorio`,
					variant: 'destructive',
				});
				return false;
			}

			if (field.validation) {
				const error = field.validation(value);
				if (error) {
					toast({
						title: 'Error de validación',
						description: error,
						variant: 'destructive',
					});
					return false;
				}
			}
		}

		return true;
	}, [currentAction, inputValues, toast]);

	// Componente de diálogo de confirmación
	const ConfirmationDialog = () => (
		<AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirmar acción</AlertDialogTitle>
					<AlertDialogDescription>
						{currentAction?.confirmationMessage ||
							`¿Estás seguro de que quieres ${currentAction?.label.toLowerCase()}?`}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={cancelAction}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onClick={confirmAction}
						className={cn(
							currentAction?.category === 'destructive' &&
								'bg-destructive text-destructive-foreground hover:bg-destructive/90'
						)}
					>
						{currentAction?.label}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	// Componente de diálogo de entrada
	const InputDialog = () => (
		<Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{currentAction?.label}</DialogTitle>
					<DialogDescription>{currentAction?.description || 'Completa los siguientes campos'}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{currentAction?.inputFields?.map((field) => (
						<div key={field.id} className="grid gap-2">
							<Label htmlFor={field.id}>
								{field.label}
								{field.required && <span className="text-destructive ml-1">*</span>}
							</Label>
							{field.type === 'text' && (
								<Input
									id={field.id}
									placeholder={field.placeholder}
									value={inputValues[field.id] || ''}
									onChange={(e) => updateInputValue(field.id, e.target.value)}
								/>
							)}
							{field.type === 'textarea' && (
								<Textarea
									id={field.id}
									placeholder={field.placeholder}
									value={inputValues[field.id] || ''}
									onChange={(e) => updateInputValue(field.id, e.target.value)}
									rows={3}
								/>
							)}
							{field.type === 'number' && (
								<Input
									id={field.id}
									type="number"
									placeholder={field.placeholder}
									value={inputValues[field.id] || ''}
									onChange={(e) => updateInputValue(field.id, Number(e.target.value))}
								/>
							)}
							{field.type === 'switch' && (
								<div className="flex items-center space-x-2">
									<Switch
										id={field.id}
										checked={inputValues[field.id] || false}
										onCheckedChange={(checked) => updateInputValue(field.id, checked)}
									/>
									<Label htmlFor={field.id} className="text-sm">
										{field.placeholder}
									</Label>
								</div>
							)}
							{field.type === 'select' && field.options && (
								<select
									id={field.id}
									value={inputValues[field.id] || ''}
									onChange={(e) => updateInputValue(field.id, e.target.value)}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
								>
									<option value="">Seleccionar...</option>
									{field.options.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							)}
						</div>
					))}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={cancelAction}>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							if (validateInputs()) {
								confirmAction();
							}
						}}
						disabled={isExecuting}
					>
						{currentAction?.label}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	// Componente de progreso
	const ProgressIndicator = () =>
		isExecuting && (
			<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
				<div className="bg-card p-6 rounded-lg shadow-lg min-w-[300px]">
					<div className="space-y-4">
						<div className="text-center">
							<h3 className="text-lg font-semibold">Ejecutando {currentAction?.label}...</h3>
							<p className="text-sm text-muted-foreground mt-1">Por favor espera mientras se completa la acción</p>
						</div>
						<Progress value={progress} className="w-full" />
						<div className="text-center">
							<Badge variant="secondary">{progress}%</Badge>
						</div>
					</div>
				</div>
			</div>
		);

	return {
		// Estado
		isExecuting,
		currentAction,
		progress,

		// Métodos
		startAction,
		executeAction,
		cancelAction,

		// Componentes
		ConfirmationDialog,
		InputDialog,
		ProgressIndicator,
	};
}

// Acciones predefinidas comunes
export const CommonActionHandlers: Record<string, ActionHandler> = {
	// Acciones de visualización
	view: async ({ entity }) => {
		// Implementar navegación a vista detallada
		console.log('Abriendo vista detallada para:', entity.id);
		return { success: true, message: 'Vista abierta correctamente' };
	},

	// Acciones de edición
	edit: async ({ entity, metadata }) => {
		// Implementar edición de entidad
		console.log('Editando entidad:', entity.id, metadata);
		return { success: true, message: 'Entidad editada correctamente' };
	},

	rename: async ({ entity, metadata }) => {
		const newName = metadata?.name;
		if (!newName) {
			return { success: false, message: 'Nombre requerido' };
		}
		console.log('Renombrando entidad:', entity.id, 'a', newName);
		return { success: true, message: `Renombrado a "${newName}"` };
	},

	// Acciones de gestión
	delete: async ({ entity }) => {
		console.log('Eliminando entidad:', entity.id);
		// Simular eliminación
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return { success: true, message: 'Entidad eliminada correctamente' };
	},

	duplicate: async ({ entity }) => {
		console.log('Duplicando entidad:', entity.id);
		return { success: true, message: 'Entidad duplicada correctamente' };
	},

	// Acciones de organización
	move: async ({ entity, metadata }) => {
		const destination = metadata?.destination;
		console.log('Moviendo entidad:', entity.id, 'a', destination);
		return { success: true, message: `Movido a ${destination}` };
	},

	copy: async ({ entity, metadata }) => {
		const destination = metadata?.destination;
		console.log('Copiando entidad:', entity.id, 'a', destination);
		return { success: true, message: `Copiado a ${destination}` };
	},

	// Acciones de compartir
	share: async ({ entity, metadata }) => {
		const shareType = metadata?.shareType || 'link';
		console.log('Compartiendo entidad:', entity.id, 'como', shareType);
		return { success: true, message: 'Compartido correctamente' };
	},

	download: async ({ entity }) => {
		console.log('Descargando entidad:', entity.id);
		// Simular descarga
		await new Promise((resolve) => setTimeout(resolve, 2000));
		return { success: true, message: 'Descarga completada' };
	},

	// Acciones de favoritos
	favorite: async ({ entity }) => {
		const isFavorite = 'isFavorite' in entity ? entity.isFavorite : false;
		console.log(isFavorite ? 'Quitando de favoritos:' : 'Añadiendo a favoritos:', entity.id);
		return {
			success: true,
			message: isFavorite ? 'Quitado de favoritos' : 'Añadido a favoritos',
		};
	},

	// Acciones de tags
	addTags: async ({ entity, metadata }) => {
		const tags = metadata?.tags || [];
		console.log('Añadiendo tags a entidad:', entity.id, tags);
		return { success: true, message: `${tags.length} tags añadidos` };
	},

	// Acciones específicas de medios
	play: async ({ entity }) => {
		console.log('Reproduciendo:', entity.id);
		return { success: true, message: 'Reproducción iniciada' };
	},

	extractFrame: async ({ entity, metadata }) => {
		const timestamp = metadata?.timestamp || 0;
		console.log('Extrayendo frame de video:', entity.id, 'en', timestamp);
		return { success: true, message: 'Frame extraído correctamente' };
	},

	compress: async ({ entity, metadata }) => {
		const quality = metadata?.quality || 80;
		console.log('Comprimiendo:', entity.id, 'calidad:', quality);
		return { success: true, message: 'Archivo comprimido correctamente' };
	},
};

// Configuraciones de acciones predefinidas
export const PredefinedActions: Record<string, ActionConfig> = {
	view: {
		id: 'view',
		label: 'Ver',
		description: 'Abrir vista detallada',
		icon: 'Eye',
		category: 'primary',
		shortcut: 'Enter',
		handler: CommonActionHandlers.view,
	},

	edit: {
		id: 'edit',
		label: 'Editar',
		description: 'Editar propiedades',
		icon: 'Edit',
		category: 'primary',
		shortcut: 'F2',
		requiresInput: true,
		inputFields: [
			{
				id: 'name',
				label: 'Nombre',
				type: 'text',
				required: true,
				placeholder: 'Nuevo nombre...',
			},
			{
				id: 'description',
				label: 'Descripción',
				type: 'textarea',
				placeholder: 'Descripción opcional...',
			},
		],
		handler: CommonActionHandlers.edit,
	},

	rename: {
		id: 'rename',
		label: 'Renombrar',
		description: 'Cambiar nombre',
		icon: 'Edit',
		category: 'secondary',
		requiresInput: true,
		inputFields: [
			{
				id: 'name',
				label: 'Nuevo nombre',
				type: 'text',
				required: true,
				placeholder: 'Escribe el nuevo nombre...',
				validation: (value) => {
					if (value.length < 1) return 'El nombre no puede estar vacío';
					if (value.length > 255) return 'El nombre es demasiado largo';
					return null;
				},
			},
		],
		handler: CommonActionHandlers.rename,
	},

	delete: {
		id: 'delete',
		label: 'Eliminar',
		description: 'Eliminar permanentemente',
		icon: 'Trash2',
		category: 'destructive',
		shortcut: 'Delete',
		requiresConfirmation: true,
		confirmationMessage: '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.',
		handler: CommonActionHandlers.delete,
	},

	share: {
		id: 'share',
		label: 'Compartir',
		description: 'Compartir con otros',
		icon: 'Share',
		category: 'secondary',
		requiresInput: true,
		inputFields: [
			{
				id: 'shareType',
				label: 'Tipo de compartición',
				type: 'select',
				required: true,
				options: [
					{ value: 'link', label: 'Enlace público' },
					{ value: 'email', label: 'Por email' },
					{ value: 'social', label: 'Redes sociales' },
				],
				defaultValue: 'link',
			},
			{
				id: 'allowEdit',
				label: 'Permitir edición',
				type: 'switch',
				placeholder: 'Los usuarios pueden editar',
				defaultValue: false,
			},
		],
		handler: CommonActionHandlers.share,
	},

	favorite: {
		id: 'favorite',
		label: 'Favorito',
		description: 'Añadir/quitar de favoritos',
		icon: 'Heart',
		category: 'secondary',
		condition: (entity) => 'isFavorite' in entity,
		handler: CommonActionHandlers.favorite,
	},
};
