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
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';
import { AlbumsSettings } from './albums/albums-settings';
import { AudioSettings } from './audio/audio-settings';
import { CharactersSettings } from './characters/characters-settings';
import { CollectionsSettings } from './collections/collections-settings';
import { ConceptsSettings } from './concepts/concepts-settings';
import { DocumentSettings } from './document/document-settings';
import { EntitiesCardsSettings } from './entities-cards/entities-cards-settings';
import { File3DSettings } from './file3d/file3d-settings';
import { FoldersSettings } from './folders/folders-settings';
import { GroupsSettings } from './groups/groups-settings';
import InterfaceSection from './interface-section';
import { JsonFileSettings } from './json-file/json-file-settings';
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

// Colores para cada tab usando tokens del tema
const tabColors = {
	system: 'hsl(var(--primary))',
	albums: 'var(--entity-album)',
	collections: 'var(--entity-collection)',
	folders: 'var(--entity-folder)',
	interface: 'hsl(var(--primary))',
	tags: 'var(--entity-tag)',
	characters: 'var(--entity-character)',
	'world-items': 'var(--entity-world-item)',
	places: 'var(--entity-place)',
	concepts: 'var(--entity-concept)',
	prompts: 'var(--entity-prompt)',
	notes: 'var(--entity-note)',
	thumbnails: 'var(--entity-image)',
	'uploaded-images': 'var(--entity-image)',
	shortcuts: 'hsl(var(--muted-foreground))',
	'entities-cards': 'var(--entity-file)',
	profiles: 'var(--entity-profile)',
	properties: 'var(--entity-property)',
	groups: 'var(--entity-group)',
	wildcards: 'var(--entity-wildcard)',
	document: 'var(--entity-document)',
	audio: 'var(--entity-audio)',
	'json-file': 'var(--entity-json)',
	file3d: 'var(--entity-file-3d)',
};

// Definición de todos los tabs para evitar la duplicación de código
const tabsData: TabItem[] = [
	{
		id: 'folders',
		label: 'Carpetas',
		icon: <FolderIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.folders,
	},
	{
		id: 'system',
		label: 'Sistema',
		icon: <SettingsIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.system,
	},
	{
		id: 'interface',
		label: 'Interfaz',
		icon: <SettingsIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.interface,
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
	{
		id: 'document',
		label: 'Documentos',
		icon: <BookIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.document,
	},
	{
		id: 'audio',
		label: 'Audio',
		icon: <WandIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.audio,
	},
	{
		id: 'json-file',
		label: 'JSON',
		icon: <BoxIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['json-file'],
	},
	{
		id: 'file3d',
		label: '3D',
		icon: <BoxIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.file3d,
	},
];

export function SettingsView() {
	const [searchParams, setSearchParams] = useSearchParams();

	// 🔗 Leer tab desde URL query params, con fallback a 'folders'
	const tabFromUrl = searchParams.get('tab') || 'folders';

	// ✅ Validar que el tab existe en nuestros tabs disponibles
	const validTab = tabsData.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'folders';

	// 📝 Función para cambiar tab y actualizar URL
	const handleTabChange = React.useCallback(
		(newTab: string) => {
			setSearchParams({ tab: newTab }, { replace: true });
		},
		[setSearchParams]
	);

	// 📡 Escuchar el evento para cambiar la pestaña activa desde otros componentes
	React.useEffect(() => {
		const handleSetSettingsTab = (event: CustomEvent<{ tab: string }>) => {
			const { tab } = event.detail;
			if (tab && tabsData.some((tabData) => tabData.id === tab)) {
				handleTabChange(tab);
			}
		};

		// Añadir el event listener con tipado correcto
		window.addEventListener('set-settings-tab', handleSetSettingsTab as EventListener);

		// Limpiar al desmontar
		return () => {
			window.removeEventListener('set-settings-tab', handleSetSettingsTab as EventListener);
		};
	}, [handleTabChange]);

	return (
		<div className="m-0 h-full w-full p-0">
			<Tabs className="flex h-full flex-row" onValueChange={handleTabChange} value={validTab}>
				{/* 📋 Contenido de los tabs - ÁREA PRINCIPAL A LA IZQUIERDA */}
				<div className="m-0 h-full flex-1 overflow-hidden p-0">
					<TabsContent className="m-0 h-full w-full border-none p-0" value="folders">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<FoldersSettings />
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent className="m-0 h-full w-full border-none p-0" value="system">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<div className="grid w-full grid-cols-1">
									<SystemSettings />
								</div>
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent className="m-0 h-full w-full border-none p-0" value="interface">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<InterfaceSection />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="entities-cards">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<EntitiesCardsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="albums">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<AlbumsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="collections">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<CollectionsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="tags">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<TagsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="characters">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<CharactersSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="world-items">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<WorldItemsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="places">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<PlacesSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="concepts">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<ConceptsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="prompts">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<PromptSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="notes">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<NotesSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="uploaded-images">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<UploadedImagesSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="shortcuts">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<ShortcutsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="profiles">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<ProfilesSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="properties">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<PropertiesSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="groups">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<GroupsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="wildcards">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<WildcardsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="thumbnails">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<ThumbnailsSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="document">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<DocumentSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="audio">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<AudioSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="json-file">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<JsonFileSettings />
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent className="m-0 h-full w-full border-none p-0" value="file3d">
						<ScrollArea className="h-full w-full">
							<div className="p-0">
								<File3DSettings />
							</div>
						</ScrollArea>
					</TabsContent>
				</div>

				{/* 🎨 Sidebar vertical con navegación de tabs - COMPACTO A LA DERECHA */}
				<div className="h-full w-44 shrink-0 overflow-y-auto border-border/20 border-l bg-background/60 backdrop-blur-sm">
					<TabsList className="flex h-auto w-full flex-col justify-start gap-0.5 rounded-none bg-transparent p-1.5">
						{tabsData.map((tab) => (
							<TabsTrigger
								className={cn(
									'flex w-full items-center justify-start gap-2 px-2.5 py-2',
									'rounded-md border border-transparent text-caption',
									'group cursor-pointer transition-all duration-200',
									'hover:border-border/30 hover:bg-secondary/40',
									'data-[state=active]:border-border/30 data-[state=active]:bg-secondary/60',
									'data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-sm'
								)}
								key={tab.id}
								value={tab.id}
							>
								{/* 🎨 Icono con color temático */}
								<span className="flex shrink-0 items-center justify-center" style={{ color: tab.color }}>
									{tab.icon}
								</span>

								{/* 📝 Label con truncado inteligente */}
								<span className="flex-1 truncate text-left">{tab.label}</span>

								{/* ✨ Indicador visual del estado activo */}
								<div
									className="h-3.5 w-0.5 rounded-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"
									style={{ backgroundColor: tab.color }}
								/>
							</TabsTrigger>
						))}
					</TabsList>
				</div>
			</Tabs>
		</div>
	);
}
