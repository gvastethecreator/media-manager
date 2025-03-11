'use client';

import { cn } from '@/lib/utils/utils';
import type * as React from 'react';

type TColorProp = string | string[];

interface ShineBorderProps {
	/**
	 * Border width in pixels. Between 1 and 3.
	 */
	borderWidth?: 1 | 2 | 3;
	borderRadius?: number;
	color?: TColorProp;
	className?: string;
	children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description It is an animated background border effect component with easy to use and configurable props.
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component
 * @param children contains react node elements.
 */
export function ShineBorder({
	className,
	children,
	borderWidth = 1,
	borderRadius = 8,
	color = '#ffffff',
}: ShineBorderProps) {
	return (
		<div
			style={
				{
					'--border-width': `${borderWidth}px`,
					'--border-radius': `${borderRadius}px`,
				} as React.CSSProperties
			}
			className={cn(
				'relative w-full rounded-(--border-radius) p-(--border-width) transition-all',
				'border border-transparent',
				className
			)}
		>
			<div
				style={
					{
						'--mask-width': `${borderWidth}px`,
						'--mask-image': 'linear-gradient(black, black)',
						'--mask-compound': 'exclude',
						'--mask-linear-gradient': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
						'--background-radial-gradient': `radial-gradient(transparent,transparent, ${Array.isArray(color) ? color.join(',') : color},transparent,transparent)`,
					} as React.CSSProperties
				}
				className="relative h-full w-full rounded-(--border-radius) overflow-hidden pointer-events-none before:bg-shine-size before:absolute before:inset-0 before:size-full before:rounded-(--border-radius) before:p-(--border-width) before:will-change-[background-position] before:content-[''] before:[-webkit-mask-composite:xor]! before:[mask-composite:exclude]! before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:[mask:var(--mask-linear-gradient)] motion-safe:before:animate-shine"
			/>
			<div className="absolute inset-0 rounded-(--border-radius) p-(--border-width)">
				<div className="h-full w-full rounded-(--border-radius)">{children}</div>
			</div>
		</div>
	);
}
