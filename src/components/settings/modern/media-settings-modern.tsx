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
import { BentoGrid, SettingsCard, SettingsGroup, SettingsPageHeader, SettingsRow } from './settings-card';

// Tipos de media soportados
const MEDIA_TYPES = [
	{ id: 'images', label: 'Images', icon: Image, color: 'var(--entity-image)', count: 6245 },
	{ id: 'videos', label: 'Videos', icon: Film, color: 'var(--entity-video)', count: 89 },
	{ id: 'audio', label: 'Audio', icon: Music, color: 'var(--entity-audio)', count: 156 },
	{ id: 'documents', label: 'Documents', icon: FileText, color: 'var(--entity-document)', count: 342 },
	{ id: '3d', label: '3D files', icon: Box, color: 'var(--entity-file-3d)', count: 23 },
	{ id: 'json', label: 'JSON files', icon: FileJson, color: 'var(--entity-json)', count: 78 },
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
			<SettingsPageHeader
				description="Customize how each file type looks and behaves"
				title="Media settings"
			/>

			{/* Media Type Selector */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
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
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="library">Library & management</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="settings">
						<BentoGrid>
							<SettingsCard
								className="lg:col-span-2"
								color="var(--entity-image)"
								description="Configure how images are displayed"
								icon={<Image />}
								title="Image display"
							>
								<SettingsGroup title="Behavior">
									<SettingsRow description="Rotate using EXIF metadata" label="Auto rotate">
										<Switch
											checked={imageSettings.autoRotate}
											onCheckedChange={(checked) => setImageSettings((s) => ({ ...s, autoRotate: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Load the full-resolution preview" label="High-quality preview">
										<Switch
											checked={imageSettings.highQualityPreview}
											onCheckedChange={(checked) => setImageSettings((s) => ({ ...s, highQualityPreview: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Show EXIF information in the panel" label="Show metadata">
										<Switch
											checked={imageSettings.showMetadata}
											onCheckedChange={(checked) => setImageSettings((s) => ({ ...s, showMetadata: checked }))}
										/>
									</SettingsRow>
								</SettingsGroup>

								<Separator className="my-4" />

								<SettingsGroup title="Default zoom">
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<Label>Initial zoom level</Label>
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
								description="Recognized file extensions"
								icon={<Layers />}
								title="Supported formats"
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
						</BentoGrid>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<Tabs className="w-full" defaultValue="scanned">
							<TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
								<TabsTrigger
									className="rounded-none border-transparent border-b-2 px-0 py-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
									value="scanned"
								>
									Scanned library
								</TabsTrigger>
								<TabsTrigger
									className="rounded-none border-transparent border-b-2 px-0 py-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
									value="uploaded"
								>
									Direct uploads retired
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
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="library">Library & management</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="settings">
						<BentoGrid>
							<SettingsCard
								className="lg:col-span-2"
								color="var(--entity-video)"
								description="Configure player behavior"
								icon={<Film />}
								title="Video player"
							>
								<SettingsGroup title="Playback">
									<SettingsRow description="Start playback when opened" label="Autoplay">
										<Switch
											checked={videoSettings.autoplay}
											onCheckedChange={(checked) => setVideoSettings((s) => ({ ...s, autoplay: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Start videos without sound" label="Muted by default">
										<Switch
											checked={videoSettings.muted}
											onCheckedChange={(checked) => setVideoSettings((s) => ({ ...s, muted: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Repeat the video automatically" label="Loop">
										<Switch
											checked={videoSettings.loop}
											onCheckedChange={(checked) => setVideoSettings((s) => ({ ...s, loop: checked }))}
										/>
									</SettingsRow>
								</SettingsGroup>

								<Separator className="my-4" />

								<SettingsGroup title="Volume and preload">
									<SettingsRow description="Initial volume level" label="Default volume">
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
									<SettingsRow description="How much content to load ahead" label="Preload">
										<Select
											onValueChange={(v) => setVideoSettings((s) => ({ ...s, preload: v }))}
											value={videoSettings.preload}
										>
											<SelectTrigger className="w-[160px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">None</SelectItem>
												<SelectItem value="metadata">Metadata</SelectItem>
												<SelectItem value="auto">Automatic</SelectItem>
											</SelectContent>
										</Select>
									</SettingsRow>
								</SettingsGroup>
							</SettingsCard>

							<SettingsCard
								color="var(--entity-video)"
								description="Supported codecs and containers"
								icon={<Layers />}
								title="Supported formats"
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
						</BentoGrid>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<VideosSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'audio' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="library">Library & management</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="settings">
						<BentoGrid>
							<SettingsCard
								className="lg:col-span-2"
								color="var(--entity-audio)"
								description="Configure audio player behavior"
								icon={<Music />}
								title="Audio player"
							>
								<SettingsGroup title="Playback">
									<SettingsRow description="Start playback automatically" label="Autoplay">
										<Switch
											checked={audioSettings.autoplay}
											onCheckedChange={(checked) => setAudioSettings((s) => ({ ...s, autoplay: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Show audio waveforms" label="Visualizer">
										<Switch
											checked={audioSettings.visualizer}
											onCheckedChange={(checked) => setAudioSettings((s) => ({ ...s, visualizer: checked }))}
										/>
									</SettingsRow>
								</SettingsGroup>

								<Separator className="my-4" />

								<SettingsGroup title="Volume">
									<SettingsRow label="Default volume">
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

							<SettingsCard
								className="md:col-span-2 xl:col-span-1"
								color="var(--entity-audio)"
								icon={<Layers />}
								title="Supported formats"
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
						</BentoGrid>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<AudioSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'documents' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="library">Library & management</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="settings">
						<BentoGrid>
							<SettingsCard
								className="lg:col-span-2"
								color="var(--entity-document)"
								description="Configure the PDF and document viewer"
								icon={<FileText />}
								title="Document viewer"
							>
								<SettingsGroup title="Display">
									<SettingsRow description="Show page navigation" label="Sidebar">
										<Switch
											checked={documentSettings.sidebarOpen}
											onCheckedChange={(checked) => setDocumentSettings((s) => ({ ...s, sidebarOpen: checked }))}
										/>
									</SettingsRow>
								</SettingsGroup>

								<Separator className="my-4" />

								<SettingsGroup title="Rendering">
									<SettingsRow label="Rendering mode">
										<Select
											onValueChange={(v) => setDocumentSettings((s) => ({ ...s, renderMode: v }))}
											value={documentSettings.renderMode}
										>
											<SelectTrigger className="w-[160px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="canvas">Canvas (fast)</SelectItem>
												<SelectItem value="svg">SVG (sharp)</SelectItem>
											</SelectContent>
										</Select>
									</SettingsRow>
									<SettingsRow label="Default zoom">
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
								title="Supported formats"
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
						</BentoGrid>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<DocumentSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === '3d' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="library">Library & management</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="settings">
						<BentoGrid>
							<SettingsCard
								className="lg:col-span-2"
								color="var(--entity-file-3d)"
								description="Configure the 3D model viewer"
								icon={<Box />}
								title="3D viewer"
							>
								<SettingsGroup title="Display">
									<SettingsRow description="Rotate the model when loaded" label="Auto rotate">
										<Switch
											checked={settings3D.autoRotate}
											onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, autoRotate: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Show cast shadows" label="Shadows">
										<Switch
											checked={settings3D.shadows}
											onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, shadows: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Display the model as wireframe" label="Wireframe">
										<Switch
											checked={settings3D.wireframe}
											onCheckedChange={(checked) => setSettings3D((s) => ({ ...s, wireframe: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Show the reference grid" label="Grid">
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
								title="Supported formats"
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
						</BentoGrid>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<File3DSettings />
					</TabsContent>
				</Tabs>
			)}

			{activeTab === 'json' && (
				<Tabs className="w-full" defaultValue="settings">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="library">Library & management</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="settings">
						<BentoGrid>
							<SettingsCard
								className="lg:col-span-2"
								color="var(--entity-json)"
								description="Configure the JSON editor and viewer"
								icon={<FileJson />}
								title="Editor JSON"
							>
								<SettingsGroup title="Editor">
									<SettingsRow description="Format JSON automatically when opened" label="Format on load">
										<Switch
											checked={jsonSettings.formatOnLoad}
											onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, formatOnLoad: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Validate against a schema when available" label="Validate schema">
										<Switch
											checked={jsonSettings.validateSchema}
											onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, validateSchema: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Show line numbers" label="Line numbers">
										<Switch
											checked={jsonSettings.lineNumbers}
											onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, lineNumbers: checked }))}
										/>
									</SettingsRow>
									<SettingsRow description="Allow blocks to be folded and expanded" label="Code folding">
										<Switch
											checked={jsonSettings.folding}
											onCheckedChange={(checked) => setJsonSettings((s) => ({ ...s, folding: checked }))}
										/>
									</SettingsRow>
								</SettingsGroup>
							</SettingsCard>

							<SettingsCard color="var(--entity-json)" icon={<Code />} title="Supported formats" variant="outlined">
								<div className="flex flex-wrap gap-2">
									{['.json', '.jsonc', '.json5'].map((ext) => (
										<Badge key={ext} variant="secondary">
											{ext}
										</Badge>
									))}
								</div>
							</SettingsCard>
						</BentoGrid>
					</TabsContent>

					<TabsContent className="mt-6" value="library">
						<JsonFileSettings />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
