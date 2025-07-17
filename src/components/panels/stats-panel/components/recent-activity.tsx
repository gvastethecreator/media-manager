import { AlertCircle, Clock } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/lib/hooks/system/use-stats';
import { Activity } from './activity';

export function RecentActivity() {
	// Usar React Query hook en lugar de server action
	const { data: stats, isLoading, error } = useStats();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-4 gap-2">
				<Clock className="h-4 w-4 animate-pulse" />
				<span>Cargando actividad...</span>
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center p-4 text-destructive gap-2">
				<AlertCircle className="h-4 w-4" />
				<span>Error al cargar actividad reciente</span>
			</div>
		);
	}

	return (
		<>
			<CardHeader className="p-0 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<Clock className="h-4 w-4 text-primary" />
					Actividad Reciente
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2 space-y-1">
				{stats.recentActivity.map((activity: RecentActivity) => (
					<Activity key={activity.id} activity={activity} />
				))}
			</CardContent>
		</>
	);
}
