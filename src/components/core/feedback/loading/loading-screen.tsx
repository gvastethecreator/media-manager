import { CircleDashed } from 'lucide-react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
	message?: string;
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
	return (
		<motion.div
			animate={{ opacity: [0, 1] }}
			className="fixed inset-0 flex h-full w-full flex-col items-center justify-center"
			exit={{ opacity: 0 }}
		>
			<CircleDashed className="h-10 w-10 animate-spin text-primary text-white/70" />
			<p className="p-2 text-white/70 text-xs">{message}</p>
		</motion.div>
	);
}
