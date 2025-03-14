'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormToggle } from '@/components/ui/form-extended';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
	AccessibilityIcon,
	Cpu,
	KeyboardIcon,
	LayoutTemplateIcon,
	MoonIcon,
	PaletteIcon,
	Settings2Icon,
} from 'lucide-react';
import type { CardOptions } from '../../../types/card-settings-types';

// �� Esquema de colores para el panel
const panelColors = {
	system: {
		bg: 'bg-slate-500/5',
		border: 'border-slate-500/20',
		text: 'text-slate-600',
	},
};

type SystemKey = 'raritySystem' | 'textureSystem' | 'categorySystem';

/**
 * Panel de configuración del sistema de tarjetas
 * @component
 */
export function SystemPanel({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// 🔧 Manejador para cambios en las opciones del sistema
	const handleChange = (key: SystemKey, value: boolean) => {
		onChange({
			...options,
			[key]: value,
		});
	};

	return (
		<Card className={cn('w-full', panelColors.system.bg, panelColors.system.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium flex items-center gap-2">
					<Settings2Icon className="h-4 w-4" />
					Configuración del Sistema
				</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Personaliza opciones globales del sistema de tarjetas
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Sistemas */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Cpu className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Subsistemas</h3>
							</div>
							<div className="grid grid-cols-1 gap-2">
								<FormToggle
									id="rarity-system"
									label="Sistema de Raridades"
									description="Habilita el sistema de raridades para las tarjetas"
									checked={options.raritySystem !== undefined ? options.raritySystem : true}
									onCheckedChange={(checked) => handleChange('raritySystem', checked)}
									disabled={disabled}
									icon={<PaletteIcon className="h-3.5 w-3.5 text-muted-foreground" />}
								/>
								<FormToggle
									id="texture-system"
									label="Sistema de Texturas"
									description="Habilita el sistema de texturas para las tarjetas"
									checked={options.textureSystem !== undefined ? options.textureSystem : true}
									onCheckedChange={(checked) => handleChange('textureSystem', checked)}
									disabled={disabled}
									icon={<LayoutTemplateIcon className="h-3.5 w-3.5 text-muted-foreground" />}
								/>
								<FormToggle
									id="category-system"
									label="Sistema de Categorías"
									description="Habilita el sistema de categorías para las tarjetas"
									checked={options.categorySystem !== undefined ? options.categorySystem : true}
									onCheckedChange={(checked) => handleChange('categorySystem', checked)}
									disabled={disabled}
									icon={<KeyboardIcon className="h-3.5 w-3.5 text-muted-foreground" />}
								/>
							</div>
						</div>

						<Separator />

						{/* Apariencia */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<MoonIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Apariencia</h3>
							</div>
							<div className="grid grid-cols-1 gap-3">
								<div className="space-y-2">
									<Label htmlFor="theme-select" className="text-xs text-muted-foreground">
										Tema
									</Label>
									<Select
										id="theme-select"
										defaultValue={options.theme || 'auto'}
										onValueChange={(value) =>
											onChange({
												...options,
												theme: value,
											})
										}
										disabled={disabled}
									>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Seleccionar tema" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="light">Claro</SelectItem>
											<SelectItem value="dark">Oscuro</SelectItem>
											<SelectItem value="auto">Automático</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						<Separator />

						{/* Accesibilidad */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<AccessibilityIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Accesibilidad</h3>
							</div>
							<div className="grid grid-cols-1 gap-2">
								<FormToggle
									id="reduce-motion"
									label="Reducir Movimiento"
									description="Minimiza las animaciones y efectos visuales"
									checked={options.reduceMotion !== undefined ? options.reduceMotion : false}
									onCheckedChange={(checked) =>
										onChange({
											...options,
											reduceMotion: checked,
										})
									}
									disabled={disabled}
								/>
								<FormToggle
									id="high-contrast"
									label="Alto Contraste"
									description="Aumenta el contraste de colores para mejor legibilidad"
									checked={options.highContrast !== undefined ? options.highContrast : false}
									onCheckedChange={(checked) =>
										onChange({
											...options,
											highContrast: checked,
										})
									}
									disabled={disabled}
								/>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
