// Card para File3D

import { Box } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function File3DCard({ name, format }: { name: string; format: string }) {
	return (
		<Card className="flex cursor-pointer flex-col gap-2 p-4 transition hover:bg-muted/40">
			<div className="flex items-center gap-2">
				<Box className="h-4 w-4 text-indigo-500" />
				<span className="truncate font-semibold text-primary">{name}</span>
			</div>
			<span className="text-muted-foreground text-xs">{format.toUpperCase()}</span>
		</Card>
	);
}
