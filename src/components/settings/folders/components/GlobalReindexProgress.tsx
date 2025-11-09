import { AlertCircle, RefreshCw } from 'lucide-react';
import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getStatusMessage } from '../utils/status-message';

interface GlobalReindexProgressProps {
	processStatus: any;
	isGloballyProcessing: boolean;
	currentFolderName?: string;
}

export const GlobalReindexProgress = memo(function GlobalReindexProgress({
	processStatus,
	isGloballyProcessing,
	currentFolderName,
}: GlobalReindexProgressProps) {
	if (!isGloballyProcessing || !processStatus) return null;

	const isProcessing = processStatus.isProcessing ?? isGloballyProcessing;
	const statusMessage = getStatusMessage(isGloballyProcessing, false, isProcessing);

	return (
		<div
			className={cn(
				'rounded-sm border p-4 shadow-sm transition-colors',
				processStatus.status === 'error' ? 'border-destructive bg-destructive/5' : 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
			)}
		>
			<div className="mb-3 flex items-center gap-2">
				{processStatus.status === 'error' ? (
					<AlertCircle className="h-4 w-4 text-destructive" />
				) : (
					<RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
				)}
				<span className="font-medium text-sm">{statusMessage}</span>
				{currentFolderName && (
					<span className="text-muted-foreground text-sm">
						{' - '}
						{currentFolderName}
					</span>
				)}
			</div>
			{processStatus.status !== 'error' && (
				<>
					<Progress className="mb-2" value={processStatus.percentage || 0} />
					<div className="flex items-center justify-between text-muted-foreground text-xs">
						<span>
							{processStatus.current} / {processStatus.total} archivos
						</span>
						<span>{processStatus.percentage?.toFixed(1)}%</span>
					</div>
				</>
			)}
		</div>
	);
});
