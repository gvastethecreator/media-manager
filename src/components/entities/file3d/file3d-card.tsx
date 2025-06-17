// Card para File3D
import { Card } from '@/components/ui/card';
import { Box } from 'lucide-react';

export function File3DCard({ name, format }: { name: string; format: string }) {
	return (
		<Card className="p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition">
			<div className="flex items-center gap-2">
				<Box className="h-4 w-4 text-indigo-500" />
				<span className="font-semibold text-primary truncate">{name}</span>
			</div>
			<span className="text-xs text-muted-foreground">{format.toUpperCase()}</span>
		</Card>
	);
}
