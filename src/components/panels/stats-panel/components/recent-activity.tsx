import { AlertCircle, Clock } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/store/stats.store';
import { Activity } from './activity';

export function RecentActivity() {
	// Usar React Query hook en lugar de server action
	const { stats, loading, error } = useStats();

	if (loading) {
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
			<CardHeader className="px-0 py-2 mt-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
					<Clock className="h-3.5 w-3.5 text-primary" />
					Actividad Reciente
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 w-full space-y-0">
				{stats.recentActivity?.map((activity: any) => <Activity key={activity.id} activity={activity} />) || (
					<div className="text-muted-foreground text-sm p-2">No hay actividad reciente</div>
				)}
			</CardContent>
		</>
	);
}
