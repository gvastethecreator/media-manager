'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Rarity } from '@prisma/client';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RarityDistribution } from './rarity-distribution';
import { RarityEditor } from './rarity-editor';

interface RaritiesPanelProps {
	entityType: string;
	rarities: Rarity[];
	onUpdate: (rarities: Rarity[]) => void;
}

export function RaritiesPanel({ entityType, rarities, onUpdate }: RaritiesPanelProps) {
	const [activeTab, setActiveTab] = useState('list');
	const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);

	const handleAddRarity = () => {
		const newRarity: Partial<Rarity> = {
			entityType,
			name: 'Nueva Rareza',
			color: '#3b82f6',
			position: rarities.length,
			chance: 0,
		};
		onUpdate([...rarities, newRarity as Rarity]);
	};

	const handleDeleteRarity = (id: string) => {
		onUpdate(rarities.filter((r) => r.id !== id));
	};

	const handleMoveRarity = (id: string, direction: 'up' | 'down') => {
		const index = rarities.findIndex((r) => r.id === id);
		if ((direction === 'up' && index === 0) || (direction === 'down' && index === rarities.length - 1)) {
			return;
		}

		const newRarities = [...rarities];
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		[newRarities[index], newRarities[newIndex]] = [newRarities[newIndex], newRarities[index]];

		// Actualizar posiciones
		newRarities.forEach((rarity, i) => {
			rarity.position = i;
		});

		onUpdate(newRarities);
	};

	const handleUpdateRarity = (updatedRarity: Rarity) => {
		onUpdate(rarities.map((r) => (r.id === updatedRarity.id ? updatedRarity : r)));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Sistema de Rarezas</Label>
				<Button variant="outline" size="sm" onClick={handleAddRarity} className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
					Agregar Rareza
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="list">Lista de Rarezas</TabsTrigger>
					<TabsTrigger value="distribution">Distribución</TabsTrigger>
				</TabsList>

				<TabsContent value="list">
					<ScrollArea className="h-[400px]">
						<div className="space-y-2">
							{rarities.map((rarity) => (
								<Card
									key={rarity.id}
									className="p-4 hover:bg-accent/50 cursor-pointer"
									onClick={() => setSelectedRarity(rarity)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-4 h-4 rounded-full" style={{ backgroundColor: rarity.color }} />
											<span>{rarity.name}</span>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation();
													handleMoveRarity(rarity.id, 'up');
												}}
												disabled={rarity.position === 0}
											>
												<ArrowUp className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation();
													handleMoveRarity(rarity.id, 'down');
												}}
												disabled={rarity.position === rarities.length - 1}
											>
												<ArrowDown className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteRarity(rarity.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="distribution">
					<RarityDistribution rarities={rarities} onUpdate={onUpdate} />
				</TabsContent>
			</Tabs>

			{selectedRarity && (
				<RarityEditor rarity={selectedRarity} onUpdate={handleUpdateRarity} onClose={() => setSelectedRarity(null)} />
			)}
		</div>
	);
}
