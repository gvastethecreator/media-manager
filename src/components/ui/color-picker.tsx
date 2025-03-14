'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function PickerExample() {
	const [background, setBackground] = useState('#B4D455');

	return (
		<div
			className="w-full h-full preview flex min-h-[350px] justify-center p-10 items-center rounded bg-cover! bg-center! transition-all"
			style={{ background }}
		>
			<GradientPicker background={background} setBackground={setBackground} />
		</div>
	);
}

export function GradientPicker({
	background,
	setBackground,
}: {
	background: string;
	setBackground: (background: string) => void;
}) {
	const solids = ['#E2E2E2', '#ff75c3', '#ffa647', '#ffe83f', '#9fff5b', '#70e2ff', '#cd93ff', '#09203f'];

	const gradients = [
		'linear-gradient(to top left,#accbee,#e7f0fd)',
		'linear-gradient(to top left,#d5d4d0,#d5d4d0,#eeeeec)',
		'linear-gradient(to top left,#000000,#434343)',
		'linear-gradient(to top left,#09203f,#537895)',
		'linear-gradient(to top left,#AC32E4,#7918F2,#4801FF)',
		'linear-gradient(to top left,#f953c6,#b91d73)',
		'linear-gradient(to top left,#ee0979,#ff6a00)',
		'linear-gradient(to top left,#F00000,#DC281E)',
		'linear-gradient(to top left,#00c6ff,#0072ff)',
		'linear-gradient(to top left,#4facfe,#00f2fe)',
		'linear-gradient(to top left,#0ba360,#3cba92)',
		'linear-gradient(to top left,#FDFC47,#24FE41)',
		'linear-gradient(to top left,#8a2be2,#0000cd,#228b22,#ccff00)',
		'linear-gradient(to top left,#40E0D0,#FF8C00,#FF0080)',
		'linear-gradient(to top left,#fcc5e4,#fda34b,#ff7882,#c8699e,#7046aa,#0c1db8,#020f75)',
		'linear-gradient(to top left,#ff75c3,#ffa647,#ffe83f,#9fff5b,#70e2ff,#cd93ff)',
	];

	const defaultTab = useMemo(() => {
		if (background.includes('url')) {
			return 'image';
		}
		if (background.includes('gradient')) {
			return 'gradient';
		}
		return 'solid';
	}, [background]);

	return (
		<div className="flex items-center gap-2">
			<Tabs defaultValue={defaultTab} className="w-full">
				<TabsList className="w-full mb-4 text-xs">
					<TabsTrigger className="flex-1" value="solid">
						Solid
					</TabsTrigger>
					<TabsTrigger className="flex-1" value="gradient">
						Gradient
					</TabsTrigger>
				</TabsList>

				<TabsContent value="solid" className="flex flex-wrap gap-1 mt-0">
					{solids.map((s) => (
						<div
							key={s}
							style={{ background: s }}
							className="rounded-md h-6 w-6 cursor-pointer active:scale-105"
							onClick={() => setBackground(s)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									setBackground(s);
								}
							}}
							tabIndex={0}
							role="button"
							aria-label={`Color sólido ${s}`}
						/>
					))}
				</TabsContent>

				<TabsContent value="gradient" className="mt-0">
					<div className="flex flex-wrap gap-1 mb-2">
						{gradients.map((s) => (
							<div
								key={s}
								style={{ background: s }}
								className="rounded-md h-6 w-6 cursor-pointer active:scale-105"
								onClick={() => setBackground(s)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										setBackground(s);
									}
								}}
								tabIndex={0}
								role="button"
								aria-label={`Gradiente ${s}`}
							/>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

const _GradientButton = ({
	background,
	children,
}: {
	background: string;
	children: React.ReactNode;
}) => {
	return (
		<div className="p-0.5 rounded-md relative bg-cover! bg-center! transition-all" style={{ background }}>
			<div className="bg-popover/80 rounded-md p-1 text-xs text-center">{children}</div>
		</div>
	);
};

interface ColorPickerProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
}

export function ColorPicker({ id, value, onChange, disabled = false, className }: ColorPickerProps) {
	const [color, setColor] = useState(value || '#000000');
	const [isOpen, setIsOpen] = useState(false);

	// Actualizar el color cuando cambia el valor de entrada
	useEffect(() => {
		setColor(value || '#000000');
	}, [value]);

	// Manejar cambios en el color
	const handleColorChange = (newColor: string) => {
		setColor(newColor);
		onChange(newColor);
	};

	// Manejar cambios en el input de texto
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		setColor(newColor);

		// Validar que sea un color hexadecimal válido
		if (/^#([0-9A-F]{3}){1,2}$/i.test(newColor)) {
			onChange(newColor);
		}
	};

	// Colores predefinidos comunes
	const presetColors = [
		'#000000',
		'#FFFFFF',
		'#FF0000',
		'#00FF00',
		'#0000FF',
		'#FFFF00',
		'#FF00FF',
		'#00FFFF',
		'#FF9900',
		'#9900FF',
		'#1E293B',
		'#334155',
		'#475569',
		'#64748B',
		'#94A3B8',
		'#E2E8F0',
		'#F1F5F9',
		'#F8FAFC',
	];

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant="outline"
					className={cn('w-full justify-start text-left font-normal', className)}
					disabled={disabled}
				>
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 rounded-sm border" style={{ backgroundColor: color }} />
						<span>{color}</span>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64">
				<div className="grid gap-4">
					<div className="space-y-2">
						<Label htmlFor="color-picker">Color</Label>
						<div className="flex gap-2">
							<Input
								id="color-picker"
								type="color"
								value={color}
								onChange={(e) => handleColorChange(e.target.value)}
								className="h-10 w-10 p-0 cursor-pointer"
							/>
							<Input type="text" value={color} onChange={handleInputChange} className="flex-1" placeholder="#000000" />
						</div>
					</div>

					<div className="space-y-2">
						<Label>Colores Predefinidos</Label>
						<div className="grid grid-cols-6 gap-2">
							{presetColors.map((presetColor) => (
								<button
									key={presetColor}
									type="button"
									className={cn('h-6 w-6 rounded-md border', color === presetColor && 'ring-2 ring-primary')}
									style={{ backgroundColor: presetColor }}
									onClick={() => handleColorChange(presetColor)}
								/>
							))}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
