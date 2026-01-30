import React, { ComponentPropsWithoutRef, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'section'> {
	/**
	 * Optional CSS class name to apply custom styles
	 */
	className?: string;
	/**
	 * Whether to reverse the animation direction
	 * @default false
	 */
	reverse?: boolean;
	/**
	 * Whether to pause the animation on hover
	 * @default false
	 */
	pauseOnHover?: boolean;
	/**
	 * Content to be displayed in the marquee
	 */
	children: React.ReactNode;
	/**
	 * Whether to animate vertically instead of horizontally
	 * @default false
	 */
	vertical?: boolean;
	/**
	 * Number of times to repeat the content
	 * @default 4
	 */
	repeat?: number;
	/**
	 * If true, automatically repeats children enough to fill the visible area
	 */
	autoFill?: boolean;
	/** Optional accessible name; defaults to 'Marquesina' */
	ariaLabel?: string;
	/** ARIA live politeness; avoid announcing by default */
	ariaLive?: 'off' | 'polite' | 'assertive';
}

export function Marquee({
	className,
	reverse = false,
	pauseOnHover = false,
	children,
	vertical = false,
	repeat = 4,
	ariaLabel,
	ariaLive = 'off',
	...props
}: MarqueeProps) {
	const marqueeRef = useRef<HTMLElement>(null);

	return (
		<section
			{...props}
			aria-label={ariaLabel || 'Marquesina'}
			aria-live={ariaLive}
			className={cn(
				'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
				{
					'flex-row': !vertical,
					'flex-col': vertical,
				},
				className
			)}
			data-slot="marquee"
			ref={marqueeRef}
		>
			{React.useMemo(
				() => (
					<>
						{Array.from({ length: repeat }, (_, i) => (
							<div
								className={cn(
									vertical ? 'flex-col [gap:var(--gap)]' : 'flex-row [gap:var(--gap)]',
									'flex shrink-0 justify-around',
									!vertical && 'animate-marquee flex-row',
									vertical && 'animate-marquee-vertical flex-col',
									pauseOnHover && 'group-hover:[animation-play-state:paused]',
									reverse && '[animation-direction:reverse]'
								)}
								key={i}
							>
								{children}
							</div>
						))}
					</>
				),
				[repeat, children, vertical, pauseOnHover, reverse]
			)}
		</section>
	);
}
