// Card para JsonFile

import { Database } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function JsonFileCard({ name }: { name: string }) {
	return (
		<Card className="flex cursor-pointer flex-col gap-2 p-4 transition hover:bg-muted/40">
			<div className="flex items-center gap-2">
				<Database className="h-4 w-4 text-pink-500" />
				<span className="truncate font-semibold text-primary">{name}</span>
			</div>
			<span className="text-muted-foreground text-xs">JSON</span>
		</Card>
	);
}
