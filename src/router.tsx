import { createBrowserRouter, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
// Importar todas las vistas
import { AllImagesView } from '@/components/views/all-images/all-images-view';
import { DashboardView } from '@/components/views/dashboard/dashboard-view';
import DevelopmentContentView from '@/components/views/development/development-content-view';
import { File3DContentView as File3DDetailView } from '@/components/views/file3d/file-3d-content-view';
import { FolderContentView } from '@/components/views/folders/folder-content-view';
import FoldersView from '@/components/views/folders/folders-view';
import ImageDetailView from '@/components/views/images/image-detail-view';
import { JsonFileContentView } from '@/components/views/json-files/json-file-content-view';
import { JsonFilesView } from '@/components/views/json-files/json-files-view';
import MixedContentView from '@/components/views/mixed/mixed-content-view';
import { PromptsView } from '@/components/views/prompts/prompts-view';
import { PropertiesView } from '@/components/views/properties/properties-view';
import { SearchView } from '@/components/views/search/search-view';
import SettingsContentView from '@/components/views/settings/settings-content-view';
import { TagsView } from '@/components/views/tags/tags-view';
import { UploadedImagesView } from '@/components/views/uploaded-images/uploaded-images-view';
import VideosView from '@/components/views/videos/videos-view';
import { WildcardsView } from '@/components/views/wildcards/wildcards-view';
import { WorkflowContentView } from '@/components/views/workflows/workflow-content-view';
import { WorkflowsView } from '@/components/views/workflows/workflows-view';
import { WorldItemsView } from '@/components/views/world-items/world-items-view';
import NotesViewSimple from '@/components/views/notes/notes-view-simple';
import { PlacesView } from '@/components/views/places/places-view';

// Wrapper components para pasar el parámetro de la URL
const FolderContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	return <FolderContentView folderId={id} />;
};

// Importar las vistas de contenido específico
// Importar stores para los wrappers

// Wrapper para CharactersView
const CharactersViewWrapper = () => {
	return <div className="p-6"><h2 className="text-2xl font-bold">Vista de Personajes</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>;
};

// Wrappers eliminados - TODO: Re-implementar cuando se necesiten
// const AlbumContentWrapper = () => ...
// const CharacterContentWrapper = () => ...
// etc.

// Componente NotFound simple
const NotFoundPage = () => {
	return (
		<div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
			<div className="max-w-md w-full border border-red-200 rounded-lg p-6 text-center">
				<h1 className="text-2xl font-bold mb-4 text-red-800">Página no encontrada</h1>
				<p className="text-red-600 mb-4">La página que estás buscando no existe o ha sido movida.</p>
				<a href="/" className="text-red-700 hover:underline font-semibold">
					Volver al inicio
				</a>
			</div>
		</div>
	);
};

export const router = createBrowserRouter([
	{
		path: '/',
		element: <MainLayout />,
		children: [
			// Ruta principal
			{
				index: true,
				element: <DashboardView />,
			},
			// Rutas principales
			{
				path: 'dashboard',
				element: <DashboardView />,
			},
			{
				path: 'settings',
				element: <SettingsContentView />,
			},
			{
				path: 'development',
				element: <DevelopmentContentView />,
			},
			// Carpetas y archivos
			{
				path: 'folders',
				element: <FoldersView />,
			},
			{
				path: 'folders/:id',
				element: <FolderContentWrapper />,
			},
			{
				path: 'files',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Archivos</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'all-images',
				element: <AllImagesView className="h-full" />,
			},
			{
				path: 'uploaded-images',
				element: <UploadedImagesView />,
			},
			// Multimedia
			{
				path: 'videos',
				element: <VideosView className="h-full" />,
			},
			// Multimedia - Temporalmente simplificados
			{
				path: 'audios',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Audio</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'documents',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Documentos</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'json-files',
				element: <JsonFilesView className="h-full" />,
			},
			{
				path: 'workflows',
				element: <WorkflowsView />,
			},
			{
				path: 'file-3ds',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Archivos 3D</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			// Organizadores - Temporalmente simplificados
			{
				path: 'favorites',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Favoritos</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'collections',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Colecciones</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'albums',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Álbumes</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'groups',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Grupos</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'tags',
				element: <TagsView />,
			},
			// Worldbuilding
			{
				path: 'characters',
				element: <CharactersViewWrapper />,
			},
			{
				path: 'places',
				element: <PlacesView className="h-full" />,
			},
			{
				path: 'world-items',
				element: <WorldItemsView className="h-full" />,
			},
			{
				path: 'concepts',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Conceptos</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'wildcards',
				element: <WildcardsView className="h-full" />,
			},
			// Gestión
			{
				path: 'prompts',
				element: <PromptsView className="h-full" />,
			},
			{
				path: 'notes',
				element: <NotesViewSimple className="h-full" />,
			},
			{
				path: 'properties',
				element: <PropertiesView className="h-full" />,
			},
			// Utilidades
			{
				path: 'search',
				element: <SearchView className="h-full" />,
			},
			{
				path: 'entity-cards',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Vista de Tarjetas de Entidad</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'mixed',
				element: <MixedContentView />,
			},
			// Content Views - Vistas de detalle con parámetros
			// TODO: Re-implementar wrappers para vistas de detalle
			// {
			//	path: 'albums/:id',
			//	element: <AlbumContentWrapper />,
			// },
			// Rutas para imágenes individuales
			{
				path: 'images/:id',
				element: <ImageDetailView />,
			},
			// Content Views - Vistas de detalle sin parámetros - Temporalmente simplificadas
			{
				path: 'document-content',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Contenido de Documento</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'audio-content',
				element: <div className="p-6"><h2 className="text-2xl font-bold">Contenido de Audio</h2><p className="text-muted-foreground">Esta vista está siendo reparada...</p></div>,
			},
			{
				path: 'json-file-content',
				element: <JsonFileContentView />,
			},
			{
				path: 'workflow-content',
				element: <WorkflowContentView />,
			},
			{
				path: 'file-3d-content',
				element: <File3DDetailView />,
			},
		],
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);
