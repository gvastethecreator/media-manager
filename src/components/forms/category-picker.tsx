import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { createPropertySchema } from '@/types/validations/property';

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
		<Select onValueChange={(val: PropertyCategory) => onChange(val)} value={value}>
			<SelectTrigger>
				<SelectValue placeholder="Selecciona una categoría" />
			</SelectTrigger>
			<SelectContent>
				{categories.map(({ value: catValue, label, icon }) => (
					<SelectItem key={catValue} value={catValue}>
						<div className="flex items-center gap-2">
							<span aria-label="category icon" role="img">
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
