/**
 * @file Modern Media Settings
 * @module components/settings/modern/media-settings-modern
 * @description Configuración de media: imágenes, videos, audio, documentos, 3D y JSON
 */

import { Box, Code, FileJson, FileText, Film, Image, Layers, Music, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemStats } from '@/lib/api/system';
import { cn } from '@/lib/utils';
import { AudioSettings } from '../media/audio-settings';
import { DocumentSettings } from '../media/document-settings';
import { File3DSettings } from '../media/file3d-settings';
import { JsonFileSettings } from '../media/json-file-settings';
import { ScannedImagesSettings } from '../media/scanned-images-settings';
import { UploadedImagesSettings } from '../media/uploaded-images-settings';
import { VideosSettings } from '../media/videos-settings';
import { SettingsCard, SettingsGroup, SettingsRow } from './settings-card';

// Tipos de media soportados
const MEDIA_TYPES = [
	{ id: 'images', label: 'Imágenes', icon: Image, color: 'var(--entity-image)', count: 6245 },
	{ id: 'videos', label: 'Videos', icon: Film, color: 'var(--entity-video)', count: 89 },
	{ id: 'audio', label: 'Audio', icon: Music, color: 'var(--entity-audio)', count: 156 },
	{ id: 'documents', label: 'Documentos', icon: FileText, color: 'var(--entity-document)', count: 342 },
	{ id: '3d', label: 'Archivos 3D', icon: Box, color: 'var(--entity-file-3d)', count: 23 },
	{ id: 'json', label: 'Archivos JSON', icon: FileJson, color: 'var(--entity-json)', count: 78 },
];

