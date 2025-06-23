import { cn } from '@/lib/utils';
import { z } from 'zod';

// Definir tipos locales ya que no están exportados
interface GroupFilter {
	type: string;
	operator: string;
	value: string | number | boolean;
}

// Esquema de validación local
const groupFilterSchema = z.object({
	type: z.string(),
	operator: z.string(),
	value: z.union([z.string(), z.number(), z.boolean()]),
});

interface GroupFiltersProps {
	filtersString: string;
}

export function GroupFilters({ filtersString }: GroupFiltersProps) {
	const parseFilters = (filtersStr: string): GroupFilter[] => {
		if (filtersStr === 'empty_array') return [];
		try {
			const parsed = JSON.parse(filtersStr);
			if (!Array.isArray(parsed)) return [];

			// Validar cada filtro con zod
			return parsed.filter((filter) => {
				try {
					groupFilterSchema.parse(filter);
					return true;
				} catch {
					console.error('Invalid filter:', filter);
					return false;
				}
			});
		} catch (error) {
			console.error('Error parsing filters:', error);
			return [];
		}
	};

	const filters = parseFilters(filtersString);

	if (filters.length === 0) return null;

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium">Filtros</h3>
			<div className="grid grid-cols-2 gap-2">
				{filters.map((filter) => (
					<div
						key={`${filter.type}-${filter.operator}-${filter.value}`}
						className={cn(
							'flex items-center justify-between p-2 rounded-md',
							'bg-muted/50 hover:bg-muted/70 transition-colors'
						)}
					>
						<span className="text-sm capitalize">{filter.type}</span>
						<span className="text-xs text-muted-foreground">{filter.operator}</span>
						<span className="text-sm font-medium">{filter.value.toString()}</span>
					</div>
				))}
			</div>
		</div>
	);
}
