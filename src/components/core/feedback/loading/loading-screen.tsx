'use client';

import { CircleDashed } from 'lucide-react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
	message?: string;
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
	return (
		<motion.div
			animate={{ opacity: [0, 1] }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 flex flex-col items-center justify-center w-full h-full"
		>
			<CircleDashed className="w-10 h-10 text-primary animate-spin text-white/70" />
			<p className="text-xs text-white/70 p-2">{message}</p>
		</motion.div>
	);
}
