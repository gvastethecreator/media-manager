'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { Rarity } from '@prisma/client';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';

interface RarityDistributionProps {
	rarities: Rarity[];
	onUpdate: (rarities: Rarity[]) => void;
}

/**
 * Componente para gestionar la distribución de probabilidades de raridades
 * @component
 */
export function RarityDistribution({ rarities, onUpdate }: RarityDistributionProps) {
	const [autoDistribute, setAutoDistribute] = useState(false);

	// Calcular el total de probabilidades y lo que falta o sobra
	const totalChance = rarities.reduce((sum, rarity) => sum + rarity.chance, 0);
	const remainingChance = 100 - totalChance;

	// 🎲 Manejador para cambiar la probabilidad de una rareza
	const handleChanceChange = (id: string, value: number) => {
		const newRarities = rarities.map((rarity) => (rarity.id === id ? { ...rarity, chance: value } : rarity));
		onUpdate(newRarities);
	};

	// ✨ Distribuir automáticamente las probabilidades entre todas las raridades
	const handleAutoDistribute = () => {
		const newRarities = [...rarities];
		const baseChance = 100 / newRarities.length;
		const extraChance = 100 % newRarities.length;

		for (let index = 0; index < newRarities.length; index++) {
			const rarity = newRarities[index];
			rarity.chance = baseChance + (index < extraChance ? 1 : 0);
		}

		onUpdate(newRarities);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Distribución de Probabilidades</Label>
				<div className="flex items-center gap-2">
					<Switch checked={autoDistribute} onCheckedChange={setAutoDistribute} id="auto-distribute" />
					<Label htmlFor="auto-distribute">Distribución Automática</Label>
					<Button
						variant="outline"
						size="sm"
						type="button"
						onClick={handleAutoDistribute}
						className="flex items-center gap-2"
					>
						<Wand2 className="h-4 w-4" />
						Distribuir
					</Button>
				</div>
			</div>

			<div className="space-y-4">
				{rarities.map((rarity) => (
					<Card key={rarity.id} className="p-4">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 rounded-full" style={{ backgroundColor: rarity.color }} />
								<span>{rarity.name}</span>
							</div>
							<span className="text-sm text-muted-foreground">{rarity.chance}%</span>
						</div>
						<Slider
							value={[rarity.chance]}
							onValueChange={([value]) => handleChanceChange(rarity.id, value)}
							min={0}
							max={100}
							step={1}
							disabled={autoDistribute}
						/>
					</Card>
				))}
			</div>

			<div className="flex items-center justify-between text-sm">
				<span>Probabilidad Total: {totalChance}%</span>
				<span className={remainingChance !== 0 ? 'text-destructive' : ''}>
					{remainingChance > 0
						? `Faltan ${remainingChance}%`
						: remainingChance < 0
							? `Exceden ${Math.abs(remainingChance)}%`
							: 'Distribución correcta'}
				</span>
			</div>
		</div>
	);
}
