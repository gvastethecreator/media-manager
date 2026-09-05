import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotesContentView from './notes-content-view';

vi.mock('@/lib/api/notes', () => ({
	useNotes: () => ({ data: { data: [] }, error: null, isLoading: false }),
}));

describe('NotesContentView', () => {
	it('shows English heading and empty title', () => {
		render(<NotesContentView />);
		expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
		expect(screen.getByText('No notes yet')).toBeInTheDocument();
		expect(screen.queryByText('Notas')).not.toBeInTheDocument();
	});
});
