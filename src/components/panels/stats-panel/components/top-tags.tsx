import { AlertCircle, Tag } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/lib/hooks/system/use-stats';
import { TagUsage } from './tag-usage';

export function TopTags() {
	const { stats, isLoading, error } = useStats();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-4 gap-2">
				<Tag className="h-4 w-4 animate-pulse" />
				<span>Cargando etiquetas...</span>
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center p-4 text-destructive gap-2">
				<AlertCircle className="h-4 w-4" />
				<span>Error al cargar etiquetas más usadas</span>
			</div>
		);
	}

	return (
		<>
			<CardHeader className="px-0 py-2 mt-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
					<Tag className="h-3.5 w-3.5 text-primary" />
					Etiquetas Más Usadas
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 space-y-0.5 w-full">
				{stats.topTags?.map((tag) => (
					<TagUsage key={tag.id} tag={tag} />
				)) || <div className="text-muted-foreground text-sm p-2">No hay datos de etiquetas</div>}
			</CardContent>
		</>
	);
}
