/**
 * Tests for PresetForm component
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { PresetForm } from '../preset-form';

// Mock the UI components that have complex implementations
vi.mock('@/components/ui/color-picker', () => ({
	ColorPicker: ({ value, onChange }: any) => (
		<input
			data-testid="color-picker"
			onChange={(e) => onChange(e.target.value)}
			type="color"
			value={value}
		/>
	),
}));

vi.mock('@/components/ui/emoji-picker', () => ({
	EmojiPicker: ({ value, onEmojiSelect }: any) => (
		<button data-testid="emoji-picker" onClick={() => onEmojiSelect('😀')} type="button">
			{value}
		</button>
	),
}));

vi.mock('./preset-selector', () => ({
	PresetSelector: ({ presets, selectedPresetId, onSelectPreset }: any) => (
		<div data-testid="preset-selector">
			<select onChange={(e) => onSelectPreset(e.target.value)} value={selectedPresetId}>
				{presets.map((preset: any) => (
					<option key={preset.id} value={preset.id}>
						{preset.name}
					</option>
				))}
			</select>
		</div>
	),
}));

vi.mock('@/components/ui/featured-image-selector', () => ({
	FeaturedImageSelector: ({ currentFeaturedImage, onSelect }: any) => (
		<div data-testid="featured-image-selector">
			<button onClick={() => onSelect('test-image-id')} type="button">
				Select Featured Image
			</button>
			{currentFeaturedImage && <div>Current: {currentFeaturedImage}</div>}
		</div>
	),
}));

describe('PresetForm', () => {
	const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
	const mockOnCancel = vi.fn();

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should render form for character entity type', () => {
		const { getByText, getByLabelText } = render(
			<PresetForm entityType="character" onSubmit={mockOnSubmit} submitLabel="Crear Personaje" />
		);

		// Should show submit button with correct label
		expect(getByText('Crear Personaje')).toBeInTheDocument();

		// Should show name field (always required)
		expect(getByLabelText(/nombre/i)).toBeInTheDocument();
	});

	it('should render preset selector in creation mode', () => {
		const { getByText } = render(<PresetForm entityType="character" onSubmit={mockOnSubmit} />);

		// Should show preset selector with preset options
		expect(getByText('Nivel de Detalle')).toBeInTheDocument();
		expect(getByText('Mínimo')).toBeInTheDocument();
	});

	it('should not render preset selector in edit mode', () => {
		const { queryByText } = render(<PresetForm entityType="character" isEditing={true} onSubmit={mockOnSubmit} />);

		// Should NOT show preset selector in edit mode
		expect(queryByText('Nivel de Detalle')).not.toBeInTheDocument();
	});

	it('should show cancel button when onCancel is provided', () => {
		const { getByText } = render(
			<PresetForm entityType="character" onCancel={mockOnCancel} onSubmit={mockOnSubmit} />
		);

		expect(getByText('Cancelar')).toBeInTheDocument();
	});

	it('should not show cancel button when onCancel is not provided', () => {
		const { queryByText } = render(<PresetForm entityType="character" onSubmit={mockOnSubmit} />);

		expect(queryByText('Cancelar')).not.toBeInTheDocument();
	});

	it('should call onCancel when cancel button is clicked', () => {
		const { getByText } = render(
			<PresetForm entityType="character" onCancel={mockOnCancel} onSubmit={mockOnSubmit} />
		);

		fireEvent.click(getByText('Cancelar'));
		expect(mockOnCancel).toHaveBeenCalledTimes(1);
	});

	it('should show validation error when submitting empty name', async () => {
		const { getByRole, getByText, getByLabelText } = render(
			<PresetForm entityType="character" onSubmit={mockOnSubmit} />
		);

		// Fill name field first, then clear it
		const nameInput = getByLabelText(/nombre/i);
		fireEvent.change(nameInput, { target: { value: 'Test' } });
		fireEvent.change(nameInput, { target: { value: '' } });

		// Try to submit with empty name
		const submitButton = getByRole('button', { name: /crear/i });
		fireEvent.submit(submitButton.closest('form')!);

		// Should show error message
		await waitFor(() => {
			expect(getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
		});

		// Should not call onSubmit
		expect(mockOnSubmit).not.toHaveBeenCalled();
	});

	it('should call onSubmit with form data when valid', async () => {
		const { getByRole, getByLabelText } = render(
			<PresetForm entityType="character" onSubmit={mockOnSubmit} submitLabel="Crear" />
		);

		// Fill in name field
		const nameInput = getByLabelText(/nombre/i);
		fireEvent.change(nameInput, { target: { value: 'Test Character' } });

		// Submit form
		const submitButton = getByRole('button', { name: /crear/i });
		fireEvent.click(submitButton);

		// Should call onSubmit with data
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Test Character',
				})
			);
		});
	});

	it('should disable submit button while submitting', async () => {
		const slowSubmit = vi.fn().mockImplementation(
			() =>
				new Promise((resolve) => {
					setTimeout(resolve, 100);
				})
		);

		const { getByRole, getByLabelText } = render(<PresetForm entityType="character" onSubmit={slowSubmit} />);

		// Fill in name
		const nameInput = getByLabelText(/nombre/i);
		fireEvent.change(nameInput, { target: { value: 'Test' } });

		// Click submit
		const submitButton = getByRole('button', { name: /crear/i });
		fireEvent.click(submitButton);

		// Button should be disabled during submission
		await waitFor(() => {
			expect(submitButton).toBeDisabled();
		});
	});

	it('should populate form with initial data in edit mode', () => {
		const initialData = {
			name: 'Existing Character',
			description: 'Test description',
		};

		const { getByLabelText } = render(
			<PresetForm entityType="character" initialData={initialData} isEditing={true} onSubmit={mockOnSubmit} />
		);

		// Should show initial values
		const nameInput = getByLabelText(/nombre/i) as HTMLInputElement;
		expect(nameInput.value).toBe('Existing Character');
	});

	it('should show error message when onSubmit fails', async () => {
		const failingSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));

		const { getByRole, getByLabelText, getByText } = render(
			<PresetForm entityType="character" onSubmit={failingSubmit} />
		);

		// Fill and submit
		const nameInput = getByLabelText(/nombre/i);
		fireEvent.change(nameInput, { target: { value: 'Test' } });

		const submitButton = getByRole('button', { name: /crear/i });
		fireEvent.click(submitButton);

		// Should show error
		await waitFor(() => {
			expect(getByText(/submit failed/i)).toBeInTheDocument();
		});
	});

	it('should render error message for invalid entity type', () => {
		const { getByText } = render(<PresetForm entityType="invalid-type" onSubmit={mockOnSubmit} />);

		expect(getByText(/no hay configuración de presets disponible/i)).toBeInTheDocument();
	});

	it('should change fields when preset is changed', async () => {
		const { getByText, getByLabelText } = render(<PresetForm entityType="character" onSubmit={mockOnSubmit} />);

		// Initially showing minimal preset (only name and emoji)
		expect(getByLabelText(/nombre/i)).toBeInTheDocument();

		// Click on "Completo" preset button
		const completoButton = getByText('Completo').closest('button');
		expect(completoButton).toBeInTheDocument();
		fireEvent.click(completoButton!);

		// Form should now show more fields from complete preset
		await waitFor(() => {
			// Complete preset should show description field
			expect(getByLabelText(/descripción/i)).toBeInTheDocument();
		});
	});

	it('should handle different entity types correctly', () => {
		const entityTypes = ['character', 'place', 'concept', 'tag', 'collection', 'note', 'prompt'];

		for (const entityType of entityTypes) {
			const { getByLabelText, unmount } = render(<PresetForm entityType={entityType} onSubmit={mockOnSubmit} />);

			// All entity types should have a name field (note uses "Título" instead of "Nombre")
			if (entityType === 'note') {
				expect(getByLabelText(/título/i)).toBeInTheDocument();
			} else {
				expect(getByLabelText(/nombre/i)).toBeInTheDocument();
			}

			unmount();
		}
	});

	it('should reset form after successful creation', async () => {
		const { getByRole, getByLabelText } = render(<PresetForm entityType="character" onSubmit={mockOnSubmit} />);

		// Fill form
		const nameInput = getByLabelText(/nombre/i) as HTMLInputElement;
		fireEvent.change(nameInput, { target: { value: 'Test Character' } });

		// Submit
		const submitButton = getByRole('button', { name: /crear/i });
		fireEvent.click(submitButton);

		// Wait for submission to complete
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalled();
		});

		// Form should be reset (name should be empty)
		await waitFor(() => {
			expect(nameInput.value).toBe('');
		});
	});

	it('should not reset form after edit', async () => {
		const { getByRole, getByLabelText } = render(
			<PresetForm
				entityType="character"
				initialData={{ name: 'Original Name' }}
				isEditing={true}
				onSubmit={mockOnSubmit}
			/>
		);

		// Change name
		const nameInput = getByLabelText(/nombre/i) as HTMLInputElement;
		fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

		// Submit
		const submitButton = getByRole('button', { name: /crear/i });
		fireEvent.click(submitButton);

		// Wait for submission
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalled();
		});

		// In edit mode, form should NOT be reset
		expect(nameInput.value).toBe('Updated Name');
	});

	it('should disable submit button when name is empty', () => {
		const { getByRole } = render(<PresetForm entityType="character" onSubmit={mockOnSubmit} />);

		const submitButton = getByRole('button', { name: /crear/i });
		expect(submitButton).toBeDisabled();
	});

	it('should enable submit button when name is filled', async () => {
		const { getByRole, getByLabelText } = render(<PresetForm entityType="character" onSubmit={mockOnSubmit} />);

		const nameInput = getByLabelText(/nombre/i);
		fireEvent.change(nameInput, { target: { value: 'Test' } });

		const submitButton = getByRole('button', { name: /crear/i });

		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});
	});
});
