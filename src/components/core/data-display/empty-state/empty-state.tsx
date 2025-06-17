'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import BlurFade from '@/components/ui/blur-fade';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
	return (
		<motion.div
			animate={{ opacity: [0, 1], y: [20, 0] }}
			className={cn('flex flex-col items-center justify-center h-full w-full text-muted-foreground', className)}
		>
			<BlurFade className="text-center flex flex-col items-center justify-center" delay={0.5} inView={true}>
				<Icon className="w-12 h-12 mb-4 opacity-50" />
				<h3 className="text-lg font-medium mb-2">{title}</h3>
				<p className="text-sm text-muted-foreground">{description}</p>
			</BlurFade>
		</motion.div>
	);
}
