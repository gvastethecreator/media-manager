import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmojiPicker } from './emoji-picker';

vi.mock('emoji-picker-react', () => ({
	default: () => <div data-testid="emoji-catalog" />,
}));

describe('EmojiPicker form controls', () => {
	it('keeps compact and quick-select buttons from submitting their parent form', () => {
		const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
		const change = vi.fn();
		const { rerender } = render(
			<form onSubmit={submit}>
				<EmojiPicker compact onChange={change} showLabel={false} value="🎭" />
			</form>
		);

		const trigger = screen.getByRole('button', { name: 'Change emoji 🎭' });
		expect(trigger).toHaveAttribute('type', 'button');
		fireEvent.click(trigger);
		expect(submit).not.toHaveBeenCalled();

		rerender(
			<form onSubmit={submit}>
				<EmojiPicker onChange={change} value="🎭" />
			</form>
		);
		const quickSelect = screen.getByRole('button', { name: 'Elegir emoji 📦' });
		expect(quickSelect).toHaveAttribute('type', 'button');
		fireEvent.click(quickSelect);
		expect(change).toHaveBeenCalledWith('📦');
		expect(submit).not.toHaveBeenCalled();
	});
});
