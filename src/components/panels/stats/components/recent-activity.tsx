import { getSystemStats } from "@/app/actions/stats/stats.actions";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Activity } from "./activity";

export async function RecentActivity() {
	const stats = await getSystemStats();

	return (
		<>
			<CardHeader className="p-0 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<Clock className="h-4 w-4 text-primary" />
					Actividad Reciente
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2 space-y-1">
				{stats.recentActivity.map((activity) => (
					<Activity key={activity.id} activity={activity} />
				))}
			</CardContent>
		</>
	);
}
