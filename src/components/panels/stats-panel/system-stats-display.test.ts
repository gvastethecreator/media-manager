import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@/lib/api/client';
import { isAuthorizedStatsScopeUnavailable } from './system-stats-display';

describe('system stats authorized scope state', () => {
	it('treats the retired global aggregate as a scoped empty state, not an operational failure', () => {
		expect(
			isAuthorizedStatsScopeUnavailable(new ApiClientError(410, 'Scope required', {}, 'AUTHORIZED_SCOPE_REQUIRED'))
		).toBe(true);
		expect(isAuthorizedStatsScopeUnavailable(new Error('HTTP 500'))).toBe(false);
		expect(isAuthorizedStatsScopeUnavailable(null)).toBe(false);
	});
});
