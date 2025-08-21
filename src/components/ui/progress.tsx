'use client';

import { Progress as ProgressPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Progress({
	className,
	indicatorClassName,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
	indicatorClassName?: string;
}) {
	return (
		<ProgressPrimitive.Root
			className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-secondary', className)}
			data-slot="progress"
			{...props}
		>
			<ProgressPrimitive.Indicator
				className={cn('h-full w-full flex-1 bg-primary transition-all', indicatorClassName)}
				data-slot="progress-indicator"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}

function ProgressCircle({
	className,
	indicatorClassName,
	trackClassName,
	value = 0,
	size = 48,
	strokeWidth = 4,
	children,
	...props
}: React.ComponentProps<'div'> & {
	/**
	 * Progress value from 0 to 100
	 */
	value?: number;
	/**
	 * Size of the circle in pixels
	 */
	size?: number;
	/**
	 * Width of the progress stroke
	 */
	strokeWidth?: number;
	/**
	 * Additional className for the progress stroke
	 */
	indicatorClassName?: string;
	/**
	 * Additional className for the progress track
	 */
	trackClassName?: string;
	/**
	 * Content to display in the center of the circle
	 */
	children?: React.ReactNode;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (value / 100) * circumference;

	return (
		<div
			className={cn('relative inline-flex items-center justify-center', className)}
			data-slot="progress-circle"
			style={{ width: size, height: size }}
			{...props}
		>
			<svg className="-rotate-90 absolute inset-0" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
				<circle
					className={cn('text-secondary', trackClassName)}
					cx={size / 2}
					cy={size / 2}
					data-slot="progress-circle-track"
					fill="none"
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
				/>
				<circle
					className={cn('text-primary transition-all duration-300 ease-in-out', indicatorClassName)}
					cx={size / 2}
					cy={size / 2}
					data-slot="progress-circle-indicator"
					fill="none"
					r={radius}
					stroke="currentColor"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					strokeWidth={strokeWidth}
				/>
			</svg>
			{children && (
				<div
					className="relative z-10 flex items-center justify-center font-medium text-sm"
					data-slot="progress-circle-content"
				>
					{children}
				</div>
			)}
		</div>
	);
}

function ProgressRadial({
	className,
	value = 0,
	size = 120,
	strokeWidth = 8,
	startAngle = -90,
	endAngle = 90,
	showLabel = false,
	trackClassName,
	indicatorClassName,
	children,
	...props
}: React.ComponentProps<'div'> & {
	/**
	 * Progress value from 0 to 100
	 */
	value?: number;
	/**
	 * Size of the radial in pixels
	 */
	size?: number;
	/**
	 * Width of the progress stroke
	 */
	strokeWidth?: number;
	/**
	 * Start angle in degrees
	 */
	startAngle?: number;
	/**
	 * Additional className for the progress stroke
	 */
	indicatorClassName?: string;
	/**
	 * Additional className for the progress track
	 */
	trackClassName?: string;
	/**
	 * End angle in degrees
	 */
	endAngle?: number;
	/**
	 * Whether to show percentage label
	 */
	showLabel?: boolean;
	/**
	 * Custom content to display
	 */
	children?: React.ReactNode;
}) {
	const radius = (size - strokeWidth) / 2;
	const angleRange = endAngle - startAngle;
	const progressAngle = (value / 100) * angleRange;

	const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

	const startX = size / 2 + radius * Math.cos(toRadians(startAngle));
	const startY = size / 2 + radius * Math.sin(toRadians(startAngle));
	const endX = size / 2 + radius * Math.cos(toRadians(startAngle + progressAngle));
	const endY = size / 2 + radius * Math.sin(toRadians(startAngle + progressAngle));

	const largeArc = progressAngle > 180 ? 1 : 0;

	const pathData = ['M', startX, startY, 'A', radius, radius, 0, largeArc, 1, endX, endY].join(' ');

	return (
		<div
			className={cn('relative inline-flex items-center justify-center', className)}
			data-slot="progress-radial"
			style={{ width: size, height: size }}
			{...props}
		>
			<svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
				<path
					className={cn('text-secondary', trackClassName)}
					d={[
						'M',
						size / 2 + radius * Math.cos(toRadians(startAngle)),
						size / 2 + radius * Math.sin(toRadians(startAngle)),
						'A',
						radius,
						radius,
						0,
						angleRange > 180 ? 1 : 0,
						1,
						size / 2 + radius * Math.cos(toRadians(endAngle)),
						size / 2 + radius * Math.sin(toRadians(endAngle)),
					].join(' ')}
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth={strokeWidth}
				/>
				<path
					className={cn('text-primary transition-all duration-300 ease-in-out', indicatorClassName)}
					d={pathData}
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth={strokeWidth}
				/>
			</svg>
			{(showLabel || children) && (
				<div className="absolute inset-0 flex items-center justify-center">
					{children || <span className="font-bold text-lg">{value}%</span>}
				</div>
			)}
		</div>
	);
}

export { Progress, ProgressCircle, ProgressRadial };
