/**
 * @file Operation Type Options
 * @module lib/operation-type-options
 * @description Define las opciones de tipos de operación para el sistema de progreso
 */

import { OperationType } from '@/types/file-browser/progress-tracking';

export const operationTypeOptions: { value: OperationType; label: string }[] = [
	{ value: 'file_copy', label: 'Copiar' },
	{ value: 'file_move', label: 'Mover' },
	{ value: 'file_delete', label: 'Eliminar' },
	{ value: 'file_compress', label: 'Comprimir' },
	{ value: 'file_extract', label: 'Extraer' },
	{ value: 'file_upload', label: 'Subir' },
	{ value: 'file_download', label: 'Descargar' },
	{ value: 'image_resize', label: 'Redimensionar imagen' },
	{ value: 'image_convert', label: 'Convertir imagen' },
	{ value: 'video_convert', label: 'Convertir video' },
	{ value: 'audio_convert', label: 'Convertir audio' },
	{ value: 'thumbnail_generate', label: 'Generar miniaturas' },
	{ value: 'metadata_extract', label: 'Extraer metadatos' },
	{ value: 'search_index', label: 'Indexar búsqueda' },
	{ value: 'backup_create', label: 'Crear respaldo' },
	{ value: 'backup_restore', label: 'Restaurar respaldo' },
	{ value: 'sync_files', label: 'Sincronizar archivos' },
	{ value: 'batch_operation', label: 'Operación por lotes' },
	{ value: 'custom', label: 'Personalizada' },
];
