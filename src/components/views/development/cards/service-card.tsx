import type { LucideIcon } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';

export interface ServiceStatus {
	name: string;
	status: 'online' | 'offline' | 'warning';
	description: string;
	icon: LucideIcon;
}

export function ServiceCard({ service }: { service: ServiceStatus }) {
	const { icon: Icon } = service;

	return (
		<Card className="relative h-full overflow-hidden border-2 border-primary/10">
			<CardHeader className="p-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								'rounded-md border-2 border-primary/10 p-2',
								service.status === 'online' && 'bg-success/20',
								service.status === 'warning' && 'bg-warning/20',
								service.status === 'offline' && 'bg-destructive/20'
							)}
						>
							<Icon className="h-4 w-4" />
						</div>
						<div>
							<CardTitle className="text-sm">{service.name}</CardTitle>
							<CardDescription className="truncate text-[10px]">{service.description}</CardDescription>
						</div>
					</div>
					<StatusBadge status={service.status} />
				</div>
			</CardHeader>
		</Card>
	);
}
