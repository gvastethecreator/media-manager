import { useCallback, useState } from 'react';
import { useComfyUIWorkflowStore } from '@/stores/comfyui-workflow.store';
import { ComfyUIWorkflowService } from '@/services/workflow/comfyui.service';

interface UseWorkflowDropOptions {
	onSuccess?: (workflowCount: number) => void;
	onError?: (error: string) => void;
}

/**
 * Hook para manejar drag & drop y carga de archivos de workflows ComfyUI
 */
export const useWorkflowDrop = (options: UseWorkflowDropOptions = {}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const { upsertWorkflow } = useComfyUIWorkflowStore();

	// Validar si un archivo es un workflow válido
	const isValidWorkflowFile = useCallback((file: File): boolean => {
		return file.type === 'application/json' || file.name.endsWith('.json');
	}, []);

	// Procesar archivo individual
	const processWorkflowFile = useCallback(
		async (file: File): Promise<boolean> => {
			try {
				// Leer contenido del archivo
				const text = await file.text();
				const workflowData = JSON.parse(text);

				// Validar estructura de ComfyUI
				if (!ComfyUIWorkflowService.isValidComfyWorkflow(workflowData)) {
					throw new Error(`${file.name} no es un workflow válido de ComfyUI`);
				}

				// Insertar/actualizar en el store usando el contenido JSON
				await upsertWorkflow(text, file.name);
				return true;
			} catch (error) {
				console.error('Error processing workflow file:', file.name, error);
				options.onError?.(error instanceof Error ? error.message : `Error procesando ${file.name}`);
				return false;
			}
		},
		[upsertWorkflow, options]
	);

	// Procesar múltiples archivos
	const processFiles = useCallback(
		async (files: File[]) => {
			setIsProcessing(true);

			const workflowFiles = files.filter(isValidWorkflowFile);

			if (workflowFiles.length === 0) {
				options.onError?.('No se encontraron archivos JSON válidos');
				setIsProcessing(false);
				return;
			}

			let successCount = 0;

			for (const file of workflowFiles) {
				const success = await processWorkflowFile(file);
				if (success) {
					successCount++;
				}
			}

			if (successCount > 0) {
				options.onSuccess?.(successCount);
			}

			if (successCount === 0) {
				options.onError?.('No se pudieron procesar los archivos');
			} else if (successCount < workflowFiles.length) {
				options.onError?.(`Se procesaron ${successCount} de ${workflowFiles.length} archivos exitosamente`);
			}

			setIsProcessing(false);
		},
		[isValidWorkflowFile, processWorkflowFile, options]
	);

	// Handlers para drag & drop
	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Solo quitar el estado si realmente salimos del elemento
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragging(false);
		}
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) {
				processFiles(files);
			}
		},
		[processFiles]
	);

	// Handler para input de archivo
	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				processFiles(Array.from(files));
			}

			// Limpiar el input
			e.target.value = '';
		},
		[processFiles]
	);

	// Props para el área de drop
	const dropZoneProps = {
		onDragEnter: handleDragEnter,
		onDragLeave: handleDragLeave,
		onDragOver: handleDragOver,
		onDrop: handleDrop,
	};

	return {
		isDragging,
		isProcessing,
		dropZoneProps,
		handleFileInput,
		processFiles,
		isValidWorkflowFile,
	};
};
