import { Eye, IdCard, Layout, Palette, RotateCcw, Save } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toastService } from '@/lib/ui/toast';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';

interface EntityCardConfig {
	cardSize: number;
	cardStyle: string;
	densityMode: string;
	hoverEffects: boolean;
	showMetadata: boolean;
	showPreview: boolean;
}

const defaultCardConfig: EntityCardConfig = {
	cardSize: 250,
	showMetadata: true,
	showPreview: true,
	cardStyle: 'default',
	hoverEffects: true,
	densityMode: 'comfortable',
};

export const EntitiesCardsSettings: React.FC = () => {
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s) => s.setPreferences);

	// Load config from preferences
	const [cardConfig, setCardConfig] = useState<EntityCardConfig>(() => {
		const stored = (preferences as any)?.entityCards;
		return stored ? { ...defaultCardConfig, ...stored } : defaultCardConfig;
	});
	const [hasChanges, setHasChanges] = useState(false);

	// Destructure for easier access
	const { cardSize, showMetadata, showPreview, cardStyle, hoverEffects, densityMode } = cardConfig;

	const updateConfig = (updates: Partial<EntityCardConfig>) => {
		setCardConfig((prev) => ({ ...prev, ...updates }));
		setHasChanges(true);
	};

	const handleSave = () => {
		setPreferences({ entityCards: cardConfig } as any);
		setHasChanges(false);
		toastService.success('Card settings saved');
	};

	const handleReset = () => {
		setCardConfig(defaultCardConfig);
		setPreferences({ entityCards: defaultCardConfig } as any);
		setHasChanges(false);
		toastService.info('Card settings restored');
	};

	return (
		<div className="space-y-6 p-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
						<IdCard className="h-5 w-5 text-primary dark:text-primary" />
					</div>
					<div>
						<h2 className="font-semibold text-xl">Entity Card Settings</h2>
						<p className="text-muted-foreground text-sm">
							Personaliza la apariencia y comportamiento de las tarjetas de entidades
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button className="gap-2" disabled={!hasChanges} onClick={handleReset} size="sm" variant="outline">
						<RotateCcw className="h-4 w-4" />
						Restore
					</Button>
					<Button className="gap-2" disabled={!hasChanges} onClick={handleSave} size="sm">
						<Save className="h-4 w-4" />
						Save
					</Button>
				</div>
			</div>

			<Separator />

			<div className="grid gap-4">
				{/* Apariencia General */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Palette className="h-4 w-4" />
							Apariencia General
						</CardTitle>
						<CardDescription>Set the visual style and size of cards</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Tamaño de tarjetas */}
						<div className="space-y-3">
							<Label className="font-medium text-sm">Card size: {cardSize}px</Label>
							<Slider
								className="w-full"
								max={400}
								min={150}
								onValueChange={([v]) => updateConfig({ cardSize: v })}
								step={10}
								value={[cardSize]}
							/>
							<div className="flex justify-between text-muted-foreground text-xs">
								<span>Compacto (150px)</span>
								<span>Grande (400px)</span>
							</div>
						</div>

						{/* Estilo de tarjetas */}
						<div className="space-y-3">
							<Label className="font-medium text-sm">Estilo de tarjetas</Label>
							<Select onValueChange={(v) => updateConfig({ cardStyle: v })} value={cardStyle}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="default">Por defecto</SelectItem>
									<SelectItem value="rounded">Bordes redondeados</SelectItem>
									<SelectItem value="sharp">Bordes afilados</SelectItem>
									<SelectItem value="shadow">Con sombra</SelectItem>
									<SelectItem value="minimal">Minimalista</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Modo de densidad */}
						<div className="space-y-3">
							<Label className="font-medium text-sm">Densidad del </Label>
							<Select onValueChange={(v) => updateConfig({ densityMode: v })} value={densityMode}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compact">Compacto</SelectItem>
									<SelectItem value="comfortable">Comfortable</SelectItem>
									<SelectItem value="spacious">Espacioso</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Funcionalidad */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Layout className="h-4 w-4" />
							Funcionalidad
						</CardTitle>
						<CardDescription>Choose what information appears on cards</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Mostrar metadatos */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="font-medium text-sm">Mostrar metadatos</Label>
								<p className="text-muted-foreground text-xs">
									Show extra details such as dates, sizes, and tags
								</p>
							</div>
							<Switch checked={showMetadata} onCheckedChange={(v) => updateConfig({ showMetadata: v })} />
						</div>

						{/* Mostrar vista previa */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="font-medium text-sm">Automatic preview</Label>
								<p className="text-muted-foreground text-xs">
									Show a preview when you hover over a card
								</p>
							</div>
							<Switch checked={showPreview} onCheckedChange={(v) => updateConfig({ showPreview: v })} />
						</div>

						{/* Efectos hover */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="font-medium text-sm">Efectos de hover</Label>
								<p className="text-muted-foreground text-xs">
									Animaciones y efectos visuales al interactuar con las tarjetas
								</p>
							</div>
							<Switch checked={hoverEffects} onCheckedChange={(v) => updateConfig({ hoverEffects: v })} />
						</div>
					</CardContent>
				</Card>

				{/* Preview */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Eye className="h-4 w-4" />
							Preview
						</CardTitle>
						<CardDescription>Example of cards with the current settings</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-lg border bg-muted/20 p-4">
							<div
								className={`rounded-lg border bg-background p-3 ${cardStyle === 'rounded' ? 'rounded-xl' : ''}
									${cardStyle === 'sharp' ? 'rounded-none' : ''}
									${cardStyle === 'shadow' ? 'shadow-dt-2' : ''}
									${cardStyle === 'minimal' ? 'border-none shadow-none' : ''}
									${hoverEffects ? 'transition-all duration-200 hover:scale-[1.02] hover:shadow-md' : ''}
								`}
								style={{ width: Math.min(cardSize, 300) }}
							>
								<div className="mb-3 flex aspect-video items-center justify-center rounded-md bg-linear-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20">
									<IdCard className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="mb-1 font-medium text-sm">Example Card</h3>
								{showMetadata && (
									<div className="space-y-1">
										<p className="text-muted-foreground text-xs">Example metadata</p>
										<div className="flex gap-1">
											<Badge className="text-xs" variant="secondary">
												Tag
											</Badge>
											<Badge className="text-xs" variant="outline">
												Tipo
											</Badge>
										</div>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
