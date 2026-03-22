import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

export interface PageStateProps {
	actions?: ReactNode;
	className?: string;
	description?: string;
	heightClassName?: string;
	mode: 'loading' | 'error';
	title?: string;
}

export function PageState(props: PageStateProps) {
	const { mode, title, description, actions, heightClassName = 'h-[calc(100vh-8rem)]', className } = props;
	return (
		<div className={cn('flex items-center justify-center', heightClassName, className)}>
			<div className="text-center">
				{mode === 'loading' ? (
					<div className="flex flex-col items-center gap-3">
						<LoadingSpinner label={title ?? 'Cargando...'} showLabel size="lg" />
					</div>
				) : (
					<EmptyState
						actions={actions}
						description={description ?? 'Intenta de nuevo en unos segundos.'}
						icon={AlertCircle}
						iconVariant="error"
						title={title ?? 'Error al cargar'}
						variant="subtle"
					/>
				)}
			</div>
		</div>
	);
}
