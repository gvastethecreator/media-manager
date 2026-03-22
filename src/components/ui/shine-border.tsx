import type * as React from 'react';
import { cn } from '@/lib/utils';

type TColorProp = string | string[];

interface ShineBorderProps {
	borderRadius?: number;
	/**
	 * Border width in pixels. Between 1 and 3.
	 */
	borderWidth?: 1 | 2 | 3;
	children: React.ReactNode;
	className?: string;
	color?: TColorProp;
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
	color = 'var(--border)',
}: ShineBorderProps) {
	return (
		<div
			className={cn(
				'relative w-full rounded-(--border-radius) p-(--border-width) transition-all',
				'border border-transparent',
				className
			)}
			style={
				{
					'--border-width': `${borderWidth}px`,
					'--border-radius': `${borderRadius}px`,
				} as React.CSSProperties
			}
		>
			<div
				className="pointer-events-none relative h-full w-full overflow-hidden rounded-(--border-radius) before:absolute before:inset-0 before:size-full before:rounded-(--border-radius) before:bg-shine-size before:p-(--border-width) before:will-change-[background-position] before:content-[''] motion-safe:before:animate-shine before:[-webkit-mask-composite:xor]! before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:[mask-composite:exclude]! before:[mask:var(--mask-linear-gradient)]"
				style={
					{
						'--mask-width': `${borderWidth}px`,
						'--mask-image': 'linear-gradient(black, black)',
						'--mask-compound': 'exclude',
						'--mask-linear-gradient': 'linear-gradient(white 0 0) content-box, linear-gradient(white 0 0)',
						'--background-radial-gradient': `radial-gradient(transparent,transparent, ${Array.isArray(color) ? color.join(',') : color},transparent,transparent)`,
					} as React.CSSProperties
				}
			/>
			<div className="absolute inset-0 rounded-(--border-radius) p-(--border-width)">
				<div className="h-full w-full rounded-(--border-radius)">{children}</div>
			</div>
		</div>
	);
}
