'use client';

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './status-badge';

export interface Issue {
	id: string;
	title: string;
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	status: 'open' | 'in-progress' | 'resolved';
}

export function IssueCard({ issue }: { issue: Issue }) {
	const getSeverityIcon = () => {
		switch (issue.severity) {
			case 'critical':
				return <XCircle className="h-4 w-4 text-red-500" />;
			case 'high':
				return <AlertTriangle className="h-4 w-4 text-orange-500" />;
			case 'medium':
				return <Info className="h-4 w-4 text-yellow-500" />;
			case 'low':
				return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		}
	};

	return (
		<Card className="h-full border-2 border-primary/10 relative">
			<CardContent className="p-3">
				<div className="flex items-start gap-3">
					<div className="mt-0.5">{getSeverityIcon()}</div>
					<div className="flex-1">
						<div className="flex items-center justify-between mb-1">
							<h3 className="font-medium text-sm">{issue.title}</h3>
							<StatusBadge status={issue.status} />
						</div>
						<p className="text-xs text-muted-foreground">{issue.description}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
