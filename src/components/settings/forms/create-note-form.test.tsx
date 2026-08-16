import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoteBase } from '@/types/entities/note/types';
import { CreateNoteForm } from './create-note-form';

const apiMocks = vi.hoisted(() => ({
	create: { mutateAsync: vi.fn() },
	getArtifact: vi.fn(),
	update: { mutateAsync: vi.fn() },
}));

vi.mock('@/lib/api/notes', () => ({
	useCreateNote: () => apiMocks.create,
	useUpdateNote: () => apiMocks.update,
}));

vi.mock('@/lib/api/taxonomy-artifacts', () => ({
	getTaxonomyArtifactOrNull: apiMocks.getArtifact,
}));

const note = {
	category: 'general',
	color: 'var(--entity-note)',
	content: 'Original body',
	emoji: '📝',
	id: 'note-1',
	summary: 'Original summary',
	tags: [],
	title: 'Original title',
} as unknown as NoteBase;

describe('CreateNoteForm', () => {
	beforeEach(() => {
		apiMocks.getArtifact.mockReset();
		apiMocks.getArtifact.mockResolvedValue(null);
	});

	it('preserves the draft when the parent rerenders the same Note identity', async () => {
		const view = render(<CreateNoteForm isEditing note={note} />);
		const title = await screen.findByPlaceholderText('Note title');

		fireEvent.change(title, { target: { value: 'Unsaved draft' } });
		view.rerender(<CreateNoteForm isEditing note={{ ...note }} />);

		await waitFor(() => expect(title).toHaveValue('Unsaved draft'));
		expect(apiMocks.getArtifact).toHaveBeenCalledTimes(1);
	});
});
