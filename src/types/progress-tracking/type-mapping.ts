/**
 * @file Operation Type Mapping
 * @module types/progress-tracking/type-mapping
 * @description Define el mapeo de tipos entre el servicio y la interfaz de usuario
 */

import type { OperationType as UIOperationType } from '@/types/file-browser/progress-tracking';
import type { OperationType as ServiceOperationType } from '@/types/progress-tracking/progress-info';

/**
 * Mapea un tipo de operación del servicio al tipo de la UI
 */
export function mapServiceToUIOperationType(type: ServiceOperationType): UIOperationType {
	switch (type) {
		case 'copy':
			return 'file_copy';
		case 'move':
			return 'file_move';
		case 'delete':
			return 'file_delete';
		case 'download':
			return 'file_download';
		case 'upload':
			return 'file_upload';
		case 'compress':
			return 'file_compress';
		case 'extract':
			return 'file_extract';
		default:
			return 'custom';
	}
}

/**
 * Mapea un tipo de operación de la UI al tipo del servicio
 */
export function mapUIToServiceOperationType(type: UIOperationType): ServiceOperationType {
	switch (type) {
		case 'file_copy':
			return 'copy';
		case 'file_move':
			return 'move';
		case 'file_delete':
			return 'delete';
		case 'file_download':
			return 'download';
		case 'file_upload':
			return 'upload';
		case 'file_compress':
			return 'compress';
		case 'file_extract':
			return 'extract';
		default:
			return 'custom' as ServiceOperationType;
	}
}

/**
 * Mapea una operación del servicio a una operación de la UI
 */
export function mapServiceToUIOperation(operation: any): any {
	return {
		...operation,
		type: mapServiceToUIOperationType(operation.type),
	};
}

/**
 * Mapea una operación de la UI a una operación del servicio
 */
export function mapUIToServiceOperation(operation: any): any {
	return {
		...operation,
		type: mapUIToServiceOperationType(operation.type),
	};
}
