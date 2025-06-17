// Card para JsonFile

import { Database } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function JsonFileCard({ name }: { name: string }) {
	return (
		<Card className="p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition">
			<div className="flex items-center gap-2">
				<Database className="h-4 w-4 text-pink-500" />
				<span className="font-semibold text-primary truncate">{name}</span>
			</div>
			<span className="text-xs text-muted-foreground">JSON</span>
		</Card>
	);
}
