import * as React from 'react';
import { cn } from '@/lib/utils';

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	ratio?: number;
	children?: React.ReactNode;
}

function AspectRatio({ className, ratio = 1, children, style, ...props }: AspectRatioProps) {
	return (
		<div
			data-slot="aspect-ratio"
			className={cn('relative w-full', className)}
			style={{
				aspectRatio: ratio.toString(),
				...style,
			}}
			{...props}
		>
			{children}
		</div>
	);
}

export { AspectRatio };
