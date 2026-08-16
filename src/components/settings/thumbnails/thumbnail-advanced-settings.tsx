import { ChevronDown, Info } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
	type EntityThumbnailConfig,
	type ThumbnailAdvancedConfig,
	ThumbnailFallbackStrategy,
} from '@/types/thumbnails-advanced.config';

interface ThumbnailAdvancedSettingsProps {
	config: ThumbnailAdvancedConfig;
	onUpdate: (config: Partial<ThumbnailAdvancedConfig>) => void;
}

const entityLabels: Record<keyof ThumbnailAdvancedConfig['entities'], string> = {
	video: '🎬 Video',
	audio: '🎵 Audio',
	image: '🖼️ Image',
	document: '📄 Document',
	jsonFile: '📝 JSON',
	file3d: '🎲 3D',
};

const fallbackStrategyLabels: Record<ThumbnailFallbackStrategy, { label: string; description: string }> = {
	[ThumbnailFallbackStrategy.AGGRESSIVE]: {
		label: 'Aggressive',
		description: 'Try every available method',
	},
	[ThumbnailFallbackStrategy.CONSERVATIVE]: {
		label: 'Conservative',
		description: 'Try only the first fallback',
	},
	[ThumbnailFallbackStrategy.NONE]: {
		label: 'None',
		description: 'Fail immediately without fallbacks',
	},
};

function InfoTooltip({ content }: { content: string }) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
				</TooltipTrigger>
				<TooltipContent className="max-w-xs">
					<p className="text-xs">{content}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

