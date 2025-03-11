"use client";

import { Button } from "@/components/ui/button";
import { toastService } from "@/lib/services/toast.service";

/**
 * Componente de ejemplo para demostrar el uso del sistema de notificaciones
 */
export function ToastExample() {
	const showSuccessToast = () => {
		toastService.success("Operación completada con éxito");
	};

	const showErrorToast = () => {
		toastService.error("Error", {
			description: "No se pudo completar la operación",
		});
	};

	const showInfoToast = () => {
		toastService.info("Información", {
			description: "Esta es una notificación informativa",
		});
	};

	const showWarningToast = () => {
		toastService.warning("Advertencia", {
			description: "Esta acción podría tener consecuencias",
		});
	};

	const showCollectionToast = () => {
		toastService.collection.created("Mi colección");
	};

	const showTagToast = () => {
		toastService.tag.imageAdded("Etiqueta importante");
	};

	const showPromiseToast = () => {
		toastService.promise(
			new Promise((resolve) => {
				setTimeout(resolve, 2000);
			}),
			{
				loading: "Cargando datos...",
				success: "Datos cargados correctamente",
				error: "Error al cargar los datos",
			}
		);
	};

	return (
		<div className="space-y-4 p-4 border rounded-lg">
			<h2 className="text-xl font-bold">Ejemplos de Notificaciones</h2>
			<p className="text-muted-foreground">
				Haz clic en los botones para ver diferentes tipos de notificaciones.
			</p>
			<div className="flex flex-wrap gap-2">
				<Button onClick={showSuccessToast} variant="default">
					Éxito
				</Button>
				<Button onClick={showErrorToast} variant="destructive">
					Error
				</Button>
				<Button onClick={showInfoToast} variant="outline">
					Información
				</Button>
				<Button onClick={showWarningToast} variant="secondary">
					Advertencia
				</Button>
				<Button onClick={showCollectionToast} variant="default">
					Colección
				</Button>
				<Button onClick={showTagToast} variant="default">
					Etiqueta
				</Button>
				<Button onClick={showPromiseToast} variant="outline">
					Promesa
				</Button>
			</div>
		</div>
	);
}
