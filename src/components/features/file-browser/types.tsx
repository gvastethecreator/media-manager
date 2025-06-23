import type { ProcessStatus } from '../../../app/actions/folders/types';

export type { ProcessStatus };

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}
