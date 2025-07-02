import { cn } from '@/lib/utils';
import * as React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	orientation?: 'horizontal' | 'vertical';
	decorative?: boolean;
}

function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: SeparatorProps) {
	return (
		<div
			data-slot="separator"
			data-orientation={orientation}
			role={decorative ? 'none' : 'separator'}
			className={cn(
				'bg-border shrink-0',
				orientation === 'horizontal' && 'h-px w-full',
				orientation === 'vertical' && 'h-full w-px',
				className
			)}
			{...props}
		/>
	);
}

export { Separator };
