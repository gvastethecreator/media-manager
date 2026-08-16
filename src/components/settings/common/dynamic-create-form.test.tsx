import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DynamicCreateForm } from './dynamic-create-form';

function RejectingHarness() {
	const [, setAttempt] = useState(0);

	return (
		<DynamicCreateForm
			alwaysVisibleFields={['content']}
			initialData={{ content: 'Original body', name: 'Original title' }}
			onSubmit={async () => {
				setAttempt((attempt) => attempt + 1);
				await Promise.resolve();
				throw new Error('Version conflict');
			}}
			optionalFields={[
				{
					label: 'Contenido',
					name: 'content',
					render: ({ onChange, value }) => (
						<textarea aria-label="Contenido" onChange={(event) => onChange(event.target.value)} value={String(value)} />
					),
				},
			]}
		/>
	);
}

describe('DynamicCreateForm', () => {
	it('preserves the edited draft when a parent rerender precedes a rejected save', async () => {
		render(<RejectingHarness />);
		const name = screen.getByLabelText('Name');
		const content = screen.getByLabelText('Contenido');

		fireEvent.change(name, { target: { value: 'Draft title' } });
		fireEvent.change(content, { target: { value: 'Draft body' } });
		fireEvent.click(screen.getByRole('button', { name: 'Create' }));

		await screen.findByText('Version conflict');
		await waitFor(() => {
			expect(name).toHaveValue('Draft title');
			expect(content).toHaveValue('Draft body');
		});
	});
});
