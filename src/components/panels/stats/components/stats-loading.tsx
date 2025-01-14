"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/core/icons";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsLoading() {
	return (
		<>
			<CardHeader className="p-0 py-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<Icons.BarChart className="h-4 w-4 text-primary" />
					Estadísticas generales
				</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-2 p-0 gap-2">
				{Array(13)
					.fill(null)
					.map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between p-2 rounded-lg border bg-card text-card-foreground shadow-sm"
						>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-20" />
							</div>
							<Skeleton className="h-4 w-12" />
						</div>
					))}
			</CardContent>

			<CardHeader className="px-0 py-2 mt-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<Icons.Tag className="h-4 w-4 text-primary" />
					Etiquetas Más Usadas
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 space-y-1 w-full gap-2">
				{Array(5)
					.fill(null)
					.map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between py-1.5 px-2"
						>
							<Skeleton className="h-5 w-24" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-1.5 w-24" />
								<Skeleton className="h-5 w-12" />
							</div>
						</div>
					))}
			</CardContent>

			<CardHeader className="p-0 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<Icons.Clock className="h-4 w-4 text-primary" />
					Actividad Reciente
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2 space-y-1">
				{Array(5)
					.fill(null)
					.map((_, i) => (
						<div key={i} className="flex items-center justify-between py-1.5">
							<div className="flex items-center gap-2">
								<Skeleton className="h-8 w-8" />
								<div className="space-y-1">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
						</div>
					))}
			</CardContent>
		</>
	);
}
