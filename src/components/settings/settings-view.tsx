'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	AlbumIcon,
	BookIcon,
	BoxIcon,
	FolderIcon,
	Grid2X2Icon,
	ImageIcon,
	KeyboardIcon,
	ListIcon,
	MapPinIcon,
	MessageSquareIcon,
	SettingsIcon,
	StickyNoteIcon,
	TagIcon,
	UploadCloud,
	UserIcon,
	WandIcon,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { AlbumsSettings } from './albums/albums-settings';
import { CharactersSettings } from './characters/characters-settings';
import { CollectionsSettings } from './collections/collections-settings';
import { ConceptsSettings } from './concepts/concepts-settings';
import { FoldersSettings } from './folders/folders-settings';
import { GroupsSettings } from './groups/groups-settings';
import { NotesSettings } from './notes/notes-settings';
import { PlacesSettings } from './places/places-settings';
import { ProfilesSettings } from './profiles/profiles-settings';
import { PromptSettings } from './prompts/prompts-settings';
import { PropertiesSettings } from './properties/properties-settings';
import { ShortcutsSettings } from './shortcuts/shortcuts-settings';
import { SystemSettings } from './system/system-settings';
import { TagsSettings } from './tags/tags-settings';
import { ThumbnailsSettings } from './thumbnails/thumbnails-settings';
import { UploadedImagesSettings } from './uploaded-images/uploaded-images-settings';
import { WildcardsSettings } from './wildcards/wildcards-settings';
import { WorldItemsSettings } from './world-items/world-items-settings';

// Definición de tipos para estructurar los tabs
interface TabItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	color: string;
}

// Colores para cada tab
const tabColors = {
	system: '#64748b', // Slate
	albums: '#8b5cf6', // Violet
	collections: '#ef4444', // Red
	tags: '#f59e0b', // Amber
	characters: '#ec4899', // Pink
	'world-items': '#f59e0b', // Amber
	places: '#14b8a6', // Teal
	concepts: '#3b82f6', // Blue
	prompts: '#10b981', // Emerald
	notes: '#a855f7', // Purple
	thumbnails: '#0ea5e9', // Sky
	'uploaded-images': '#22c55e', // Green
	shortcuts: '#475569', // Slate
	'entities-cards': '#6366f1', // Indigo
	profiles: '#6366f1', // Indigo
	properties: '#f472b6', // Pink
	groups: '#a855f7', // Purple
	wildcards: '#ec4899', // Pink
};

// Definición de todos los tabs para evitar la duplicación de código
const tabsData: TabItem[] = [
	{
		id: 'system',
		label: 'Sistema',
		icon: <SettingsIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.system,
	},
	{
		id: 'entities-cards',
		label: 'Tarjetas',
		icon: <ListIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['entities-cards'],
	},
	{
		id: 'albums',
		label: 'Albums',
		icon: <AlbumIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.albums,
	},
	{
		id: 'collections',
		label: 'Colecciones',
		icon: <Grid2X2Icon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.collections,
	},
	{
		id: 'tags',
		label: 'Etiquetas',
		icon: <TagIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.tags,
	},
	{
		id: 'characters',
		label: 'Personas',
		icon: <UserIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.characters,
	},
	{
		id: 'world-items',
		label: 'Objetos',
		icon: <BoxIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['world-items'],
	},
	{
		id: 'places',
		label: 'Lugares',
		icon: <MapPinIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.places,
	},
	{
		id: 'concepts',
		label: 'Conceptos',
		icon: <BookIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.concepts,
	},
	{
		id: 'prompts',
		label: 'Prompts',
		icon: <MessageSquareIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.prompts,
	},
	{
		id: 'notes',
		label: 'Notas',
		icon: <StickyNoteIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.notes,
	},
	{
		id: 'uploaded-images',
		label: 'Imágenes Subidas',
		icon: <UploadCloud className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['uploaded-images'],
	},
	{
		id: 'shortcuts',
		label: 'Atajos',
		icon: <KeyboardIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.shortcuts,
	},
	{
		id: 'profiles',
		label: 'Perfiles',
		icon: <UserIcon className="h-4 w-4 transition-transform duration-150 group-hover:scale-105" />,
		color: tabColors.profiles,
	},
	{
		id: 'properties',
		label: 'Propiedades',
		icon: <TagIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.properties,
	},
	{
		id: 'groups',
		label: 'Grupos',
		icon: <FolderIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.groups,
	},
	{
		id: 'wildcards',
		label: 'Comodines',
		icon: <WandIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.wildcards,
	},
	{
		id: 'thumbnails',
		label: 'Miniaturas',
		icon: <ImageIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.thumbnails,
	},
];

