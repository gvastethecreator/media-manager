'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { FileText, MessageSquare, Tag, Users } from 'lucide-react';
import type { CardOptions } from '../../../types/card-settings-types';

// 🎨 Esquema de colores para el panel
const panelColors = {
	content: {
		bg: 'bg-emerald-500/5',
		border: 'border-emerald-500/20',
		text: 'text-emerald-600',
	},
};

interface ContentPanelProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

/**
 * Panel de configuración del contenido de las tarjetas
 * @component
 */
export function ContentPanel({ options, onChange, disabled = false }: ContentPanelProps) {
	// 📝 Manejador para cambiar la configuración de contenido
	const handleContentChange = (key: string, value: unknown) => {
		onChange({
			...options,
			content: {
				...options.content,
				[key]: value,
			},
		});
	};

	return (
		<Card className={cn('w-full', panelColors.content.bg, panelColors.content.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium flex items-center gap-2">
					<FileText className="h-4 w-4" />
					Contenido
				</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Configura el contenido y la información mostrada en la tarjeta
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Elementos de Contenido */}
						<div className="space-y-3">
							<h3 className="text-xs font-medium">Elementos a Mostrar</h3>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Tag className="h-3.5 w-3.5 text-muted-foreground" />
										<Label htmlFor="show-title" className="text-[11px]">
											Título
										</Label>
									</div>
									<Switch
										id="show-title"
										checked={options.content?.showTitle !== undefined ? options.content.showTitle : true}
										onCheckedChange={(checked) => handleContentChange('showTitle', checked)}
										disabled={disabled}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
										<Label htmlFor="show-description" className="text-[11px]">
											Descripción
										</Label>
									</div>
									<Switch
										id="show-description"
										checked={options.content?.showDescription !== undefined ? options.content.showDescription : true}
										onCheckedChange={(checked) => handleContentChange('showDescription', checked)}
										disabled={disabled}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Users className="h-3.5 w-3.5 text-muted-foreground" />
										<Label htmlFor="show-attributes" className="text-[11px]">
											Atributos
										</Label>
									</div>
									<Switch
										id="show-attributes"
										checked={options.content?.showAttributes !== undefined ? options.content.showAttributes : true}
										onCheckedChange={(checked) => handleContentChange('showAttributes', checked)}
										disabled={disabled}
									/>
								</div>
							</div>
						</div>

						{/* Orden de Elementos */}
						<div className="space-y-3">
							<h3 className="text-xs font-medium">Orden de Elementos</h3>
							<div className="space-y-2">
								<div className="space-y-1">
									<Label htmlFor="content-order" className="text-[11px]">
										Ordenación
									</Label>
									<Select
										id="content-order"
										defaultValue={options.content?.order || 'title-desc-attrs'}
										onValueChange={(value) => handleContentChange('order', value)}
										disabled={disabled}
									>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Seleccionar orden" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="title-desc-attrs">Título → Descripción → Atributos</SelectItem>
											<SelectItem value="title-attrs-desc">Título → Atributos → Descripción</SelectItem>
											<SelectItem value="attrs-title-desc">Atributos → Título → Descripción</SelectItem>
											<SelectItem value="attrs-desc-title">Atributos → Descripción → Título</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						{/* Estilo de Texto */}
						<div className="space-y-3">
							<h3 className="text-xs font-medium">Estilo de Texto</h3>
							<div className="space-y-2">
								<div className="space-y-1">
									<Label htmlFor="text-size" className="text-[11px]">
										Tamaño de Texto
									</Label>
									<Select
										id="text-size"
										defaultValue={options.content?.textSize || 'md'}
										onValueChange={(value) => handleContentChange('textSize', value)}
										disabled={disabled}
									>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Seleccionar tamaño" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="xs">Extra pequeño</SelectItem>
											<SelectItem value="sm">Pequeño</SelectItem>
											<SelectItem value="md">Mediano</SelectItem>
											<SelectItem value="lg">Grande</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
