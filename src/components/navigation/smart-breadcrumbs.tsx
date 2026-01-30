/**
 * @file Smart Breadcrumbs
 * @description Breadcrumbs inteligentes con navegación contextual
 */

import { ChevronRight, FileText, Folder, Grid, Home, Image, Music, Settings, Video } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from '@/components/ui/animejs-shim';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
	/** Label del breadcrumb */
	label: string;
	/** Path para navegación */
	path?: string;
	/** Icono opcional */
	icon?: React.ComponentType<{ className?: string }>;
	/** Si es clickable */
	isClickable?: boolean;
}

interface SmartBreadcrumbsProps {
	/** Items personalizados (opcional) */
	items?: BreadcrumbItem[];
	/** Clase adicional */
	className?: string;
	/** Mostrar home icon */
	showHome?: boolean;
	/** Separador personalizado */
	separator?: React.ReactNode;
}

/**
 * Mapeo de rutas a labels e iconos
 */
const ROUTE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
	'': { label: 'Inicio', icon: Home },
	folders: { label: 'Carpetas', icon: Folder },
	'folder-content': { label: 'Contenido', icon: Grid },
	'all-images': { label: 'Imágenes', icon: Image },
	images: { label: 'Imágenes', icon: Image },
	videos: { label: 'Videos', icon: Video },
	audio: { label: 'Audio', icon: Music },
	documents: { label: 'Documentos', icon: FileText },
	settings: { label: 'Configuración', icon: Settings },
	development: { label: 'Desarrollo', icon: Settings },
};

/**
 * Genera breadcrumbs basados en la ruta actual
 */
function useBreadcrumbs(): BreadcrumbItem[] {
	const location = useLocation();
	const params = useParams();
	const { pathname } = location;

	return useMemo(() => {
		const segments = pathname.split('/').filter(Boolean);
		const breadcrumbs: BreadcrumbItem[] = [];

		// Siempre empezar con home
		breadcrumbs.push({
			label: 'Inicio',
			path: '/',
			icon: Home,
			isClickable: true,
		});

		let currentPath = '';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			currentPath += `/${segment}`;

			// Verificar si es un ID (segmento con caracteres de ID)
			const isId = /^[a-zA-Z0-9-_]{10,}$/.test(segment);

			if (isId) {
				// Si es un ID, mostrar un label genérico
				const parentSegment = segments[i - 1];
				if (parentSegment === 'folders') {
					breadcrumbs.push({
						label: 'Carpeta',
						path: currentPath,
						isClickable: false,
					});
				} else {
					breadcrumbs.push({
						label: 'Detalle',
						path: currentPath,
						isClickable: false,
					});
				}
			} else {
				const config = ROUTE_CONFIG[segment];
				if (config) {
					breadcrumbs.push({
						label: config.label,
						path: currentPath,
						icon: config.icon,
						isClickable: i < segments.length - 1,
					});
				}
			}
		}

		return breadcrumbs;
	}, [pathname]);
}

/**
 * Smart Breadcrumbs con navegación contextual
 */
export const SmartBreadcrumbs = memo<SmartBreadcrumbsProps>(function SmartBreadcrumbs({
	items: customItems,
	className,
	showHome = true,
	separator = <ChevronRight className="h-4 w-4" />,
}) {
	const navigate = useNavigate();
	const breadcrumbs = useBreadcrumbs();
	const items = customItems || breadcrumbs;

	const handleClick = useCallback(
		(path?: string) => {
			if (path) {
				navigate(path);
			}
		},
		[navigate]
	);

	// Si solo hay home y showHome es false, no renderizar
	if (items.length <= 1 && !showHome) {
		return null;
	}

	return (
		<nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
			<ol className="flex flex-wrap items-center gap-1">
				<AnimatePresence mode="wait">
					{items.map((item, index) => {
						const isLast = index === items.length - 1;
						const Icon = item.icon;

						return (
							<motion.li
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center"
								initial={{ opacity: 0, x: -10 }}
								key={`${item.label}-${index}`}
								transition={{ delay: index * 0.05 }}
							>
								{index > 0 && (
									<span aria-hidden="true" className="mx-2 text-muted-foreground/50">
										{separator}
									</span>
								)}

								{isLast || !item.isClickable ? (
									<span
										aria-current={isLast ? 'page' : undefined}
										className={cn('flex items-center gap-1.5 font-medium text-foreground', isLast && 'text-foreground')}
									>
										{Icon && <Icon className="h-4 w-4" />}
										{item.label}
									</span>
								) : (
									<button
										className={cn(
											'flex items-center gap-1.5 text-muted-foreground transition-colors',
											'hover:text-foreground focus:underline focus:outline-none'
										)}
										onClick={() => handleClick(item.path)}
										type="button"
									>
										{Icon && <Icon className="h-4 w-4" />}
										{item.label}
									</button>
								)}
							</motion.li>
						);
					})}
				</AnimatePresence>
			</ol>
		</nav>
	);
});

export default SmartBreadcrumbs;
