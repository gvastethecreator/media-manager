'use client';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { createPropertySchema } from '@/lib/validations/property';
import type { z } from 'zod';

type PropertyCategory = z.infer<typeof createPropertySchema>['category'];

interface CategoryPickerProps {
	value: PropertyCategory;
	onChange: (value: PropertyCategory) => void;
}

const categories: Array<{ value: PropertyCategory; label: string; icon: string }> = [
	{ value: 'general', label: 'General', icon: '🔧' },
	{ value: 'technical', label: 'Técnico', icon: '⚙️' },
	{ value: 'artistic', label: 'Artístico', icon: '🎨' },
	{ value: 'management', label: 'Gestión', icon: '📊' },
];

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
	return (
		<Select
			value={value}
			onValueChange={(value: PropertyCategory) => onChange(value)}
		>
			<SelectTrigger>
				<SelectValue placeholder="Selecciona una categoría" />
			</SelectTrigger>
			<SelectContent>
				{categories.map(({ value, label, icon }) => (
					<SelectItem key={value} value={value}>
						<div className="flex items-center gap-2">
							<span role="img" aria-label="category icon">
								{icon}
							</span>
							<span>{label}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}