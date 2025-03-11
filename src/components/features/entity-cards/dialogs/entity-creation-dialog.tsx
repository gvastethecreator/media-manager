'use client';

import type { BaseEntityFormData } from '@/components/features/entity-cards/forms/entity-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/toast';
import type * as React from 'react';
import { useEffect, useState } from 'react';

const entityDialogLogger = logger.withContext('EntityDialog');

// Props para el componente DialogWrapper
interface EntityCreationDialogProps {
	title: string;
	eventName: string;
	children: React.ReactNode;
	preview?: React.ReactNode;
	isFormValid?: boolean;
	onSave: (imageId?: string | null) => void;
	onCancel: () => void;
	entityType?: string;
}

// Componente genérico para el diálogo de creación de entidades
export function EntityCreationDialog({
	title,
	eventName,
	children,
	preview,
	isFormValid = true,
	onSave,
	onCancel,
	entityType = 'entidad',
}: EntityCreationDialogProps) {
	// Estado para controlar si el diálogo está abierto
	const [isOpen, setIsOpen] = useState(false);
	// Estado para almacenar el ID de la imagen si se pasa en el evento
	const [imageId, setImageId] = useState<string | null>(null);

	// Escuchar el evento para abrir el diálogo
	useEffect(() => {
		const handleOpenDialog = (event: CustomEvent) => {
			entityDialogLogger.info(`📣 Evento recibido: ${eventName}`, event.detail);
			setIsOpen(true);

			// Si el evento incluye un ID de imagen, lo guardamos
			if (event.detail?.imageId) {
				setImageId(event.detail.imageId);
			}
		};

		// Registramos el listener para el evento
		window.addEventListener(eventName, handleOpenDialog as EventListener);

		// Limpiamos el listener cuando el componente se desmonta
		return () => {
			window.removeEventListener(eventName, handleOpenDialog as EventListener);
		};
	}, [eventName]);

	// Función para manejar el cierre del diálogo
	const handleClose = () => {
		setIsOpen(false);
		setImageId(null);
		onCancel();
	};

	// Función para manejar el guardado
	const handleSave = () => {
		onSave(imageId); // Pasamos el imageId al callback de guardado

		// Mostrar notificación de creación exitosa
		toastService.system.success(`${entityType} creado correctamente`);

		setIsOpen(false);
		setImageId(null);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				{/* Nuevo layout con dos columnas */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-auto">
					{/* Columna del formulario */}
					<div className="space-y-4">
						<h3 className="text-sm font-medium text-muted-foreground">Información de {entityType}</h3>
						<div className="space-y-4">{children}</div>
					</div>

					{/* Columna de previsualización */}
					{preview && (
						<div className="space-y-4">
							<h3 className="text-sm font-medium text-muted-foreground">Vista previa</h3>
							<div className="border rounded-lg p-4 h-[300px] flex items-center justify-center bg-background/50">
								{preview}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancelar
					</Button>
					<Button onClick={handleSave} disabled={!isFormValid}>
						Guardar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
