'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { CardOptions } from '../types';
import { ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

type SystemKey = 'raritySystem' | 'textureSystem' | 'categorySystem';

export function SystemSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	const handleChange = (key: SystemKey, value: boolean) => {
		onChange({
			...options,
			[key]: value,
		});
	};

	return (
		<Card className={cn('w-full', panelColors.system.bg, panelColors.system.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium">Configuración del Sistema</CardTitle>
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
								<Settings2Icon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-[10px] font-medium">Sistemas</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="raritySystem"
									label="Sistema de Rareza"
									description="Habilita el sistema de rareza para las tarjetas"
									checked={options.raritySystem || false}
									onCheckedChange={(checked) => handleChange('raritySystem', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="textureSystem"
									label="Sistema de Texturas"
									description="Habilita el sistema de texturas para las tarjetas"
									checked={options.textureSystem || false}
									onCheckedChange={(checked) => handleChange('textureSystem', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="categorySystem"
									label="Sistema de Categorías"
									description="Habilita el sistema de categorías para las tarjetas"
									checked={options.categorySystem || false}
									onCheckedChange={(checked) => handleChange('categorySystem', checked)}
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Rendimiento */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Cpu className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-[10px] font-medium">Rendimiento</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="enableSkeleton"
									label="Carga progresiva"
									description="Muestra un esqueleto mientras se carga el contenido"
									checked={options.enableSkeleton ?? false}
									onCheckedChange={(checked) => handleChange('enableSkeleton', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enablePrefetch"
									label="Precarga de recursos"
									description="Carga anticipada de recursos para mejor rendimiento"
									checked={options.enablePrefetch ?? false}
									onCheckedChange={(checked) => handleChange('enablePrefetch', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableLazyLoading"
									label="Carga perezosa"
									description="Carga las imágenes solo cuando son necesarias"
									checked={options.enableLazyLoading ?? false}
									onCheckedChange={(checked) => handleChange('enableLazyLoading', checked)}
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Estados */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<AccessibilityIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-[10px] font-medium">Estados</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="enableHover"
									label="Estado Hover"
									description="Habilita efectos al pasar el mouse por encima"
									checked={options.enableHover ?? false}
									onCheckedChange={(checked) => handleChange('enableHover', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableFocus"
									label="Estado Focus"
									description="Habilita efectos al enfocar la tarjeta"
									checked={options.enableFocus ?? false}
									onCheckedChange={(checked) => handleChange('enableFocus', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableActive"
									label="Estado Active"
									description="Habilita efectos al hacer clic en la tarjeta"
									checked={options.enableActive ?? false}
									onCheckedChange={(checked) => handleChange('enableActive', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableDisabled"
									label="Estado Disabled"
									description="Habilita el estado deshabilitado para las tarjetas"
									checked={options.enableDisabled ?? false}
									onCheckedChange={(checked) => handleChange('enableDisabled', checked)}
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