function EntityConfigSection({
	entityType,
	config,
	onUpdate,
}: {
	entityType: keyof ThumbnailAdvancedConfig['entities'];
	config: EntityThumbnailConfig;
	onUpdate: (config: Partial<EntityThumbnailConfig>) => void;
}) {
	return (
		<div className="space-y-3 rounded-lg border bg-muted/30 p-3">
			<div className="flex items-center justify-between">
				<Label className="font-medium text-sm">{entityLabels[entityType]}</Label>
				<Switch checked={config.enabled} className="scale-75" onCheckedChange={(enabled) => onUpdate({ enabled })} />
			</div>

			{config.enabled && (
				<>
					<div className="space-y-1.5">
						<div className="flex items-center gap-1.5">
							<Label className="text-xs">Timeout (seconds)</Label>
							<InfoTooltip content="Maximum thumbnail generation time before failure" />
						</div>
						<div className="flex items-center gap-2">
							<Slider
								className="flex-1"
								max={120}
								min={5}
								onValueChange={([timeout]) => onUpdate({ timeout })}
								step={5}
								value={[config.timeout]}
							/>
							<span className="w-10 text-right font-mono text-xs">{config.timeout}s</span>
						</div>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center gap-1.5">
							<Label className="text-xs">Fallback Strategy</Label>
							<InfoTooltip content={fallbackStrategyLabels[config.fallbackStrategy].description} />
						</div>
						<Select
							onValueChange={(value) => onUpdate({ fallbackStrategy: value as ThumbnailFallbackStrategy })}
							value={config.fallbackStrategy}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(fallbackStrategyLabels).map(([value, { label }]) => (
									<SelectItem className="text-xs" key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">Preferred Format</Label>
						<Select
							onValueChange={(value) => onUpdate({ preferredFormat: value as any })}
							value={config.preferredFormat}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem className="text-xs" value="webp">
									WebP (recommended)
								</SelectItem>
								<SelectItem className="text-xs" value="jpeg">
									JPEG
								</SelectItem>
								<SelectItem className="text-xs" value="png">
									PNG
								</SelectItem>
								<SelectItem className="text-xs" value="svg">
									SVG
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			)}
		</div>
	);
}

export function ThumbnailAdvancedSettings({ config, onUpdate }: ThumbnailAdvancedSettingsProps) {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<Collapsible onOpenChange={setIsOpen} open={isOpen}>
			<CollapsibleTrigger asChild>
				<Button className="w-full justify-between text-sm" size="sm" variant="outline">
					⚙️ Advanced Settings
					<ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
				</Button>
			</CollapsibleTrigger>

			<CollapsibleContent className="mt-3 space-y-3">
				{/* Procesamiento */}
				<Card className="border-muted/50">
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-sm">🚀 Processing</CardTitle>
						<CardDescription className="text-xs">Performance and concurrency controls</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-3 pt-0">
						<div className="space-y-1.5">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Concurrency</Label>
								<InfoTooltip content="Number of thumbnails processed at the same time" />
							</div>
							<div className="flex items-center gap-2">
								<Slider
									className="flex-1"
									max={16}
									min={1}
									onValueChange={([concurrency]) =>
										onUpdate({
											processing: { ...config.processing, concurrency },
										})
									}
									step={1}
									value={[config.processing.concurrency]}
								/>
								<span className="w-8 text-right font-mono text-xs">{config.processing.concurrency}</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Batch Size</Label>
								<InfoTooltip content="Number of files processed per batch in bulk operations" />
							</div>
							<div className="flex items-center gap-2">
								<Slider
									className="flex-1"
									max={500}
									min={10}
									onValueChange={([batchSize]) =>
										onUpdate({
											processing: { ...config.processing, batchSize },
										})
									}
									step={10}
									value={[config.processing.batchSize]}
								/>
								<span className="w-10 text-right font-mono text-xs">{config.processing.batchSize}</span>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Prioritize Recent Files</Label>
								<InfoTooltip content="Process the newest files first" />
							</div>
							<Switch
								checked={config.processing.prioritizeRecent}
								className="scale-75"
								onCheckedChange={(prioritizeRecent) =>
									onUpdate({
										processing: { ...config.processing, prioritizeRecent },
									})
								}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Reintentos */}
				<Card className="border-muted/50">
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-sm">🔄 Retries</CardTitle>
						<CardDescription className="text-xs">Automatic retry settings</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 p-3 pt-0">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Enable Retries</Label>
								<InfoTooltip content="Retry automatically when generation fails" />
							</div>
							<Switch
								checked={config.retry.enabled}
								className="scale-75"
								onCheckedChange={(enabled) =>
									onUpdate({
										retry: { ...config.retry, enabled },
									})
								}
							/>
						</div>

						{config.retry.enabled && (
							<>
								<div className="space-y-1.5">
									<Label className="text-xs">Maximum Retries</Label>
									<div className="flex items-center gap-2">
										<Slider
											className="flex-1"
											max={10}
											min={0}
											onValueChange={([maxRetries]) =>
												onUpdate({
													retry: { ...config.retry, maxRetries },
												})
											}
											step={1}
											value={[config.retry.maxRetries]}
										/>
										<span className="w-6 text-right font-mono text-xs">{config.retry.maxRetries}</span>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<Label className="text-xs">Exponential Backoff</Label>
										<InfoTooltip content="Increase the delay between retries exponentially" />
									</div>
									<Switch
										checked={config.retry.exponentialBackoff}
										className="scale-75"
										onCheckedChange={(exponentialBackoff) =>
											onUpdate({
												retry: { ...config.retry, exponentialBackoff },
											})
										}
									/>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Configuración por Tipo */}
				<Card className="border-muted/50">
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-sm">🎯 Settings by Type</CardTitle>
						<CardDescription className="text-xs">Format-specific settings</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 p-3 pt-0">
						{(Object.keys(config.entities) as Array<keyof ThumbnailAdvancedConfig['entities']>).map((entityType) => (
							<EntityConfigSection
								config={config.entities[entityType]}
								entityType={entityType}
								key={entityType}
								onUpdate={(entityConfig) =>
									onUpdate({
										entities: {
											...config.entities,
											[entityType]: {
												...config.entities[entityType],
												...entityConfig,
											},
										},
									})
								}
							/>
						))}
					</CardContent>
				</Card>

				{/* Opciones Generales */}
				<Card className="border-muted/50">
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-sm">🔧 General Options</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 p-3 pt-0">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Generate During Indexing</Label>
								<InfoTooltip content="Generate thumbnails automatically during indexing" />
							</div>
							<Switch
								checked={config.generateOnIndex}
								className="scale-75"
								onCheckedChange={(generateOnIndex) => onUpdate({ generateOnIndex })}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Save Placeholders</Label>
								<InfoTooltip content="Save SVG placeholders when generation fails" />
							</div>
							<Switch
								checked={config.savePlaceholdersOnError}
								className="scale-75"
								onCheckedChange={(savePlaceholdersOnError) => onUpdate({ savePlaceholdersOnError })}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Label className="text-xs">Verbose Logging</Label>
								<InfoTooltip content="Enable detailed debugging logs" />
							</div>
							<Switch
								checked={config.verboseLogging}
								className="scale-75"
								onCheckedChange={(verboseLogging) => onUpdate({ verboseLogging })}
							/>
						</div>
					</CardContent>
				</Card>

				<Separator />

				<Button
					className="w-full text-xs"
					onClick={() => {
						// Reset to defaults
						const { DEFAULT_THUMBNAIL_ADVANCED_CONFIG } = require('@/types/thumbnails-advanced.config');
						onUpdate(DEFAULT_THUMBNAIL_ADVANCED_CONFIG);
					}}
					size="sm"
					variant="outline"
				>
					Restore Defaults
				</Button>
			</CollapsibleContent>
		</Collapsible>
	);
}
