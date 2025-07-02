import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
	const getStatusColor = () => {
		switch (status) {
			case 'online':
			case 'completed':
			case 'resolved':
				return 'bg-green-500/20 text-green-500 hover:bg-green-500/30';
			case 'warning':
			case 'in-progress':
				return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30';
			case 'offline':
			case 'failed':
			case 'critical':
				return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
			case 'pending':
				return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30';
			default:
				return 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30';
		}
	};

	return (
		<Badge
			variant="secondary"
			className={cn(
				'transition-colors text-[10px] absolute top-2 right-2 p-2 h-4 rounded-lg border-2 border-primary/10',
				getStatusColor()
			)}
		>
			{status}
		</Badge>
	);
}
