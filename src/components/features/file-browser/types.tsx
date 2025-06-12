import type { FOLDER_EVENTS } from '@/services/folder-service-export';
import type { ProcessStatus } from '@/app/actions/folders/folder-types';

export type { ProcessStatus };

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}

export type { FOLDER_EVENTS };