export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState('system');

	// 📡 Escuchar el evento para cambiar la pestaña activa desde otros componentes
	React.useEffect(() => {
		const handleSetSettingsTab = (event: CustomEvent<{ tab: string }>) => {
			const { tab } = event.detail;
			if (tab && tabsData.some(tabData => tabData.id === tab)) {
				setActiveTab(tab);
			}
		};

		// Añadir el event listener con tipado correcto
		window.addEventListener('set-settings-tab', handleSetSettingsTab as EventListener);

		// Limpiar al desmontar
		return () => {
			window.removeEventListener('set-settings-tab', handleSetSettingsTab as EventListener);
		};
	}, []);

	return (
		<div className="h-full w-full">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-row">
				{/* 🎨 Sidebar vertical con navegación de tabs */}
				<div className="w-64 flex-shrink-0 border-r-2 border-border/20 bg-background/50 backdrop-blur-sm h-full overflow-y-auto">
					<TabsList className="flex flex-col w-full h-auto bg-transparent rounded-none p-2 gap-1 justify-start">
						{tabsData.map((tab) => (
							<TabsTrigger
								key={tab.id}
								value={tab.id}
								className={cn(
									'flex items-center justify-start gap-3 px-4 py-3 w-full',
									'text-sm font-medium border border-transparent rounded-lg',
									'cursor-pointer group transition-all duration-200',
									'hover:bg-secondary/30 hover:border-border/20 hover:scale-[1.02]',
									'data-[state=active]:bg-secondary/50 data-[state=active]:border-white/10',
									'data-[state=active]:text-primary data-[state=active]:shadow-sm',
									'active:scale-[0.98] data-[state=active]:scale-100'
								)}
							>
								{/* 🎨 Icono con color temático */}
								<span
									style={{ color: tab.color }}
									className="flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
								>
									{tab.icon}
								</span>

								{/* 📝 Label con truncado inteligente */}
								<span className="text-left truncate flex-1 group-data-[state=active]:font-semibold">
									{tab.label}
								</span>

								{/* ✨ Indicador visual del estado activo */}
								<div
									className="w-1 h-4 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-200"
									style={{ backgroundColor: tab.color }}
								/>
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				{/* 📋 Contenido de los tabs con área expandible */}
				<div className="flex-1 h-full overflow-auto">
					<TabsContent value="system" className="h-full w-full p-6 m-0 border-none">
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
							<FoldersSettings />
							<SystemSettings />
						</div>
					</TabsContent>

					<TabsContent value="entities-cards" className="h-full w-full p-6 m-0 border-none">
						{/* 🃏 TODO: Implementar configuración de tarjetas de entidades */}
						<div className="flex items-center justify-center h-full text-muted-foreground">
							<div className="text-center">
								<ListIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p className="text-lg font-medium">Configuración de Tarjetas</p>
								<p className="text-sm">Próximamente disponible</p>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="albums" className="h-full w-full p-6 m-0 border-none">
						<AlbumsSettings />
					</TabsContent>

					<TabsContent value="collections" className="h-full w-full p-6 m-0 border-none">
						<CollectionsSettings />
					</TabsContent>

					<TabsContent value="tags" className="h-full w-full p-6 m-0 border-none">
						<TagsSettings />
					</TabsContent>

					<TabsContent value="characters" className="h-full w-full p-6 m-0 border-none">
						<CharactersSettings />
					</TabsContent>

					<TabsContent value="world-items" className="h-full w-full p-6 m-0 border-none">
						<WorldItemsSettings />
					</TabsContent>

					<TabsContent value="places" className="h-full w-full p-6 m-0 border-none">
						<PlacesSettings />
					</TabsContent>

					<TabsContent value="concepts" className="h-full w-full p-6 m-0 border-none">
						<ConceptsSettings />
					</TabsContent>

					<TabsContent value="prompts" className="h-full w-full p-6 m-0 border-none">
						<PromptSettings />
					</TabsContent>

					<TabsContent value="notes" className="h-full w-full p-6 m-0 border-none">
						<NotesSettings />
					</TabsContent>

					<TabsContent value="uploaded-images" className="h-full w-full p-6 m-0 border-none">
						<UploadedImagesSettings />
					</TabsContent>

					<TabsContent value="shortcuts" className="h-full w-full p-6 m-0 border-none">
						<ShortcutsSettings />
					</TabsContent>

					<TabsContent value="profiles" className="h-full w-full p-6 m-0 border-none">
						<ProfilesSettings />
					</TabsContent>

					<TabsContent value="properties" className="h-full w-full p-6 m-0 border-none">
						<PropertiesSettings />
					</TabsContent>

					<TabsContent value="groups" className="h-full w-full p-6 m-0 border-none">
						<GroupsSettings />
					</TabsContent>

					<TabsContent value="wildcards" className="h-full w-full p-6 m-0 border-none">
						<WildcardsSettings />
					</TabsContent>

					<TabsContent value="thumbnails" className="h-full w-full p-6 m-0 border-none">
						<ThumbnailsSettings />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
