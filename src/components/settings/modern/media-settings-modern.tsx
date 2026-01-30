/**
 * @file Modern Media Settings
 * @module components/settings/modern/media-settings-modern
 * @description Configuración de media: imágenes, videos, audio, documentos, 3D y JSON
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSystemStats } from '@/lib/api/system';
import {
	Image,
	Box,
	AudioWaveform,
	FileText,
	FileJson,
	Settings,
	Play,
	Volume2,
	Eye,
	Maximize,
	RotateCw,
	Monitor,
	FileType,
	Code,
	Layers,
	Film,
	Music,
	Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SettingsCard, SettingsRow, SettingsGroup } from '../modern/settings-card';
import { cn } from '@/lib/utils';
import { DocumentSettings } from '../document/document-settings';
import { File3DSettings } from '../file3d/file3d-settings';
import { JsonFileSettings } from '../json-file/json-file-settings';
import { UploadedImagesSettings } from '../uploaded-images/uploaded-images-settings';
import { ScannedImagesSettings } from '../image/scanned-images-settings';
import { AudioSettings } from '../audio/audio-settings';

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
		return MEDIA_TYPES.map(media => ({
			...media,
			count: media.id === 'images' ? stats.totalImages :
				media.id === 'videos' ? stats.totalVideos :
					media.id === 'audio' ? stats.totalAudio :
						media.id === 'documents' ? stats.totalDocuments :
							media.id === '3d' ? (stats as any).totalFile3D || 0 :
								media.id === 'json' ? (stats as any).totalJsonFiles || 0 : media.count
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
				<h2 className="text-2xl font-semibold text-foreground">Configuración de Media</h2>
				<p className="mt-1 text-sm text-muted-foreground">
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
							key={media.id}
							onClick={() => handleTabChange(media.id)}
							className={cn(
								'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
								isActive
									? 'border-primary bg-primary/5'
									: 'border-transparent bg-muted/30 hover:bg-muted/50'
							)}
						>
							<div
								className="flex h-10 w-10 items-center justify-center rounded-lg"
								style={{ backgroundColor: `${media.color}20` }}
							>
								<Icon className="h-5 w-5" style={{ color: media.color }} />
							</div>
							<span className={cn('text-sm font-medium', isActive && 'text-primary')}>
								{media.label}
							</span>
							<Badge variant="secondary" className="text-xs">
								{media.count.toLocaleString()}
							</Badge>
						</button>
					);
				})}
			</div>

			{/* Content based on active tab */}
			{activeTab === 'images' && (
				<Tabs defaultValue="settings" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-6 mt-6">
						<SettingsCard
							icon={<Image />}
							title="Visualización de Imágenes"
							description="Configura cómo se muestran las imágenes"
							color="var(--entity-image)"
						>
							<SettingsGroup title="Comportamiento">
								<SettingsRow
									label="Rotación automática"
									description="Rotar según metadata EXIF"
								>
									<Switch
										checked={imageSettings.autoRotate}
										onCheckedChange={(checked) =>
											setImageSettings((s) => ({ ...s, autoRotate: checked }))
										}
									/>
								</SettingsRow>
								<SettingsRow
									label="Preview de alta calidad"
									description="Cargar versión completa en preview"
								>
									<Switch
										checked={imageSettings.highQualityPreview}
										onCheckedChange={(checked) =>
											setImageSettings((s) => ({ ...s, highQualityPreview: checked }))
										}
									/>
								</SettingsRow>
								<SettingsRow
									label="Mostrar metadata"
									description="Mostrar información EXIF en panel"
								>
									<Switch
										checked={imageSettings.showMetadata}
										onCheckedChange={(checked) =>
											setImageSettings((s) => ({ ...s, showMetadata: checked }))
										}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Zoom por defecto">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label>Nivel de zoom inicial</Label>
										<span className="text-sm text-muted-foreground">{imageSettings.defaultZoom}%</span>
									</div>
									<Slider
										value={[imageSettings.defaultZoom]}
										onValueChange={([v]) => setImageSettings((s) => ({ ...s, defaultZoom: v }))}
										min={50}
										max={200}
										step={10}
									/>
								</div>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							icon={<Layers />}
							title="Formatos Soportados"
							description="Extensiones de archivo reconocidas"
							color="var(--entity-image)"
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

					<TabsContent value="library" className="mt-6">
						<Tabs defaultValue="scanned" className="w-full">
							<TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
								<TabsTrigger
									value="scanned"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-0 py-2"
								>
									Biblioteca Escaneada
								</TabsTrigger>
								<TabsTrigger
									value="uploaded"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-0 py-2"
								>
									Imágenes Subidas
								</TabsTrigger>
							</TabsList>
							<div className="mt-6">
								<TabsContent value="scanned" className="m-0">
									<ScannedImagesSettings />
								</TabsContent>
								<TabsContent value="uploaded" className="m-0">
									<UploadedImagesSettings />
								</TabsContent>
							</div>
						</Tabs>
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'videos' && (
				<>
					<SettingsCard
						icon={<Film />}
						title="Reproductor de Video"
						description="Configura el comportamiento del reproductor"
						color="var(--entity-video)"
					>
						<SettingsGroup title="Reproducción">
							<SettingsRow label="Autoplay" description="Reproducir automáticamente al abrir">
								<Switch
									checked={videoSettings.autoplay}
									onCheckedChange={(checked) =>
										setVideoSettings((s) => ({ ...s, autoplay: checked }))
									}
								/>
							</SettingsRow>
							<SettingsRow label="Silenciado por defecto" description="Iniciar videos sin sonido">
								<Switch
									checked={videoSettings.muted}
									onCheckedChange={(checked) =>
										setVideoSettings((s) => ({ ...s, muted: checked }))
									}
								/>
							</SettingsRow>
							<SettingsRow label="Loop" description="Repetir video automáticamente">
								<Switch
									checked={videoSettings.loop}
									onCheckedChange={(checked) =>
										setVideoSettings((s) => ({ ...s, loop: checked }))
									}
								/>
							</SettingsRow>
						</SettingsGroup>

						<Separator className="my-4" />

						<SettingsGroup title="Volumen y Precarga">
							<SettingsRow label="Volumen por defecto" description="Nivel inicial de volumen">
								<div className="flex w-48 items-center gap-3">
									<Volume2 className="h-4 w-4 text-muted-foreground" />
									<Slider
										value={[videoSettings.defaultVolume]}
										onValueChange={([v]) => setVideoSettings((s) => ({ ...s, defaultVolume: v }))}
										max={100}
										step={5}
									/>
									<span className="text-sm tabular-nums w-8">{videoSettings.defaultVolume}%</span>
								</div>
							</SettingsRow>
							<SettingsRow label="Precarga" description="Cuánto cargar anticipadamente">
								<Select
									value={videoSettings.preload}
									onValueChange={(v) => setVideoSettings((s) => ({ ...s, preload: v }))}
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
						icon={<Layers />}
						title="Formatos Soportados"
						description="Codecs y contenedores compatibles"
						color="var(--entity-video)"
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
				</>
			)}

			{activeTab === 'audio' && (
				<Tabs defaultValue="settings" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-6 mt-6">
						<SettingsCard
							icon={<Music />}
							title="Reproductor de Audio"
							description="Configura el comportamiento del reproductor de audio"
							color="var(--entity-audio)"
						>
							<SettingsGroup title="Reproducción">
								<SettingsRow label="Autoplay" description="Reproducir automáticamente">
									<Switch
										checked={audioSettings.autoplay}
										onCheckedChange={(checked) =>
											setAudioSettings((s) => ({ ...s, autoplay: checked }))
										}
									/>
								</SettingsRow>
								<SettingsRow label="Visualizador" description="Mostrar ondas de audio">
									<Switch
										checked={audioSettings.visualizer}
										onCheckedChange={(checked) =>
											setAudioSettings((s) => ({ ...s, visualizer: checked }))
										}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Volumen">
								<SettingsRow label="Volumen por defecto">
									<div className="flex w-48 items-center gap-3">
										<Volume2 className="h-4 w-4 text-muted-foreground" />
										<Slider
											value={[audioSettings.defaultVolume]}
											onValueChange={([v]) => setAudioSettings((s) => ({ ...s, defaultVolume: v }))}
											max={100}
											step={5}
										/>
										<span className="text-sm tabular-nums w-8">{audioSettings.defaultVolume}%</span>
									</div>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							icon={<Layers />}
							title="Formatos Soportados"
							color="var(--entity-audio)"
							variant="outlined"
						>
							<div className="flex flex-wrap gap-2">
								{['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent value="library" className="mt-6">
						<AudioSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'documents' && (
				<Tabs defaultValue="settings" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-6 mt-6">
						<SettingsCard
							icon={<FileText />}
							title="Visor de Documentos"
							description="Configura el visor de PDF y documentos"
							color="var(--entity-document)"
						>
							<SettingsGroup title="Visualización">
								<SettingsRow label="Panel lateral" description="Mostrar navegación de páginas">
									<Switch
										checked={documentSettings.sidebarOpen}
										onCheckedChange={(checked) =>
											setDocumentSettings((s) => ({ ...s, sidebarOpen: checked }))
										}
									/>
								</SettingsRow>
							</SettingsGroup>

							<Separator className="my-4" />

							<SettingsGroup title="Renderizado">
								<SettingsRow label="Modo de renderizado">
									<Select
										value={documentSettings.renderMode}
										onValueChange={(v) => setDocumentSettings((s) => ({ ...s, renderMode: v }))}
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
											value={[documentSettings.defaultZoom]}
											onValueChange={([v]) => setDocumentSettings((s) => ({ ...s, defaultZoom: v }))}
											min={50}
											max={200}
											step={10}
										/>
										<span className="text-sm tabular-nums w-10">{documentSettings.defaultZoom}%</span>
									</div>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							icon={<Layers />}
							title="Formatos Soportados"
							color="var(--entity-document)"
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

					<TabsContent value="library" className="mt-6">
						<DocumentSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === '3d' && (
				<Tabs defaultValue="settings" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-6 mt-6">
						<SettingsCard
							icon={<Box />}
							title="Visor 3D"
							description="Configura el visor de modelos 3D"
							color="var(--entity-file-3d)"
						>
							<SettingsGroup title="Visualización">
								<SettingsRow label="Rotación automática" description="Rotar modelo al cargar">
									<Switch
										checked={settings3D.autoRotate}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, autoRotate: checked }))}
									/>
								</SettingsRow>
								<SettingsRow label="Sombras" description="Mostrar sombras proyectadas">
									<Switch
										checked={settings3D.shadows}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, shadows: checked }))}
									/>
								</SettingsRow>
								<SettingsRow label="Malla wireframe" description="Ver modelo en wireframe">
									<Switch
										checked={settings3D.wireframe}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, wireframe: checked }))}
									/>
								</SettingsRow>
								<SettingsRow label="Grid" description="Mostrar cuadrícula de referencia">
									<Switch
										checked={settings3D.grid}
										onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, grid: checked }))}
									/>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							icon={<Layers />}
							title="Formatos Soportados"
							color="var(--entity-file-3d)"
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

					<TabsContent value="library" className="mt-6">
						<File3DSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'json' && (
				<Tabs defaultValue="settings" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Configuración</TabsTrigger>
						<TabsTrigger value="library">Biblioteca & Gestión</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-6 mt-6">
						<SettingsCard
							icon={<FileJson />}
							title="Editor JSON"
							description="Configura el editor y visualizador de JSON"
							color="var(--entity-json)"
						>
							<SettingsGroup title="Editor">
								<SettingsRow label="Formatear al cargar" description="Auto-formatear JSON al abrir">
									<Switch
										checked={jsonSettings.formatOnLoad}
										onCheckedChange={(checked) =>
											setJsonSettings((s) => ({ ...s, formatOnLoad: checked }))
										}
									/>
								</SettingsRow>
								<SettingsRow label="Validar schema" description="Validar contra schema si existe">
									<Switch
										checked={jsonSettings.validateSchema}
										onCheckedChange={(checked) =>
											setJsonSettings((s) => ({ ...s, validateSchema: checked }))
										}
									/>
								</SettingsRow>
								<SettingsRow label="Números de línea" description="Mostrar números de línea">
									<Switch
										checked={jsonSettings.lineNumbers}
										onCheckedChange={(checked) =>
											setJsonSettings((s) => ({ ...s, lineNumbers: checked }))
										}
									/>
								</SettingsRow>
								<SettingsRow label="Plegado de código" description="Permitir fold/unfold de bloques">
									<Switch
										checked={jsonSettings.folding}
										onCheckedChange={(checked) =>
											setJsonSettings((s) => ({ ...s, folding: checked }))
										}
									/>
								</SettingsRow>
							</SettingsGroup>
						</SettingsCard>

						<SettingsCard
							icon={<Code />}
							title="Formatos Soportados"
							color="var(--entity-json)"
							variant="outlined"
						>
							<div className="flex flex-wrap gap-2">
								{['.json', '.jsonc', '.json5'].map((ext) => (
									<Badge key={ext} variant="secondary">
										{ext}
									</Badge>
								))}
							</div>
						</SettingsCard>
					</TabsContent>

					<TabsContent value="library" className="mt-6">
						<JsonFileSettings />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
