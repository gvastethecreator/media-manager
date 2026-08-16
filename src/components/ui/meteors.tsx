import type * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MeteorsProps {
	className?: string;
	number?: number;
}

export const Meteors = ({ number = 20 }: MeteorsProps) => {
	const [meteorStyles, setMeteorStyles] = useState<React.CSSProperties[]>([]);

	useEffect(() => {
		const styles = [...new Array(number)].map(() => ({
			top: `${Math.floor(Math.random() * 100)}%`,
			left: `${Math.floor(Math.random() * 100)}%`,
			animationDelay: `${Math.random() * 1}s`,
			animationDuration: `${Math.floor(Math.random() * 8 + 2)}s`,
		}));
		setMeteorStyles(styles);
	}, [number]);

	return (
		<>
			{meteorStyles.map((style) => (
				// Meteor Head
				<span
					className={cn(
						'pointer-events-none absolute top-1/2 left-1/2 size-0.5 rotate-[215deg] animate-meteor rounded-full bg-muted-foreground shadow-[0_0_0_1px_var(--border)]'
					)}
					key={`meteor-${Math.random().toString(36).substring(2, 9)}`}
					style={style}
				>
					{/* Meteor Tail */}
					<span className="absolute top-1/2 -z-10 h-[1px] w-[50px] -translate-y-1/2 bg-gradient-to-r from-muted-foreground to-transparent" />
				</span>
			))}
		</>
	);
};

export default Meteors;
