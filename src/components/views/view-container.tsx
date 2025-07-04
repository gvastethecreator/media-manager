import { memo } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
// import { FoldersView } from '@/components/views';
import { FoldersViewMinimal } from './folders/views/folders-view-minimal';

export const ViewContainer = memo(function ViewContainer() {
	const { currentView } = useNavigationStore();

	const renderView = () => {
		switch (currentView) {
			case 'folders':
				return <FoldersViewMinimal />;

			// Para el resto, usar placeholder temporal mientras los incorporo uno por uno
			default:
				return (
					<div className="h-full w-full flex flex-col">
						{/* Header con información de la vista actual */}
						<div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-6">
							<h1 className="text-3xl font-bold text-foreground mb-2">{getViewTitle(currentView)}</h1>
							<p className="text-muted-foreground">{getViewDescription(currentView)}</p>
						</div>

						{/* Contenido principal */}
						<div className="flex-1 p-6 overflow-auto">
							<div className="max-w-4xl mx-auto">{renderViewContent(currentView)}</div>
						</div>
					</div>
				);
		}
	};

	const getViewTitle = (view: string) => {
		const titles: Record<string, string> = {
			folders: '📁 Carpetas',
			collections: '📚 Colecciones',
			favorites: '❤️ Favoritos',
			search: '🔍 Búsqueda',
			tags: '🏷️ Etiquetas',
			albums: '📖 Álbumes',
			characters: '👤 Personajes',
			places: '📍 Lugares',
			'world-items': '🌍 Objetos del Mundo',
			concepts: '💡 Conceptos',
			prompts: '📝 Prompts',
			notes: '📋 Notas',
			groups: '👥 Grupos',
			properties: '⚙️ Propiedades',
			wildcards: '🎲 Comodines',
			settings: '⚙️ Configuración',
			development: '🛠️ Desarrollo',
			'entity-cards': '🃏 Tarjetas de Entidad',
		};
		return titles[view] || `📄 ${view.charAt(0).toUpperCase() + view.slice(1)}`;
	};

	const getViewDescription = (view: string) => {
		const descriptions: Record<string, string> = {
			folders: 'Gestiona y organiza tus carpetas de imágenes',
			collections: 'Crea y administra colecciones temáticas de imágenes',
			favorites: 'Accede rápidamente a tus imágenes marcadas como favoritas',
			search: 'Busca imágenes por contenido, metadatos y características',
			tags: 'Organiza con etiquetas para una clasificación flexible',
			albums: 'Crea álbumes para eventos y ocasiones especiales',
			characters: 'Gestiona personajes y personas en tus imágenes',
			places: 'Organiza imágenes por ubicaciones y lugares',
			'world-items': 'Objetos y elementos del mundo en tus imágenes',
			concepts: 'Ideas y conceptos abstractos en tu colección',
			prompts: 'Prompts y descripciones para IA generativa',
			notes: 'Notas y comentarios sobre tus imágenes',
			groups: 'Agrupa elementos relacionados',
			properties: 'Configura propiedades personalizadas',
			wildcards: 'Elementos especiales y comodines',
			settings: 'Configuración general del sistema',
			development: 'Herramientas de desarrollo y debug',
			'entity-cards': 'Vista de tarjetas de entidades',
		};
		return descriptions[view] || `Gestiona y visualiza ${view}`;
	};

	const renderViewContent = (view: string) => {
		// Contenido específico de cada vista con cards informativos
		const commonFeatures = (
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
				<div className="bg-card rounded-lg border border-border p-6">
					<div className="flex items-center mb-3">
						<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
							<span className="text-xl">🔍</span>
						</div>
						<h3 className="font-semibold">Búsqueda Avanzada</h3>
					</div>
					<p className="text-sm text-muted-foreground">
						Busca por contenido, metadatos, fechas y características específicas.
					</p>
				</div>

				<div className="bg-card rounded-lg border border-border p-6">
					<div className="flex items-center mb-3">
						<div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
							<span className="text-xl">⚡</span>
						</div>
						<h3 className="font-semibold">Vista Rápida</h3>
					</div>
					<p className="text-sm text-muted-foreground">Previsualiza contenido sin salir de la vista actual.</p>
				</div>

				<div className="bg-card rounded-lg border border-border p-6">
					<div className="flex items-center mb-3">
						<div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
							<span className="text-xl">🎨</span>
						</div>
						<h3 className="font-semibold">Personalización</h3>
					</div>
					<p className="text-sm text-muted-foreground">Configura vistas, filtros y organización a tu gusto.</p>
				</div>
			</div>
		);

		// Vista específica con estado y características
		return (
			<div>
				<div className="bg-card rounded-lg border border-border p-8 mb-6">
					<div className="text-center">
						<div className="text-6xl mb-4 opacity-50">{getViewIcon(view)}</div>
						<h2 className="text-xl font-semibold mb-2">Vista {view} Disponible</h2>
						<p className="text-muted-foreground mb-4">
							Esta vista está lista para usar. Las funcionalidades completas se activarán cuando se conecte al servidor
							backend.
						</p>
						<div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
							Sistema funcional
						</div>
					</div>
				</div>

				{commonFeatures}

				{/* Debug info mejorado */}
				<div className="mt-8 p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary">
					<h3 className="font-semibold mb-2 text-sm uppercase tracking-wider">Información de Debug</h3>
					<div className="grid sm:grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Vista actual:</span>
							<code className="ml-2 bg-background px-2 py-1 rounded text-primary font-mono">{currentView}</code>
						</div>
						<div>
							<span className="text-muted-foreground">Estado:</span>
							<span className="ml-2 text-green-600 dark:text-green-400 font-medium">Operacional</span>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const getViewIcon = (view: string) => {
		const icons: Record<string, string> = {
			folders: '📁',
			collections: '📚',
			favorites: '❤️',
			search: '🔍',
			tags: '🏷️',
			albums: '📖',
			characters: '👤',
			places: '📍',
			'world-items': '🌍',
			concepts: '💡',
			prompts: '📝',
			notes: '📋',
			groups: '👥',
			properties: '⚙️',
			wildcards: '🎲',
		};
		return icons[view] || '📄';
	};

	return (
		<div className="h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
			<div className="h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden">{renderView()}</div>
		</div>
	);
});
