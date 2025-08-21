'use client';

import { cn } from '@/lib/utils';
import { animate, motion, useInView, UseInViewOptions, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface CountingNumberProps {
	from?: number;
	to?: number;
	duration?: number; // seconds
	delay?: number; // ms
	className?: string;
	startOnView?: boolean;
	once?: boolean;
	inViewMargin?: UseInViewOptions['margin'];
	onComplete?: () => void;
	format?: (value: number) => string;
}

export function CountingNumber({
	from = 0,
	to = 100,
	duration = 2,
	delay = 0,
	className,
	startOnView = true,
	once = false,
	inViewMargin,
	onComplete,
	format,
	...props
}: CountingNumberProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once, margin: inViewMargin });
	const [hasAnimated, setHasAnimated] = useState(false);
	const [display, setDisplay] = useState(from);
	const motionValue = useMotionValue(from);

	// Should start animation?
	const shouldStart = !startOnView || (isInView && !(once && hasAnimated));

	useEffect(() => {
		if (!shouldStart) return;
		setHasAnimated(true);
		let controls: { stop: () => void } | null = null;
		const timeout = setTimeout(() => {
			controls = animate(motionValue, to, {
				duration,
				onUpdate: (v) => setDisplay(v),
				onComplete,
			});
		}, delay);
		return () => {
			clearTimeout(timeout);
			controls?.stop();
		};
		// motionValue y onComplete son estables en este componente; su inclusión evita warning de deps
	}, [shouldStart, to, duration, delay, motionValue, onComplete]);

	return (
		<motion.span className={cn('inline-block', className)} ref={ref} {...props}>
			{format ? format(display) : Math.round(display)}
		</motion.span>
	);
}
