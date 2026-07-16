export type RuntimeHealthStatus = 'starting' | 'ready' | 'degraded' | 'stopping';

export interface RuntimeHealthSnapshot {
	changedAt: string;
	status: RuntimeHealthStatus;
}

export interface RuntimeHealthController {
	getSnapshot(): RuntimeHealthSnapshot;
	transition(status: RuntimeHealthStatus): RuntimeHealthSnapshot;
}

export function createRuntimeHealthController(clock: () => Date = () => new Date()): RuntimeHealthController {
	let snapshot: RuntimeHealthSnapshot = {
		changedAt: clock().toISOString(),
		status: 'starting',
	};
	return {
		getSnapshot: () => ({ ...snapshot }),
		transition: (status) => {
			snapshot = { changedAt: clock().toISOString(), status };
			return { ...snapshot };
		},
	};
}
