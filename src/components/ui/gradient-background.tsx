'use client';

import { HTMLMotionProps, motion, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';

type GradientBackgroundProps = HTMLMotionProps<'div'> & {
	transition?: Transition;
};

function GradientBackground({
	className,
	transition = { duration: 10, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY },
	...props
}: GradientBackgroundProps) {
	return (
		<motion.div
			animate={{
				backgroundPosition: ['0% 0%', '50% 50%', '100% 0%', '50% 100%', '0% 50%', '100% 100%', '0% 0%'],
			}}
			className={cn(
				'size-full bg-[length:300%_300%] bg-gradient-to-br from-0% from-fuchsia-400 via-50% via-violet-500 to-100% to-fuchsia-600',
				className
			)}
			data-slot="gradient-background"
			transition={transition}
			whileTap={{
				scale: 0.98,
			}}
			{...props}
		/>
	);
}

export { GradientBackground, type GradientBackgroundProps };
