'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MousePointerClickIcon, HandIcon, GestureTapIcon, DragSelectIcon } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	FormLayout,
	FormSection,
	FormToggle,
	FormSelect,
	FormRow,
	FormGroup,
	PanelHeader
} from './shared/form-components';
import { panelColors } from './shared/panel-helpers';
import type { CardOptions } from '../types';

const clickActionOptions = [
	{ value: 'none', label: 'Ninguna' },
	{ value: 'flip', label: 'Voltear' },
	{ value: 'expand', label: 'Expandir' },
	{ value: 'select', label: 'Seleccionar' },
	{ value: 'navigate', label: 'Navegar' },
	{ value: 'custom', label: 'Personalizada' }
];

const hoverActionOptions = [
	{ value: 'none', label: 'Ninguna' },
	{ value: 'preview', label: 'Previsualizar' },
	{ value: 'highlight', label: 'Resaltar' },
	{ value: 'showInfo', label: 'Mostrar información' },
	{ value: 'custom', label: 'Personalizada' }
];

const touchBehaviorOptions = [
	{ value: 'tap', label: 'Tap simple' },
	{ value: 'doubleTap', label: 'Tap doble' },
	{ value: 'longPress', label: 'Pulsación larga' },
	{ value: 'swipe', label: 'Deslizar' }
];

export function InteractionSettings({
	options,
	onChange,
	disabled = false
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	const [activeTab, setActiveTab] = useState('actions');

	// Obtenemos el objeto interactivity del core o inicializamos uno vacío
	const coreConfig = options.core?.interactivity || {};

	// Obtenemos los valores existentes o los predeterminados
	const clickAction = options.interaction?.clickAction || 'none';
	const hoverAction = options.interaction?.hoverAction || 'none';
	const dragEnabled = options.interaction?.dragEnabled ?? false;
	const resizeEnabled = options.interaction?.resizeEnabled ?? false;
	const touchBehavior = coreConfig.touchBehavior || 'tap';

	// Manejador para cambios en las opciones de interacción
	const handleInteractionChange = (key: string, value: unknown) => {
		onChange({
			...options,
			interaction: {
				...options.interaction,
				[key]: value,
			},
		});
	};

	// Manejador para cambios en las opciones de core
	const handleCoreInteractivityChange = (key: string, value: unknown) => {
		onChange({
			...options,
			core: {
				...options.core,
				interactivity: {
					...coreConfig,
					[key]: value
				}
			}
		});
	};

	return (
		<Card className={cn('w-full', panelColors.interaction.bg, panelColors.interaction.border)}>
			<FormLayout>
				<PanelHeader
					title="Opciones de Interacción"
					description="Configura cómo responde la tarjeta a las interacciones del usuario"
				/>

				<Tabs defaultValue="actions" className="w-full" onValueChange={setActiveTab} value={activeTab}>
					<TabsList className="w-full grid grid-cols-3 h-9 mb-4">
						<TabsTrigger value="actions" className="text-xs">
							<MousePointerClickIcon className="h-3.5 w-3.5 mr-1" />
							Acciones
						</TabsTrigger>
						<TabsTrigger value="behavior" className="text-xs">
							<HandIcon className="h-3.5 w-3.5 mr-1" />
							Comportamiento
						</TabsTrigger>
						<TabsTrigger value="touch" className="text-xs">
							<GestureTapIcon className="h-3.5 w-3.5 mr-1" />
							Táctil
						</TabsTrigger>
					</TabsList>

					{/* Tab de Acciones */}
					<TabsContent value="actions" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection title="Acciones de Ratón">
							<FormGroup>
								<FormSelect
									id="clickAction"
									label="Acción al Click"
									description="Comportamiento al hacer clic en la tarjeta"
									value={clickAction}
									onValueChange={(value) => handleInteractionChange('clickAction', value)}
									options={clickActionOptions}
									disabled={disabled}
								/>

								<FormSelect
									id="hoverAction"
									label="Acción al Hover"
									description="Comportamiento al pasar el cursor sobre la tarjeta"
									value={hoverAction}
									onValueChange={(value) => handleInteractionChange('hoverAction', value)}
									options={hoverActionOptions}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>
					</TabsContent>

					{/* Tab de Comportamiento */}
					<TabsContent value="behavior" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection title="Manipulación">
							<FormGroup>
								<FormToggle
									id="dragEnabled"
									label="Permitir Arrastrar"
									description="Habilita el arrastre de la tarjeta"
									checked={dragEnabled}
									onCheckedChange={(checked) => handleInteractionChange('dragEnabled', checked)}
									disabled={disabled}
									icon={<DragSelectIcon className="h-4 w-4" />}
								/>

								<FormToggle
									id="resizeEnabled"
									label="Permitir Redimensionar"
									description="Habilita el redimensionamiento de la tarjeta"
									checked={resizeEnabled}
									onCheckedChange={(checked) => handleInteractionChange('resizeEnabled', checked)}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>
					</TabsContent>

					{/* Tab de Touch */}
					<TabsContent value="touch" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection title="Comportamiento táctil">
							<FormGroup>
								<FormSelect
									id="touchBehavior"
									label="Gesto táctil principal"
									description="Tipo de gesto táctil para la interacción principal"
									value={touchBehavior}
									onValueChange={(value) => handleCoreInteractivityChange('touchBehavior', value)}
									options={touchBehaviorOptions}
									disabled={disabled}
								/>

								<FormToggle
									id="haptics"
									label="Feedback háptico"
									description="Habilita vibraciones al interactuar (dispositivos compatibles)"
									checked={coreConfig.enableHaptics ?? false}
									onCheckedChange={(checked) => handleCoreInteractivityChange('enableHaptics', checked)}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>
					</TabsContent>
				</Tabs>
			</FormLayout>
		</Card>
	);
}
