import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkipLinks } from './skip-links';

describe('SkipLinks', () => {
	it('keeps English skip targets in tab order without a document Tab listener', () => {
		render(<SkipLinks />);
		expect(screen.getByRole('button', { name: 'Skip to main content' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Skip to navigation' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Skip to main content' }).className).toContain('sr-only');
		expect(screen.getByRole('button', { name: 'Skip to main content' }).className).toContain('focus:not-sr-only');
	});
});
