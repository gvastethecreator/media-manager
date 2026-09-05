import { describe, expect, it } from 'vitest';
import { SETTINGS_TOASTS } from './settings-copy';

describe('SETTINGS_TOASTS', () => {
	it('keeps profile and settings toasts in English', () => {
		expect(SETTINGS_TOASTS.profileLoadFailed).toBe('Profiles could not be loaded');
		expect(SETTINGS_TOASTS.activeProfileFailed).toBe('The active profile could not be set');
		expect(SETTINGS_TOASTS.profileDeleted).toBe('Profile deleted');
		expect(SETTINGS_TOASTS.profileUpdateFailed).toBe('Profile could not be updated');
		for (const message of Object.values(SETTINGS_TOASTS)) {
			expect(message).toMatch(/^[A-Za-z]/);
			expect(message).not.toMatch(/[áéíóúñ]/i);
		}
	});
});
