import { CircleDashed } from 'lucide-react';
import { motion } from '@/components/ui/animejs-shim';

interface LoadingScreenProps {
	message?: string;
	/**
	 * Si es true, el overlay podrá recibir eventos de puntero.
	 * Por defecto es false para no interferir con la UI/Tests.
	 */
	interactive?: boolean;
	/** Clases extra para personalizar el contenedor */
	className?: string;
}

export function LoadingScreen({ message = 'Cargando...', interactive = false, className = '' }: LoadingScreenProps) {
	return (
		<motion.div
			animate={{ opacity: 1 }}
			aria-hidden={interactive ? undefined : true}
			className={`fixed inset-0 flex h-full w-full flex-col items-center justify-center ${
				interactive ? '' : 'pointer-events-none'
			} ${className}`}
			exit={{ opacity: 0 }}
			initial={{ opacity: 0 }}
		>
			<CircleDashed className="h-10 w-10 animate-spin text-primary" />
			<p className="p-2 text-white/70 text-xs">{message}</p>
		</motion.div>
	);
}
