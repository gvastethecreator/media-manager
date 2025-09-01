import { cn } from '@/lib/utils';

interface FolderProgressIndicatorProps {
	isReindexing: boolean;
	showCompleteAnimation: boolean;
	lastProgress: number;
}

export function FolderProgressIndicator({
	isReindexing,
	showCompleteAnimation,
	lastProgress,
}: FolderProgressIndicatorProps) {
	if (!(isReindexing || showCompleteAnimation)) {
		return null;
	}

	return (
		<div
			className={cn(
				'absolute inset-x-0 top-0 h-0.5 overflow-hidden',
				showCompleteAnimation ? 'bg-emerald-400/50' : 'bg-primary/10'
			)}
		>
			<div
				className={cn('h-full', showCompleteAnimation ? 'bg-emerald-400' : 'bg-primary')}
				style={{ width: `${lastProgress}%` }}
			/>
		</div>
	);
}
