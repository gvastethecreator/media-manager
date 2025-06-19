import { ProcessStatus } from '@/app/actions/folders/folder-types';
import type { FOLDER_EVENTS } from '@/services/folder-service-export';

export { ProcessStatus };

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}

export type { FOLDER_EVENTS };
