import type { LucideIcon } from 'lucide-react';
import BlurFade from '@/components/ui/blur-fade';
import { motion } from '@/components/ui/motion-shim';
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
			className={cn('flex h-full w-full flex-col items-center justify-center text-muted-foreground', className)}
		>
			<BlurFade className="flex flex-col items-center justify-center text-center" delay={0.5} inView={true}>
				<Icon className="mb-4 h-12 w-12 opacity-50" />
				<h3 className="mb-2 font-medium text-lg">{title}</h3>
				<p className="text-muted-foreground text-sm">{description}</p>
			</BlurFade>
		</motion.div>
	);
}