export function MediaSettingsModern() {
	const [searchParams, setSearchParams] = useSearchParams();
	const currentItem = searchParams.get('item') || 'images';

	// Fetch real stats
	const { data: stats } = useSystemStats();

	const [activeTab, setActiveTab] = useState(() => {
		const isValidTab = MEDIA_TYPES.some((m) => m.id === currentItem);
		return isValidTab ? currentItem : 'images';
	});

	// Update MEDIA_TYPES with real counts
	const mediaTypesWithStats = useMemo(() => {
		if (!stats) return MEDIA_TYPES;
		return MEDIA_TYPES.map((media) => ({
			...media,
			count:
				media.id === 'images'
					? stats.totalImages
					: media.id === 'videos'
						? stats.totalVideos
						: media.id === 'audio'
							? stats.totalAudio
							: media.id === 'documents'
								? stats.totalDocuments
								: media.id === '3d'
									? (stats as any).totalFile3D || 0
									: media.id === 'json'
										? (stats as any).totalJsonFiles || 0
										: media.count,
		}));
	}, [stats]);

	// Sync local state when URL changes
	useEffect(() => {
		const isValidTab = MEDIA_TYPES.some((m) => m.id === currentItem);
		if (isValidTab && currentItem !== activeTab) {
			setActiveTab(currentItem);
		}
	}, [currentItem, activeTab]);

	// Update URL when tab changes
	const handleTabChange = (tabId: string) => {
		setActiveTab(tabId);
		setSearchParams({ section: 'media', item: tabId }, { replace: true });
	};

	// Image settings
	const [imageSettings, setImageSettings] = useState({
		autoRotate: true,
		highQualityPreview: true,
		showMetadata: true,
		defaultZoom: 100,
	});

	// Video settings
	const [videoSettings, setVideoSettings] = useState({
		autoplay: false,
		muted: true,
		loop: false,
		defaultVolume: 80,
		preload: 'metadata',
	});

	// Audio settings
	const [audioSettings, setAudioSettings] = useState({
		autoplay: false,
		defaultVolume: 70,
		visualizer: true,
	});

	// Document settings
	const [documentSettings, setDocumentSettings] = useState({
		defaultZoom: 100,
		sidebarOpen: true,
		renderMode: 'canvas',
	});

	// 3D settings
	const [settings3D, setSettings3D] = useState({
		autoRotate: false,
		shadows: true,
		wireframe: false,
		grid: true,
	});

	// JSON settings
	const [jsonSettings, setJsonSettings] = useState({
		formatOnLoad: true,
		validateSchema: true,
		lineNumbers: true,
		folding: true,
	});

	const activeMedia = MEDIA_TYPES.find((m) => m.id === activeTab);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-semibold text-2xl text-foreground">Configuración de Media</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Personaliza la visualización y comportamiento de cada tipo de archivo
				</p>
			</div>

			{/* Media Type Selector */}
			<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
				{mediaTypesWithStats.map((media) => {
					const Icon = media.icon;
					const isActive = activeTab === media.id;
					return (
						<button
							className={cn(
								'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
								isActive ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30 hover:bg-muted/50'
							)}
							key={media.id}
							onClick={() => handleTabChange(media.id)}
							type="button"
						>
							<div
								className="flex h-10 w-10 items-center justify-center rounded-lg"
								style={{ backgroundColor: `${media.color}20` }}
							>
								<Icon className="h-5 w-5" style={{ color: media.color }} />
							</div>
							<span className={cn('font-medium text-sm', isActive && 'text-primary')}>{media.label}</span>
							<Badge className="text-xs" variant="secondary">
								{media.count.toLocaleString()}
							</Badge>
						</button>
					);
				})}
			</div>

			{/* Content based on active tab */}
			{activeTab === 'images' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-6" value="settings">
						<SettingsCard
							color="var(--entity-image)"
							description="Configura cómo se muestran las imágenes"
							icon={<Image />}
							title="Visualización de Imágenes"
						>
							<SettingsGroup title="Comportamiento">
								<SettingsRow description="Rotar según metadata EXIF" label="Rotación automática">
									<Switch
										checked={imageSettings.autoRotate}
										onCheckedChange={(checked) => setImageSettings((s) => ({ ...s, autoRotate: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Cargar versión completa en preview" label="Preview de alta calidad">
									<Switch
										checked={imageSettings.highQualityPreview}
										onCheckedChange={(checked) => setImageSettings((s) => ({ ...s, highQualityPreview: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Mostrar información EXIF en panel" label="Mostrar metadata">
									<Switch
										checked={imageSettings.showMetadata}
										onCheckedChange={(checked) => setImageSettings((s) => ({ ...s, showMetadata: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Zoom por defecto">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label>Nivel de zoom inicial</Label>
										<span className="text-muted-foreground text-sm">{imageSettings.defaultZoom}%</span>
									</div>
									<Slider
										max={200}
										min={50}
										onValueChange={([v]) => setImageSettings((s) => ({ ...s, defaultZoom: v }))}
										step={10}
										value={[imageSettings.defaultZoom]}
									/>
								</div>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							color="var(--entity-image)"
							description="Extensiones de archivo reconocidas"
							icon={<Layers />}
							title="Formatos Soportados"
							variant="outlined"
						>
							<div className="flex flex-wrap gap-2">
								{['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.avif'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<Tabs className="w-full" defaultValue="scanned">
							<TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
								<TabsTrigger
									className="rounded-none border-transparent border-b-2 px-0 py-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
									value="scanned"
								>
									Biblioteca Escaneada
								</TabsTrigger>
								<TabsTrigger
									className="rounded-none border-transparent border-b-2 px-0 py-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
									value="uploaded"
								>
									Imágenes Subidas
								</TabsTrigger>
							</TabsList>
							<div className="mt-6">
								<TabsContent className="m-0" value="scanned">
									<ScannedImagesSettings />
								</TabsContent>
								<TabsContent className="m-0" value="uploaded">
									<UploadedImagesSettings />
								</TabsContent>
							</div>
						</Tabs>
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'videos' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-6" value="settings">
						<SettingsCard
							color="var(--entity-video)"
							description="Configura el comportamiento del reproductor"
							icon={<Film />}
							title="Reproductor de Video"
						>
							<SettingsGroup title="Reproducción">
								<SettingsRow description="Reproducir automáticamente al abrir" label="Autoplay">
									<Switch
										checked={videoSettings.autoplay}
										onCheckedChange={(checked) => setVideoSettings((s) => ({ ...s, autoplay: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Iniciar videos sin sonido" label="Silenciado por defecto">
									<Switch
										checked={videoSettings.muted}
										onCheckedChange={(checked) => setVideoSettings((s) => ({ ...s, muted: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Repetir video automáticamente" label="Loop">
									<Switch
										checked={videoSettings.loop}
										onCheckedChange={(checked) => setVideoSettings((s) => ({ ...s, loop: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Volumen y Precarga">
								<SettingsRow description="Nivel inicial de volumen" label="Volumen por defecto">
									<div className="flex w-48 items-center gap-3">
										<Volume2 className="h-4 w-4 text-muted-foreground" />
										<Slider
											max={100}
											onValueChange={([v]) => setVideoSettings((s) => ({ ...s, defaultVolume: v }))}
											step={5}
											value={[videoSettings.defaultVolume]}
										/>
										<span className="w-8 text-sm tabular-nums">{videoSettings.defaultVolume}%</span>
									</div>
								</SettingsRow>
								<SettingsRow description="Cuánto cargar anticipadamente" label="Precarga">
									<Select
										onValueChange={(v) => setVideoSettings((s) => ({ ...s, preload: v }))}
										value={videoSettings.preload}
									>
										<SelectTrigger className="w-[160px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Ninguna</SelectItem>
											<SelectItem value="metadata">Metadata</SelectItem>
											<SelectItem value="auto">Automática</SelectItem>
										</SelectContent>
									</Select>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							color="var(--entity-video)"
							description="Codecs y contenedores compatibles"
							icon={<Layers />}
							title="Formatos Soportados"
							variant="outlined"
						>
							<div className="flex flex-wrap gap-2">
								{['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<VideosSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'audio' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-6" value="settings">
						<SettingsCard
							color="var(--entity-audio)"
							description="Configura el comportamiento del reproductor de audio"
							icon={<Music />}
							title="Reproductor de Audio"
						>
							<SettingsGroup title="Reproducción">
								<SettingsRow description="Reproducir automáticamente" label="Autoplay">
									<Switch
										checked={audioSettings.autoplay}
										onCheckedChange={(checked) => setAudioSettings((s) => ({ ...s, autoplay: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Mostrar ondas de audio" label="Visualizador">
									<Switch
										checked={audioSettings.visualizer}
										onCheckedChange={(checked) => setAudioSettings((s) => ({ ...s, visualizer: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Volumen">
								<SettingsRow label="Volumen por defecto">
									<div className="flex w-48 items-center gap-3">
										<Volume2 className="h-4 w-4 text-muted-foreground" />
										<Slider
											max={100}
											onValueChange={([v]) => setAudioSettings((s) => ({ ...s, defaultVolume: v }))}
											step={5}
											value={[audioSettings.defaultVolume]}
										/>
										<span className="w-8 text-sm tabular-nums">{audioSettings.defaultVolume}%</span>
									</div>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard color="var(--entity-audio)" icon={<Layers />} title="Formatos Soportados" variant="outlined">
							<div className="flex flex-wrap gap-2">
								{['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<AudioSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'documents' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-6" value="settings">
						<SettingsCard
							color="var(--entity-document)"
							description="Configura el visor de PDF y documentos"
							icon={<FileText />}
							title="Visor de Documentos"
						>
							<SettingsGroup title="Visualización">
								<SettingsRow description="Mostrar navegación de páginas" label="Panel lateral">
									<Switch
										checked={documentSettings.sidebarOpen}
										onCheckedChange={(checked) => setDocumentSettings((s) => ({ ...s, sidebarOpen: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Renderizado">
								<SettingsRow label="Modo de renderizado">
									<Select
										onValueChange={(v) => setDocumentSettings((s) => ({ ...s, renderMode: v }))}
										value={documentSettings.renderMode}
									>
										<SelectTrigger className="w-[160px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="canvas">Canvas (rápido)</SelectItem>
											<SelectItem value="svg">SVG (nítido)</SelectItem>
										</SelectContent>
									</Select>
								</SettingsRow>
								<SettingsRow label="Zoom por defecto">
									<div className="flex w-48 items-center gap-3">
										<Slider
											max={200}
											min={50}
											onValueChange={([v]) => setDocumentSettings((s) => ({ ...s, defaultZoom: v }))}
											step={10}
											value={[documentSettings.defaultZoom]}
										/>
										<span className="w-10 text-sm tabular-nums">{documentSettings.defaultZoom}%</span>
									</div>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							color="var(--entity-document)"
							icon={<Layers />}
							title="Formatos Soportados"
							variant="outlined"
						>
							<div className="flex flex-wrap gap-2">
								{['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<DocumentSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === '3d' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-6" value="settings">
						<SettingsCard
							color="var(--entity-file-3d)"
							description="Configura el visor de modelos 3D"
							icon={<Box />}
							title="Visor 3D"
						>
							<SettingsGroup title="Visualización">
								<SettingsRow description="Rotar modelo al cargar" label="Rotación automática">
									<Switch
										checked={settings3D.autoRotate}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, autoRotate: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Mostrar sombras proyectadas" label="Sombras">
									<Switch
										checked={settings3D.shadows}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, shadows: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Ver modelo en wireframe" label="Malla wireframe">
									<Switch
										checked={settings3D.wireframe}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, wireframe: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Mostrar cuadrícula de referencia" label="Grid">
									<Switch
										checked={settings3D.grid}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, grid: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							color="var(--entity-file-3d)"
							icon={<Layers />}
							title="Formatos Soportados"
							variant="outlined"
						>
							<div className="flex flex-wrap gap-2">
								{['.obj', '.gltf', '.glb', '.fbx', '.stl', '.dae'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<File3DSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'json' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-6" value="settings">
						<SettingsCard
							color="var(--entity-json)"
							description="Configura el editor y visualizador de JSON"
							icon={<FileJson />}
							title="Editor JSON"
						>
							<SettingsGroup title="Editor">
								<SettingsRow description="Auto-formatear JSON al abrir" label="Formatear al cargar">
									<Switch
										checked={jsonSettings.formatOnLoad}
										onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, formatOnLoad: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Validar contra schema si existe" label="Validar schema">
									<Switch
										checked={jsonSettings.validateSchema}
										onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, validateSchema: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Mostrar números de línea" label="Números de línea">
									<Switch
										checked={jsonSettings.lineNumbers}
										onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, lineNumbers: checked }))}
									/>
								</SettingsRow>
								<SettingsRow description="Permitir fold/unfold de bloques" label="Plegado de código">
									<Switch
										checked={jsonSettings.folding}
										onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, folding: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard color="var(--entity-json)" icon={<Code />} title="Formatos Soportados" variant="outlined">
							<div className="flex flex-wrap gap-2">
								{['.json', '.jsonc', '.json5'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<JsonFileSettings />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
