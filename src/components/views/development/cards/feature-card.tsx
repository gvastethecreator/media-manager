import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from './status-badge';

export interface Feature {
	name: string;
	status: 'completed' | 'in-progress' | 'pending' | 'failed';
	description: string;
	progress?: number;
}

export function FeatureCard({ feature }: { feature: Feature }) {
	return (
		<Card className="h-full border-2 border-primary/10">
			<CardContent className="px-3 py-1">
				<div className="relative mb-2 flex items-center justify-between">
					<div>
						<h3 className="font-medium text-sm">{feature.name}</h3>
						<p className="text-muted-foreground text-xs">{feature.description}</p>
					</div>
					<StatusBadge status={feature.status} />
				</div>
				{feature.progress !== undefined && (
					<div className="space-y-1">
						<Progress className="h-1" value={feature.progress} />
						<p className="text-right text-muted-foreground text-xs">{feature.progress}%</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
