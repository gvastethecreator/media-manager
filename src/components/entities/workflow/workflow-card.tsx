// Card para Workflow

import { Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function WorkflowCard({ name }: { name: string }) {
	return (
		<Card className="p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition">
			<div className="flex items-center gap-2">
				<Lightbulb className="h-4 w-4 text-lime-500" />
				<span className="font-semibold text-primary truncate">{name}</span>
			</div>
			<span className="text-xs text-muted-foreground">Workflow JSON</span>
		</Card>
	);
}
