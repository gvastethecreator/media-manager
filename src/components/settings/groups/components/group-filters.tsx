import { cn } from '@/lib/utils';
import { type GroupFilter, groupFilterSchema } from '@/types/entities/group/types';

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
			return parsed.filter(filter => {
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