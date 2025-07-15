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
			<CardContent className="py-1 px-3">
				<div className="flex items-center justify-between mb-2 relative">
					<div>
						<h3 className="font-medium text-sm">{feature.name}</h3>
						<p className="text-xs text-muted-foreground">{feature.description}</p>
					</div>
					<StatusBadge status={feature.status} />
				</div>
				{feature.progress !== undefined && (
					<div className="space-y-1">
						<Progress value={feature.progress} className="h-1" />
						<p className="text-xs text-right text-muted-foreground">{feature.progress}%</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
