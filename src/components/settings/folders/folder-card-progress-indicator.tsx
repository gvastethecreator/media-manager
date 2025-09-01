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
				'absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-xl',
				'slide-in-from-top-1 animate-in duration-300',
				showCompleteAnimation ? 'bg-emerald-400/30' : 'bg-primary/20'
			)}
		>
			<div
				className={cn(
					'h-full transition-all duration-500 ease-out',
					showCompleteAnimation
						? 'animate-pulse bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400'
						: 'bg-gradient-to-r from-primary via-primary/80 to-primary'
				)}
				style={{ width: `${lastProgress}%` }}
			>
				{/* Shimmer effect en modo progreso */}
				{isReindexing && !showCompleteAnimation && (
					<div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
				)}
			</div>
		</div>
	);
}
