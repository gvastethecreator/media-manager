'use client';

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
		<Card className="relative overflow-hidden h-full border-2 border-primary/10">
			<CardHeader className="p-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								'p-2 rounded-md border-2 border-primary/10',
								service.status === 'online' && 'bg-green-500/20',
								service.status === 'warning' && 'bg-yellow-500/20',
								service.status === 'offline' && 'bg-red-500/20'
							)}
						>
							<Icon className="h-4 w-4" />
						</div>
						<div>
							<CardTitle className="text-sm">{service.name}</CardTitle>
							<CardDescription className="text-[10px] truncate">{service.description}</CardDescription>
						</div>
					</div>
					<StatusBadge status={service.status} />
				</div>
			</CardHeader>
		</Card>
	);
}
