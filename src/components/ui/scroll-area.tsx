'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
	orientation?: 'vertical' | 'horizontal' | 'both';
	scrollHideDelay?: number;
}

const ScrollArea = React.memo(function ScrollArea({
	className,
	children,
	orientation = 'both',
	scrollHideDelay = 1000,
	...props
}: ScrollAreaProps) {
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const [isScrolling, setIsScrolling] = React.useState(false);
	const timeoutRef = React.useRef<NodeJS.Timeout>();

	const handleScroll = React.useCallback(() => {
		setIsScrolling(true);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setIsScrolling(false);
		}, scrollHideDelay);
	}, [scrollHideDelay]);

	React.useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;

		element.addEventListener('scroll', handleScroll);
		return () => {
			element.removeEventListener('scroll', handleScroll);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [handleScroll]);

	return (
		<div
			ref={scrollRef}
			data-slot="scroll-area"
			data-scrolling={isScrolling}
			className={cn(
				'relative overflow-auto',
				'focus-visible:ring-ring/50 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
				// Custom scrollbar styles
				'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border scrollbar-thumb-rounded-full',
				'hover:scrollbar-thumb-border/60 data-[scrolling=true]:scrollbar-thumb-border/80',
				// Hide scrollbars based on orientation
				orientation === 'vertical' && 'overflow-x-hidden',
				orientation === 'horizontal' && 'overflow-y-hidden',
				className
			)}
			style={{
				scrollbarWidth: 'thin',
				scrollbarColor: 'hsl(var(--border)) transparent',
			}}
			{...props}
		>
			{children}
		</div>
	);
});

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	orientation?: 'vertical' | 'horizontal';
}

const ScrollBar = React.memo(function ScrollBar({ className, orientation = 'vertical', ...props }: ScrollBarProps) {
	// This is now handled by CSS, but we keep the component for API compatibility
	return (
		<div
			data-slot="scroll-area-scrollbar"
			data-orientation={orientation}
			className={cn(
				'absolute pointer-events-none',
				orientation === 'vertical' && 'right-0 top-0 h-full w-2.5',
				orientation === 'horizontal' && 'bottom-0 left-0 w-full h-2.5',
				className
			)}
			{...props}
		/>
	);
});

export { ScrollArea, ScrollBar };
