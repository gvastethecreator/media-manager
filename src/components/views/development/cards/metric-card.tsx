'use client';

import type { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SystemMetric {
	name: string;
	value: number | string;
	unit: string;
	icon: ComponentType<{ className?: string }>;
	change?: {
		value: number;
		type: 'increase' | 'decrease';
	};
	chart?: {
		data: number[];
		labels: string[];
	};
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
					<div className="p-2 rounded-md bg-primary/10 border-2 border-primary/10">
						<Icon className="h-7 w-7" />
					</div>
					<div className="flex-1">
						<p className="text-sm text-muted-foreground">{metric.name}</p>
						<div className="flex items-end gap-2">
							<p className="text-xl font-semibold">
								{metric.value}
								<span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
							</p>
							{metric.change && (
								<div
									className={cn(
										'text-xs font-medium flex items-center gap-1',
										metric.change.type === 'increase' ? 'text-green-500' : 'text-red-500'
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
								key={`chart-bar-${metric.name}-${index}`}
								className="inline-block w-[6px] mx-[2px] bg-primary/20 rounded-sm"
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
