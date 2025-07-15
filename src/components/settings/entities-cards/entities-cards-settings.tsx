import { Eye, IdCard, Layout, Palette } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export const EntitiesCardsSettings: React.FC = () => {
	const [cardSize, setCardSize] = React.useState([250]);
	const [showMetadata, setShowMetadata] = React.useState(true);
	const [showPreview, setShowPreview] = React.useState(true);
	const [cardStyle, setCardStyle] = React.useState('default');
	const [hoverEffects, setHoverEffects] = React.useState(true);
	const [densityMode, setDensityMode] = React.useState('comfortable');

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
					<IdCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h2 className="text-xl font-semibold">Configuración de Tarjetas de Entidades</h2>
					<p className="text-sm text-muted-foreground">
						Personaliza la apariencia y comportamiento de las tarjetas de entidades
					</p>
				</div>
			</div>

			<Separator />

			<div className="grid gap-6">
				{/* Apariencia General */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Palette className="h-4 w-4" />
							Apariencia General
						</CardTitle>
						<CardDescription>Configura el estilo visual y tamaño de las tarjetas</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Tamaño de tarjetas */}
						<div className="space-y-3">
							<Label className="text-sm font-medium">Tamaño de tarjetas: {cardSize[0]}px</Label>
							<Slider value={cardSize} onValueChange={setCardSize} max={400} min={150} step={10} className="w-full" />
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>Compacto (150px)</span>
								<span>Grande (400px)</span>
							</div>
						</div>

						{/* Estilo de tarjetas */}
						<div className="space-y-3">
							<Label className="text-sm font-medium">Estilo de tarjetas</Label>
							<Select value={cardStyle} onValueChange={setCardStyle}>
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
							<Label className="text-sm font-medium">Densidad del layout</Label>
							<Select value={densityMode} onValueChange={setDensityMode}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compact">Compacto</SelectItem>
									<SelectItem value="comfortable">Cómodo</SelectItem>
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
						<CardDescription>Controla qué información mostrar en las tarjetas</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Mostrar metadatos */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="text-sm font-medium">Mostrar metadatos</Label>
								<p className="text-xs text-muted-foreground">
									Incluye información adicional como fechas, tamaños y etiquetas
								</p>
							</div>
							<Switch checked={showMetadata} onCheckedChange={setShowMetadata} />
						</div>

						{/* Mostrar vista previa */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="text-sm font-medium">Vista previa automática</Label>
								<p className="text-xs text-muted-foreground">
									Muestra una vista previa al pasar el cursor sobre la tarjeta
								</p>
							</div>
							<Switch checked={showPreview} onCheckedChange={setShowPreview} />
						</div>

						{/* Efectos hover */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="text-sm font-medium">Efectos de hover</Label>
								<p className="text-xs text-muted-foreground">
									Animaciones y efectos visuales al interactuar con las tarjetas
								</p>
							</div>
							<Switch checked={hoverEffects} onCheckedChange={setHoverEffects} />
						</div>
					</CardContent>
				</Card>

				{/* Vista Previa */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Eye className="h-4 w-4" />
							Vista Previa
						</CardTitle>
						<CardDescription>Ejemplo de cómo se verán las tarjetas con la configuración actual</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="border rounded-lg p-4 bg-muted/20">
							<div
								className={`
									border rounded-lg p-3 bg-background
									${cardStyle === 'rounded' ? 'rounded-xl' : ''}
									${cardStyle === 'sharp' ? 'rounded-none' : ''}
									${cardStyle === 'shadow' ? 'shadow-lg' : ''}
									${cardStyle === 'minimal' ? 'border-none shadow-sm' : ''}
									${hoverEffects ? 'transition-all duration-200 hover:scale-[1.02] hover:shadow-md' : ''}
								`}
								style={{ width: Math.min(cardSize[0], 300) }}
							>
								<div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-md mb-3 flex items-center justify-center">
									<IdCard className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="font-medium text-sm mb-1">Tarjeta de Ejemplo</h3>
								{showMetadata && (
									<div className="space-y-1">
										<p className="text-xs text-muted-foreground">Ejemplo de metadatos</p>
										<div className="flex gap-1">
											<Badge variant="secondary" className="text-xs">
												Etiqueta
											</Badge>
											<Badge variant="outline" className="text-xs">
												Tipo
											</Badge>
										</div>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Acciones */}
				<div className="flex justify-end gap-3">
					<Button variant="outline">Restablecer</Button>
					<Button>Guardar Cambios</Button>
				</div>
			</div>
		</div>
	);
};
