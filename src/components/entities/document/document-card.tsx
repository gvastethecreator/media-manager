// Card para Document
import { Card } from '@/components/ui/card';

export function DocumentCard({ name, filePath }: { name: string; filePath: string }) {
	return (
		<Card className="flex cursor-pointer flex-col gap-2 p-4 transition hover:bg-muted/40">
			<span className="truncate font-semibold text-primary">{name}</span>
			<span className="truncate text-muted-foreground text-xs">{filePath}</span>
		</Card>
	);
}
