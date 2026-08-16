import { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SystemMetric {
	change?: {
		value: number;
		type: 'increase' | 'decrease';
	};
	chart?: {
		data: number[];
		labels: string[];
	};
	icon: ComponentType<{ className?: string }>;
	name: string;
	unit: string;
	value: number | string;
}

export function MetricCard({ metric }: { metric: SystemMetric }) {
	const Icon = metric.icon;

	// Calcular valores para el gráfico si existe
	const chartData = metric.chart?.data || [];
	const maxChartValue = chartData.length > 0 ? Math.max(...chartData) : 1;

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardContent className="p-3">
				<div className="flex items-center gap-4">
					<div className="rounded-md border-2 border-primary/10 bg-primary/10 p-2">
						<Icon className="h-7 w-7" />
					</div>
					<div className="flex-1">
						<p className="text-muted-foreground text-sm">{metric.name}</p>
						<div className="flex items-end gap-2">
							<p className="font-semibold text-xl">
								{metric.value}
								<span className="ml-1 text-muted-foreground text-sm">{metric.unit}</span>
							</p>
							{metric.change && (
								<div
									className={cn(
										'flex items-center gap-1 font-medium text-xs',
										metric.change.type === 'increase' ? 'text-success' : 'text-destructive'
									)}
								>
									{metric.change.type === 'increase' ? '+' : '-'}
									{metric.change.value}%
								</div>
							)}
						</div>
					</div>
				</div>
				{metric.chart && (
					<div className="mt-2 h-[50px]">
						{chartData.map((value, index) => (
							<div
								className="mx-[2px] inline-block w-[6px] rounded-sm bg-primary/20"
								key={`chart-bar-${metric.name}-${index}`}
								style={{
									height: `${(value / maxChartValue) * 100}%`,
								}}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
