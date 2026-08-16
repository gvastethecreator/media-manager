'use client';

import * as React from 'react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SvgTextProps {
	/**
	 * The content to display (will have the SVG "inside" it)
	 */
	children: ReactNode;
	/**
	 * Additional className for the container
	 */
	className?: string;
	/**
	 * Font size for the text mask (in viewport width units or CSS units)
	 * @default "20vw"
	 */
	fontSize?: string | number;
	/**
	 * Font weight for the text mask
	 * @default "bold"
	 */
	fontWeight?: string | number;
	/**
	 * The SVG content to display inside the text
	 */
	svg: ReactNode;
}

/**
 * SvgText displays content with an SVG background fill effect.
 * The SVG is masked by the content, creating a dynamic text look.
 */
export function SvgText({ svg, children, className = '', fontSize = '20vw', fontWeight = 'bold' }: SvgTextProps) {
	const textRef = useRef<HTMLDivElement>(null);
	const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });
	const content = React.Children.toArray(children).join('');
	const maskId = React.useId();

	useEffect(() => {
		if (!textRef.current) return;

		const updateDimensions = () => {
			const rect = textRef.current?.getBoundingClientRect();
			if (rect) {
				setTextDimensions({
					width: Math.max(rect.width, 200),
					height: Math.max(rect.height, 100),
				});
			}
		};

		// Initial measurement
		updateDimensions();

		// Use ResizeObserver for better performance
		const resizeObserver = new ResizeObserver(updateDimensions);
		resizeObserver.observe(textRef.current);

		return () => resizeObserver.disconnect();
	}, []);

	return (
		<div className={cn('relative inline-block', className)}>
			{/* Hidden text for measuring */}
			<div
				className="pointer-events-none absolute whitespace-nowrap font-bold opacity-0"
				ref={textRef}
				style={{
					fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
					fontWeight,
					fontFamily: 'system-ui, -apple-system, sans-serif',
				}}
			>
				{content}
			</div>

			{/* SVG with text mask */}
			<svg
				className="block"
				height={textDimensions.height}
				style={{
					fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
					fontWeight,
					fontFamily: 'system-ui, -apple-system, sans-serif',
				}}
				viewBox={`0 0 ${textDimensions.width} ${textDimensions.height}`}
				width={textDimensions.width}
			>
				<title>Text with SVG mask</title>
				<defs>
					<mask id={maskId}>
						<rect fill="black" height="100%" width="100%" />
						<text
							dominantBaseline="central"
							fill="white"
							fontFamily="system-ui, -apple-system, sans-serif"
							fontSize="1em"
							fontWeight={fontWeight}
							textAnchor="middle"
							x="50%"
							y="50%"
						>
							{content}
						</text>
					</mask>
				</defs>

				{/* Background SVG with mask */}
				<g mask={`url(#${maskId})`}>{svg}</g>
			</svg>
		</div>
	);
}
