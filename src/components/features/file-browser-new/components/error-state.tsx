/**
 * @file Componente de error del File Browser
 * @module file-browser-new/components/error-state
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
	/** Clase CSS adicional */
	className?: string;
	/** Mensaje de error */
	message?: string;
	/** Handler de reintento */
	onRetry?: () => void;
	/** Título del error */
	title?: string;
}

export function FileBrowserErrorState({
	title = 'Could not load files',
	message = 'Files could not be loaded. Please try again.',
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div
			className={cn('flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center', className)}
			data-testid="file-browser-error-state"
		>
			<div className="rounded-dt-lg bg-destructive/10 p-4">
				<AlertCircle className="h-10 w-10 text-destructive" />
			</div>
			<div className="space-y-2">
				<h3 className="heading-sm">{title}</h3>
				<p className="body-sm max-w-sm text-muted-foreground">{message}</p>
			</div>
			{onRetry && (
				<Button onClick={onRetry} variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			)}
		</div>
	);
}
