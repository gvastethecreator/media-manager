import { memo } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import AlbumsContentView from './albums/albums-content-view';
import AllImagesContentView from './all-images/all-images-content-view';
import AudioContentView from './audio/audio-content-view';
import CharactersContentView from './characters/characters-content-view';
import CollectionsContentView from './collections/collections-content-view';
import ConceptsContentView from './concepts/concepts-content-view';
import DashboardContentView from './dashboard/dashboard-content-view';
import DevelopmentContentView from './development/development-content-view';
// Importar content views
import { DocumentContentView } from './documents/document-content-view';
import DocumentsContentView from './documents/documents-content-view';
import EntityCardsContentView from './entity-cards/entity-cards-content-view';
import FavoritesContentView from './favorites/favorites-content-view';
import File3DContentView from './file3d/file3d-content-view';
import { File3DContentView as File3DDetailView } from './file3d/file-3d-content-view';
import FilesContentView from './files/files-content-view';
import { FolderContentView } from './folders/folder-content-view';
import FoldersView from './folders/folders-view';
import GroupsContentView from './groups/groups-content-view';
import { JsonFileContentView } from './json-files/json-file-content-view';
import { JsonFilesView } from './json-files/json-files-view';
import { NotesView } from './notes/notes-view';
import { PlacesView } from './places/places-view';
import { PromptsView } from './prompts/prompts-view';
import { PropertiesView } from './properties/properties-view';
import { SearchView } from './search/search-view';
import SettingsContentView from './settings/settings-content-view';
import { TagsView } from './tags/tags-view';
import { WildcardsView } from './wildcards/wildcards-view';
import { WorkflowContentView } from './workflows/workflow-content-view';
import { WorkflowsView } from './workflows/workflows-view';
import { WorldItemsView } from './world-items/world-items-view';

export const ViewContainer = memo(function ViewContainer() {
	const { currentView } = useNavigationStore();

	const renderView = () => {
		switch (currentView) {
			case 'dashboard':
				return <DashboardContentView />;
			case 'settings':
				return <SettingsContentView />;

			case 'development':
				return <DevelopmentContentView />;

			// Carpetas y archivos
			case 'folders':
				return <FoldersView className="h-full" />;
			case 'folder-content':
				return <FolderContentView />;
			case 'files':
				return <FilesContentView className="h-full" />;
			case 'all-images':
				return <AllImagesContentView className="h-full" />;

			// Multimedia
			case 'audios':
				return <AudioContentView className="h-full" />;
			case 'documents':
				return <DocumentsContentView className="h-full" />;
			case 'json-files':
				return <JsonFilesView className="h-full" />;
			case 'workflows':
				return <WorkflowsView />;
			case 'file-3ds':
				return <File3DContentView className="h-full" />;

			// Organizadores
			case 'favorites':
				return <FavoritesContentView className="h-full" />;
			case 'collections':
				return <CollectionsContentView className="h-full" />;
			case 'albums':
				return <AlbumsContentView className="h-full" />;
			case 'groups':
				return <GroupsContentView className="h-full" />;
			case 'tags':
				return <TagsView />;

			// Worldbuilding
			case 'characters':
				return <CharactersContentView className="h-full" />;
			case 'places':
				return <PlacesView className="h-full" />;
			case 'world-items':
				return <WorldItemsView className="h-full" />;
			case 'concepts':
				return <ConceptsContentView />;
			case 'wildcards':
				return <WildcardsView className="h-full" />;

			// Gestión
			case 'prompts':
				return <PromptsView className="h-full" />;
			case 'notes':
				return <NotesView className="h-full" />;
			case 'properties':
				return <PropertiesView className="h-full" />;

			// Utilidades
			case 'search':
				return <SearchView className="h-full" />;
			case 'entity-cards':
				return <EntityCardsContentView />;

			// Content Views - Vistas de detalle
			case 'document-content':
				return <DocumentContentView />;
			case 'audio-content':
				return <AudioContentView />;
			case 'json-file-content':
				return <JsonFileContentView />;
			case 'workflow-content':
				return <WorkflowContentView />;
			case 'file-3d-content':
				return <File3DDetailView />;

			// Para el resto, usar placeholder temporal
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
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
				<div className="bg-card rounded-lg border border-border p-2">
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

				<div className="bg-card rounded-lg border border-border p-2">
					<div className="flex items-center mb-3">
						<div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
							<span className="text-xl">⚡</span>
						</div>
						<h3 className="font-semibold">Vista Rápida</h3>
					</div>
					<p className="text-sm text-muted-foreground">Previsualiza contenido sin salir de la vista actual.</p>
				</div>

				<div className="bg-card rounded-lg border border-border p-2">
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
