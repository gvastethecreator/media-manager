import { z } from 'zod';
import { cn } from '@/lib/utils';

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
			<h3 className="font-medium text-sm">Filtros</h3>
			<div className="grid grid-cols-2 gap-2">
				{filters.map((filter) => (
					<div
						className={cn(
							'flex items-center justify-between rounded-md p-2',
							'bg-muted/50 transition-colors hover:bg-muted/70'
						)}
						key={`${filter.type}-${filter.operator}-${filter.value}`}
					>
						<span className="text-sm capitalize">{filter.type}</span>
						<span className="text-muted-foreground text-xs">{filter.operator}</span>
						<span className="font-medium text-sm">{filter.value.toString()}</span>
					</div>
				))}
			</div>
		</div>
	);
}
