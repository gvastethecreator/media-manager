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
import type { Rarity } from '@prisma/client';
import { X } from 'lucide-react';
import { useState } from 'react';

interface RarityEditorProps {
	rarity: Rarity;
	onUpdate: (rarity: Rarity) => void;
	onClose: () => void;
}

export function RarityEditor({ rarity, onUpdate, onClose }: RarityEditorProps) {
	const [activeTab, setActiveTab] = useState('basic');

	const handleChange = (key: keyof Rarity, value: Rarity[keyof Rarity]) => {
		onUpdate({
			...rarity,
			[key]: value,
		});
	};

	return (
		<Card className="fixed inset-0 z-50 m-4 p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">Editor de Rareza</h3>
				<Button variant="ghost" size="icon" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="basic">Básico</TabsTrigger>
					<TabsTrigger value="effects">Efectos</TabsTrigger>
					<TabsTrigger value="distribution">Distribución</TabsTrigger>
				</TabsList>

				<TabsContent value="basic" className="space-y-4">
					<div className="space-y-2">
						<Label>Nombre</Label>
						<Input value={rarity.name} onChange={(e) => handleChange('name', e.target.value)} />
					</div>

					<div className="space-y-2">
						<Label>Color</Label>
						<ColorPicker color={rarity.color} onChange={(color) => handleChange('color', color)} />
					</div>

					<div className="space-y-2">
						<Label>Descripción</Label>
						<Input value={rarity.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
					</div>

					<div className="space-y-2">
						<Label>Condición de Desbloqueo</Label>
						<Input
							value={rarity.unlockCondition || ''}
							onChange={(e) => handleChange('unlockCondition', e.target.value)}
							placeholder="Ej: level >= 10"
						/>
					</div>
				</TabsContent>

				<TabsContent value="effects" className="space-y-4">
					<div className="space-y-2">
						<Label>Efecto de Borde</Label>
						<Select
							value={rarity.borderEffect || 'none'}
							onValueChange={(value) => handleChange('borderEffect', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un efecto de borde" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Ninguno</SelectItem>
								<SelectItem value="glow">Brillo</SelectItem>
								<SelectItem value="pulse">Pulso</SelectItem>
								<SelectItem value="wave">Onda</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Ancho del Borde</Label>
						<Slider
							value={[rarity.borderWidth || 2]}
							onValueChange={([value]) => handleChange('borderWidth', value)}
							min={0}
							max={10}
							step={0.5}
						/>
					</div>

					<div className="space-y-2">
						<Label>Patrón del Borde</Label>
						<Select
							value={rarity.borderPattern || 'solid'}
							onValueChange={(value) => handleChange('borderPattern', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un patrón" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="solid">Sólido</SelectItem>
								<SelectItem value="dashed">Discontinuo</SelectItem>
								<SelectItem value="dotted">Punteado</SelectItem>
								<SelectItem value="double">Doble</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Animación del Borde</Label>
						<Select
							value={rarity.borderAnimation || 'none'}
							onValueChange={(value) => handleChange('borderAnimation', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona una animación" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Ninguna</SelectItem>
								<SelectItem value="pulse">Pulso</SelectItem>
								<SelectItem value="wave">Onda</SelectItem>
								<SelectItem value="flow">Flujo</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Color del Brillo</Label>
						<ColorPicker
							color={rarity.glowColor || rarity.color}
							onChange={(color) => handleChange('glowColor', color)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Intensidad del Brillo</Label>
						<Slider
							value={[rarity.glowIntensity || 5]}
							onValueChange={([value]) => handleChange('glowIntensity', value)}
							min={0}
							max={20}
							step={0.5}
						/>
					</div>

					<div className="space-y-2">
						<Label>Tamaño del Brillo</Label>
						<Slider
							value={[rarity.glowSize || 100]}
							onValueChange={([value]) => handleChange('glowSize', value)}
							min={0}
							max={200}
							step={5}
						/>
					</div>

					<div className="space-y-2">
						<Label>Animación del Brillo</Label>
						<Select
							value={rarity.glowAnimation || 'none'}
							onValueChange={(value) => handleChange('glowAnimation', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona una animación" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Ninguna</SelectItem>
								<SelectItem value="pulse">Pulso</SelectItem>
								<SelectItem value="wave">Onda</SelectItem>
								<SelectItem value="flow">Flujo</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</TabsContent>

				<TabsContent value="distribution" className="space-y-4">
					<div className="space-y-2">
						<Label>Probabilidad (%)</Label>
						<Slider
							value={[rarity.chance]}
							onValueChange={([value]) => handleChange('chance', value)}
							min={0}
							max={100}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Posición</Label>
						<Input
							type="number"
							value={rarity.position}
							onChange={(e) => handleChange('position', Number.parseInt(e.target.value))}
							min={0}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
}
