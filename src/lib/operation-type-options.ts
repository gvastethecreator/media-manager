/**
 * @file Operation Type Options
 * @module lib/operation-type-options
 * @description Define las opciones de tipos de operación para el sistema de progreso
 */

import { OperationType } from '@/types/file-browser/progress-tracking';

export const operationTypeOptions: { value: OperationType; label: string }[] = [
	{ value: 'file_copy', label: 'Copy' },
	{ value: 'file_move', label: 'Move' },
	{ value: 'file_delete', label: 'Delete' },
	{ value: 'file_compress', label: 'Compress' },
	{ value: 'file_extract', label: 'Extract' },
	{ value: 'file_upload', label: 'Upload' },
	{ value: 'file_download', label: 'Download' },
	{ value: 'image_resize', label: 'Resize image' },
	{ value: 'image_convert', label: 'Convert image' },
	{ value: 'video_convert', label: 'Convert video' },
	{ value: 'audio_convert', label: 'Convert audio' },
	{ value: 'thumbnail_generate', label: 'Generate thumbnails' },
	{ value: 'metadata_extract', label: 'Extract metadata' },
	{ value: 'search_index', label: 'Index search' },
	{ value: 'backup_create', label: 'Create backup' },
	{ value: 'backup_restore', label: 'Restore backup' },
	{ value: 'sync_files', label: 'Sync files' },
	{ value: 'batch_operation', label: 'Batch operation' },
	{ value: 'custom', label: 'Custom' },
];
