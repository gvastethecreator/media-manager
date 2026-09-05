import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PropertiesContentView from './properties-content-view';

vi.mock('@/lib/api/properties', () => ({
	useProperties: () => ({ data: { data: [] }, error: null, isLoading: false }),
}));

describe('PropertiesContentView', () => {
	it('shows English heading and empty title', () => {
		render(<PropertiesContentView />);
		expect(screen.getByRole('heading', { name: 'Properties' })).toBeInTheDocument();
		expect(screen.getByText('No properties yet')).toBeInTheDocument();
		expect(screen.queryByText('Propiedades')).not.toBeInTheDocument();
	});
});
