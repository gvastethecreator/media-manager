export type { ProcessStatus } from '@/types/folders';

import type { ProcessStatus as ProcessStatusType } from '@/types/folders';

export interface ExtendedProcessStatus extends ProcessStatusType {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}
