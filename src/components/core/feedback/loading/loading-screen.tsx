import { CircleDashed } from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';

interface LoadingScreenProps {
	/** Clases extra para personalizar el contenedor */
	className?: string;
	/**
	 * Si es true, el overlay podrá recibir eventos de puntero.
	 * Por defecto es false para no interferir con la UI/Tests.
	 */
	interactive?: boolean;
	message?: string;
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
			<p className="ui-overlay-text-muted p-2 text-xs">{message}</p>
		</motion.div>
	);
}
