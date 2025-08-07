import { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface ProcessingMetric {
	name: string;
	value: number;
	max: number;
	icon: ComponentType<{ className?: string }>;
}

export function ProcessingMetricCard({ metric }: { metric: ProcessingMetric }) {
	const Icon = metric.icon;
	const percentage = (metric.value / metric.max) * 100;

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardContent className="p-3 py-2">
				<div className="mb-2 flex items-center gap-3">
					<div className="rounded-md border-2 border-primary/10 bg-primary/10 p-2">
						<Icon className="h-5 w-5" />
					</div>
					<div className="flex-1">
						<p className="text-muted-foreground text-xs">{metric.name}</p>
						<p className="font-semibold text-base">
							{metric.value} / {metric.max}
						</p>
					</div>
				</div>
				<Progress className="h-1" value={percentage} />
			</CardContent>
		</Card>
	);
}
