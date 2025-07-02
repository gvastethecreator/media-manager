import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
	const sizeClasses = {
		sm: 'h-3 w-3',
		md: 'h-4 w-4',
		lg: 'h-6 w-6',
	};

	return (
		<div className={cn('flex items-center justify-center', className)}>
			<Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
			<span className="sr-only">Cargando...</span>
		</div>
	);
}
