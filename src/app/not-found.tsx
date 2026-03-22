/**
 * @file Página 404 - Not Found
 * @description Página de error 404 profesional con navegación útil y diseño consistente
 */

import { ArrowLeft, FileQuestion, Home, Search } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from '@/components/ui/motion-shim';
import { clientLogger } from '@/lib/logger/client-logger';

/**
 * Sugerencias de navegación basadas en la ruta actual
 */
const getNavigationSuggestions = (pathname: string) => {
	const suggestions = [
		{ path: '/', label: 'Dashboard', icon: Home },
		{ path: '/folders', label: 'Carpetas', icon: Search },
		{ path: '/all-images', label: 'Todas las imágenes', icon: Search },
		{ path: '/settings', label: 'Configuración', icon: Search },
	];

	// Filtrar sugerencias relevantes basadas en la ruta
	const pathLower = pathname.toLowerCase();
	if (pathLower.includes('folder')) {
		return suggestions.filter((s) => s.path.includes('folder') || s.path === '/');
	}
	if (pathLower.includes('image')) {
		return suggestions.filter((s) => s.path.includes('image') || s.path === '/');
	}

	return suggestions.slice(0, 4);
};

export default function NotFoundPage() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		clientLogger.warn('Página 404 accedida:', { path: location.pathname });
	}, [location.pathname]);

	const handleGoBack = useCallback(() => {
		navigate(-1);
	}, [navigate]);

	const handleGoHome = useCallback(() => {
		navigate('/');
	}, [navigate]);

	const suggestions = getNavigationSuggestions(location.pathname);

	return (
		<main
			aria-label="Página no encontrada"
			className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12"
		>
			{/* Icono animado */}
			<motion.div
				animate={{ scale: 1, opacity: 1 }}
				className="mb-8"
				initial={{ scale: 0.8, opacity: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
			>
				<div className="relative">
					<div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
						<FileQuestion className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
					</div>
					<motion.div
						animate={{ scale: 1 }}
						className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive font-bold text-destructive-foreground text-lg"
						initial={{ scale: 0 }}
						transition={{ delay: 0.3, duration: 0.3 }}
					>
						404
					</motion.div>
				</div>
			</motion.div>

			{/* Título */}
			<motion.h1
				animate={{ y: 0, opacity: 1 }}
				className="mb-4 text-center font-bold text-4xl text-foreground tracking-tight"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.1, duration: 0.5 }}
			>
				Página no encontrada
			</motion.h1>

			{/* Descripción */}
			<motion.p
				animate={{ y: 0, opacity: 1 }}
				className="mb-8 max-w-md text-center text-lg text-muted-foreground"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.2, duration: 0.5 }}
			>
				Lo sentimos, la página que buscas no existe o ha sido movida.
				<br />
				<span className="mt-2 inline-block font-mono text-muted-foreground/70 text-sm">{location.pathname}</span>
			</motion.p>

			{/* Acciones principales */}
			<motion.div
				animate={{ y: 0, opacity: 1 }}
				className="mb-12 flex flex-wrap items-center justify-center gap-4"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.3, duration: 0.5 }}
			>
				<Button className="gap-2" onClick={handleGoBack} size="lg" variant="outline">
					<ArrowLeft className="h-4 w-4" />
					Volver atrás
				</Button>
				<Button className="gap-2" onClick={handleGoHome} size="lg">
					<Home className="h-4 w-4" />
					Ir al inicio
				</Button>
			</motion.div>

			{/* Sugerencias de navegación */}
			<motion.div
				animate={{ y: 0, opacity: 1 }}
				className="w-full max-w-md"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.4, duration: 0.5 }}
			>
				<h2 className="mb-4 text-center font-semibold text-muted-foreground text-sm uppercase tracking-wide">
					O prueba estas secciones
				</h2>
				<div className="grid grid-cols-2 gap-3">
					{suggestions.map((suggestion, index) => {
						const Icon = suggestion.icon;
						return (
							<motion.button
								animate={{ opacity: 1, y: 0 }}
								className="flex items-center gap-3 rounded-lg border-2 border-border/50 bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent hover:shadow-md"
								initial={{ opacity: 0, y: 10 }}
								key={suggestion.path}
								onClick={() => navigate(suggestion.path)}
								transition={{ delay: 0.5 + index * 0.1 }}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Icon className="h-5 w-5 text-muted-foreground" />
								<span className="font-medium text-sm">{suggestion.label}</span>
							</motion.button>
						);
					})}
				</div>
			</motion.div>

			{/* Footer */}
			<motion.p
				animate={{ opacity: 1 }}
				className="mt-12 text-center text-muted-foreground text-sm"
				initial={{ opacity: 0 }}
				transition={{ delay: 0.8 }}
			>
				Si crees que esto es un error, por favor contacta al administrador.
			</motion.p>
		</main>
	);
}
