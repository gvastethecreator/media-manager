'use client';

import type { ComponentType } from 'react';
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
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2 rounded-md bg-primary/10 border-2 border-primary/10">
						<Icon className="h-5 w-5" />
					</div>
					<div className="flex-1">
						<p className="text-xs text-muted-foreground">{metric.name}</p>
						<p className="text-base font-semibold">
							{metric.value} / {metric.max}
						</p>
					</div>
				</div>
				<Progress value={percentage} className="h-1" />
			</CardContent>
		</Card>
	);
}
