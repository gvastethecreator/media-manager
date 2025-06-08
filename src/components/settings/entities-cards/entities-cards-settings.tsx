'use client';

import {
	type CardOptions,
	getCharacterVisualConfig,
	getPlaceVisualConfig,
	getWorldItemVisualConfig,
} from '@/app/actions/visual-config.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OptionsSectionProps {
	title: string;
	options: CardOptions | null;
	onToggle: (key: keyof CardOptions, value: boolean) => void;
}

function OptionsSection({ title, options, onToggle }: OptionsSectionProps) {
	if (!options) return null;
	return (
		<Card className="bg-muted/30 rounded-sm border-none">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-3 space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm">Efecto 3D</span>
					<Switch
						checked={Boolean(options.enable3DEffect)}
						onCheckedChange={(val) => onToggle('enable3DEffect', val)}
					/>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm">Brillo/Halo</span>
					<Switch
						checked={Boolean(options.enableGlowEffect)}
						onCheckedChange={(val) => onToggle('enableGlowEffect', val)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export function EntitiesCardsSettings() {
	const [characterOptions, setCharacterOptions] = useState<CardOptions | null>(null);
	const [placeOptions, setPlaceOptions] = useState<CardOptions | null>(null);
	const [worldItemOptions, setWorldItemOptions] = useState<CardOptions | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			setLoading(true);
			const [c, p, w] = await Promise.all([
				getCharacterVisualConfig(),
				getPlaceVisualConfig(),
				getWorldItemVisualConfig(),
			]);
			setCharacterOptions(c);
			setPlaceOptions(p);
			setWorldItemOptions(w);
			setLoading(false);
		}
		load();
	}, []);

	const handleToggle = (setter: (val: CardOptions) => void) => (key: keyof CardOptions, value: boolean) => {
		setter((prev) => ({ ...(prev ?? {}), [key]: value }));
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-6 text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando configuración...
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<OptionsSection title="Personajes" options={characterOptions} onToggle={handleToggle(setCharacterOptions)} />
			<OptionsSection title="Lugares" options={placeOptions} onToggle={handleToggle(setPlaceOptions)} />
			<OptionsSection title="Objetos" options={worldItemOptions} onToggle={handleToggle(setWorldItemOptions)} />
		</div>
	);
}
