import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
	const getStatusColor = () => {
		switch (status) {
			case 'online':
			case 'completed':
			case 'resolved':
				return 'bg-success/20 text-success hover:bg-success/30';
			case 'warning':
			case 'in-progress':
				return 'bg-warning/20 text-warning hover:bg-warning/30';
			case 'offline':
			case 'failed':
			case 'critical':
				return 'bg-destructive/20 text-destructive hover:bg-destructive/30';
			case 'pending':
				return 'bg-primary/20 text-primary hover:bg-primary/30';
			default:
				return 'bg-muted/20 text-muted-foreground hover:bg-muted/30';
		}
	};

	return (
		<Badge
			className={cn(
				'absolute top-2 right-2 h-4 rounded-lg border-2 border-primary/10 p-2 text-[10px] transition-colors',
				getStatusColor()
			)}
			variant="secondary"
		>
			{status}
		</Badge>
	);
}
