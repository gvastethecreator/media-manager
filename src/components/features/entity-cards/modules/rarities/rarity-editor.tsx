'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { useState } from 'react';

// Definir un tipo personalizado para la rareza que incluya todas las propiedades necesarias
interface RarityWithExtendedProps {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	color: string;
	entityType: string;
	position: number;
	borderWidth: number | null;
	// Propiedades adicionales que no están en el tipo Rarity de Prisma
	probability?: number;
	enabled?: boolean;
	borderStyle?: string;
	textStyle?: string;
	hasGlow?: boolean;
	glowColor?: string;
	glowIntensity?: number;
	hasAnimation?: boolean;
	animationType?: string;
	animationSpeed?: number;
	// Otras propiedades que puedan ser necesarias
	[key: string]: unknown;
}

// Tipo para las opciones de configuración de rareza
interface RarityOptions {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	icon?: React.ReactNode;
	style?: string;
	glow?: boolean;
	glowIntensity?: number;
	border?: boolean;
	borderWidth?: number;
	animation?: boolean;
	animationType?: string;
	animationSpeed?: number;
	// Otras propiedades adicionales
	[key: string]: unknown;
}

interface RarityEditorProps {
	rarity: RarityWithExtendedProps;
	onUpdate: (rarity: RarityWithExtendedProps) => void;
	onClose: () => void;
}

/**
 * Componente para editar las propiedades de una rareza
 * @component
 */
export function RarityEditor({ rarity, onUpdate, onClose }: RarityEditorProps) {
	const [activeTab, setActiveTab] = useState('basic');

	// 🧠 Manejador de cambios para actualizar una propiedad de la rareza
	const handleChange = (
		key: keyof RarityWithExtendedProps,
		value: RarityWithExtendedProps[keyof RarityWithExtendedProps]
	) => {
		onUpdate({
			...rarity,
			[key]: value,
		});
	};

	return (
		<Card className="w-full max-w-xl shadow-lg border-2 border-primary/10">
			<div className="flex items-center justify-between border-b p-4">
				<h3 className="text-lg font-semibold">Editar Rareza: {rarity.name}</h3>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onClose}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
				<TabsList className="grid grid-cols-3 w-full">
					<TabsTrigger value="basic">Básico</TabsTrigger>
					<TabsTrigger value="appearance">Apariencia</TabsTrigger>
					<TabsTrigger value="effects">Efectos</TabsTrigger>
				</TabsList>

				<TabsContent value="basic" className="space-y-4 pt-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nombre</Label>
							<Input
								id="name"
								value={rarity.name || ''}
								onChange={(e) => handleChange('name', e.target.value)}
								placeholder="Común, Raro, Épico..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="probability">Probabilidad (%)</Label>
							<Input
								id="probability"
								type="number"
								min="0"
								max="100"
								value={rarity.probability || 0}
								onChange={(e) => handleChange('probability', Number(e.target.value))}
							/>
						</div>
						<div className="space-y-2 col-span-2">
							<Label htmlFor="description">Descripción</Label>
							<Input
								id="description"
								value={rarity.description || ''}
								onChange={(e) => handleChange('description', e.target.value)}
								placeholder="Descripción de la rareza..."
							/>
						</div>
						<div className="space-y-2 col-span-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="enabled">Habilitado</Label>
								<Switch
									id="enabled"
									checked={rarity.enabled}
									onCheckedChange={(checked) => handleChange('enabled', checked)}
								/>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="appearance" className="space-y-4 pt-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<ColorPicker
								id="color"
								value={rarity.color || '#cccccc'}
								onChange={(color) => handleChange('color', color)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="borderStyle">Estilo de Borde</Label>
							<Select
								value={rarity.borderStyle || 'solid'}
								onValueChange={(value) => handleChange('borderStyle', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar estilo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="solid">Sólido</SelectItem>
									<SelectItem value="dashed">Discontinuo</SelectItem>
									<SelectItem value="dotted">Punteado</SelectItem>
									<SelectItem value="double">Doble</SelectItem>
									<SelectItem value="glow">Brillante</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="borderWidth">Ancho del Borde</Label>
							<div className="flex items-center gap-2">
								<Slider
									id="borderWidth"
									value={[rarity.borderWidth || 1]}
									min={0}
									max={10}
									step={0.5}
									onValueChange={(values) => handleChange('borderWidth', values[0])}
								/>
								<span className="w-10 text-right">{rarity.borderWidth || 1}px</span>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="textStyle">Estilo de Texto</Label>
							<Select value={rarity.textStyle || 'normal'} onValueChange={(value) => handleChange('textStyle', value)}>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar estilo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="normal">Normal</SelectItem>
									<SelectItem value="bold">Negrita</SelectItem>
									<SelectItem value="italic">Cursiva</SelectItem>
									<SelectItem value="underline">Subrayado</SelectItem>
									<SelectItem value="glow">Brillante</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="effects" className="space-y-4 pt-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2 col-span-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="hasGlow">Efecto de Brillo</Label>
								<Switch
									id="hasGlow"
									checked={rarity.hasGlow || false}
									onCheckedChange={(checked) => handleChange('hasGlow', checked)}
								/>
							</div>
						</div>
						{rarity.hasGlow && (
							<>
								<div className="space-y-2">
									<Label htmlFor="glowColor">Color del Brillo</Label>
									<ColorPicker
										id="glowColor"
										value={rarity.glowColor || rarity.color || '#cccccc'}
										onChange={(color) => handleChange('glowColor', color)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="glowIntensity">Intensidad del Brillo</Label>
									<div className="flex items-center gap-2">
										<Slider
											id="glowIntensity"
											value={[rarity.glowIntensity || 5]}
											min={1}
											max={20}
											step={1}
											onValueChange={(values) => handleChange('glowIntensity', values[0])}
										/>
										<span className="w-10 text-right">{rarity.glowIntensity || 5}</span>
									</div>
								</div>
							</>
						)}

						<div className="space-y-2 col-span-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="hasAnimation">Animación</Label>
								<Switch
									id="hasAnimation"
									checked={rarity.hasAnimation || false}
									onCheckedChange={(checked) => handleChange('hasAnimation', checked)}
								/>
							</div>
						</div>
						{rarity.hasAnimation && (
							<>
								<div className="space-y-2">
									<Label htmlFor="animationType">Tipo de Animación</Label>
									<Select
										value={rarity.animationType || 'pulse'}
										onValueChange={(value) => handleChange('animationType', value)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar tipo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pulse">Pulso</SelectItem>
											<SelectItem value="sparkle">Destello</SelectItem>
											<SelectItem value="rainbow">Arcoiris</SelectItem>
											<SelectItem value="shake">Vibración</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="animationSpeed">Velocidad de Animación</Label>
									<div className="flex items-center gap-2">
										<Slider
											id="animationSpeed"
											value={[rarity.animationSpeed || 3]}
											min={1}
											max={10}
											step={0.5}
											onValueChange={(values) => handleChange('animationSpeed', values[0])}
										/>
										<span className="w-10 text-right">{rarity.animationSpeed || 3}s</span>
									</div>
								</div>
							</>
						)}
					</div>
				</TabsContent>
			</Tabs>

			<div className="flex justify-end gap-2 p-4 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
				>
					Cancelar
				</Button>
				<Button>Guardar Cambios</Button>
			</div>
		</Card>
	);
}
