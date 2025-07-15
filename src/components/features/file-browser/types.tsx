import type { ProcessStatus } from '@/types/folders';

export type { ProcessStatus };

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}
