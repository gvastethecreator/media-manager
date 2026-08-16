import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './status-badge';

export interface Issue {
	description: string;
	id: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	status: 'open' | 'in-progress' | 'resolved';
	title: string;
}

export function IssueCard({ issue }: { issue: Issue }) {
	const getSeverityIcon = () => {
		switch (issue.severity) {
			case 'critical':
				return <XCircle className="h-4 w-4 text-destructive" />;
			case 'high':
				return <AlertTriangle className="h-4 w-4 text-warning" />;
			case 'medium':
				return <Info className="h-4 w-4 text-warning" />;
			case 'low':
				return <CheckCircle2 className="h-4 w-4 text-success" />;
			default:
				return <Info className="h-4 w-4 text-muted-foreground" />;
		}
	};

	return (
		<Card className="relative h-full border-2 border-primary/10">
			<CardContent className="p-3">
				<div className="flex items-start gap-3">
					<div className="mt-0.5">{getSeverityIcon()}</div>
					<div className="flex-1">
						<div className="mb-1 flex items-center justify-between">
							<h3 className="font-medium text-sm">{issue.title}</h3>
							<StatusBadge status={issue.status} />
						</div>
						<p className="text-muted-foreground text-xs">{issue.description}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
