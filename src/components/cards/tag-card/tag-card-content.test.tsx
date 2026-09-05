import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TagCardContent } from './tag-card-content';

describe('TagCardContent', () => {
	it('uses English relationship labels in TCG mode', () => {
		render(
			<TagCardContent
				notesCount={1}
				primaryColor="#fff"
				propertiesCount={1}
				shortcut="T"
				tcgMode
				worldItemsCount={1}
			/>
		);
		expect(screen.getByText('World items')).toBeInTheDocument();
		expect(screen.getByText('Notes')).toBeInTheDocument();
		expect(screen.getByText('Properties')).toBeInTheDocument();
		expect(screen.getByText('Shortcut:')).toBeInTheDocument();
		expect(screen.queryByText('Notas')).not.toBeInTheDocument();
		expect(screen.queryByText('Atajo:')).not.toBeInTheDocument();
	});
});
