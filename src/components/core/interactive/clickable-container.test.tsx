import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClickableContainer } from './clickable-container';

describe('ClickableContainer', () => {
	it('keeps a visible focus-visible ring on the button', () => {
		render(<ClickableContainer>Open</ClickableContainer>);
		const button = screen.getByRole('button', { name: 'Open' });
		expect(button).toHaveAttribute('type', 'button');
		expect(button.className).toContain('focus-visible:ring-2');
		expect(button.className).toContain('focus-visible:ring-ring');
	});
});
