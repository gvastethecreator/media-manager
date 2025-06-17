// Card para Document
import { Card } from '@/components/ui/card';

export function DocumentCard({ name, filePath }: { name: string; filePath: string }) {
	return (
		<Card className="p-4 flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition">
			<span className="font-semibold text-primary truncate">{name}</span>
			<span className="text-xs text-muted-foreground truncate">{filePath}</span>
		</Card>
	);
}
