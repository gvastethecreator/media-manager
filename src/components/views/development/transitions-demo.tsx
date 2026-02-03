/**
 * @file Vista de Demostración de Transiciones
 * @module components/views/development/transitions-demo
 * @description Demo interactivo del sistema de transiciones para desarrollo y debug
 */

import React, { useCallback, useState } from 'react';
import { FlipContainer } from '@/components/transitions/flip-container';
import { MorphContainer } from '@/components/transitions/morph-container';
import { TransitionGroup, TransitionItem } from '@/components/transitions/transition-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider-v3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntityCardTransition, useFlip } from '@/hooks/transitions';
import { customEasings, getEnterExitCoordinator, getFlipEngine } from '@/lib/transitions';
import { cn } from '@/lib/utils';

// ============================================================================
// Demo de FLIP
// ============================================================================

function FlipDemo() {
	const [items, setItems] = useState([
		{ id: '1', color: 'bg-red-500', label: 'A' },
		{ id: '2', color: 'bg-blue-500', label: 'B' },
		{ id: '3', color: 'bg-green-500', label: 'C' },
		{ id: '4', color: 'bg-yellow-500', label: 'D' },
	]);
	const [layout, setLayout] = useState<'row' | 'column' | 'grid'>('row');
	const { ref: flipRef, executeFlip } = useFlip({ id: 'flip-demo-container' });

	const shuffle = useCallback(() => {
		executeFlip(() => {
			setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
		});
	}, [executeFlip]);

	const toggleLayout = useCallback(() => {
		executeFlip(() => {
			setLayout((prev) => {
				if (prev === 'row') return 'column';
				if (prev === 'column') return 'grid';
				return 'row';
			});
		});
	}, [executeFlip]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>FLIP Transitions</CardTitle>
				<CardDescription>First Last Invert Play - Transiciones fluidas de layout</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Button onClick={shuffle} variant="outline">
						Shuffle
					</Button>
					<Button onClick={toggleLayout} variant="outline">
						Cambiar Layout
					</Button>
				</div>

				<div
					className={cn(
						'flex gap-4 rounded-lg bg-muted/30 p-4 transition-all',
						layout === 'row' && 'flex-row',
						layout === 'column' && 'flex-col',
						layout === 'grid' && 'grid grid-cols-2'
					)}
					ref={flipRef as React.RefObject<HTMLDivElement>}
				>
					{items.map((item) => (
						<FlipContainer flipId={`flip-item-${item.id}`} key={item.id}>
							<div
								className={cn(
									'flex h-16 w-16 items-center justify-center rounded-lg font-bold text-white text-xl',
									item.color
								)}
							>
								{item.label}
							</div>
						</FlipContainer>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

// ============================================================================
// Demo de Enter/Exit
// ============================================================================

function EnterExitDemo() {
	const [items, setItems] = useState<string[]>(['A', 'B', 'C']);
	const [direction, setDirection] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom');
	const [duration, setDuration] = useState(400);
	const [stagger, setStagger] = useState(50);

	const addItem = () => {
		const newItem = String.fromCharCode(65 + items.length);
		setItems([...items, newItem]);
	};

	const removeItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const clearAll = () => {
		setItems([]);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Enter/Exit Transitions</CardTitle>
				<CardDescription>Animaciones coordinadas de entrada y salida</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Dirección</Label>
						<Select onValueChange={(v) => setDirection(v as any)} value={direction}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="bottom">Desde abajo</SelectItem>
								<SelectItem value="top">Desde arriba</SelectItem>
								<SelectItem value="left">Desde izquierda</SelectItem>
								<SelectItem value="right">Desde derecha</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Duración: {duration}ms</Label>
						<Slider max={1000} min={100} onValueChange={([v]) => setDuration(v)} step={50} value={[duration]} />
					</div>
				</div>

				<div className="space-y-2">
					<Label>Stagger: {stagger}ms</Label>
					<Slider max={200} min={0} onValueChange={([v]) => setStagger(v)} step={10} value={[stagger]} />
				</div>

				<div className="flex gap-2">
					<Button onClick={addItem}>Agregar</Button>
					<Button onClick={clearAll} variant="destructive">
						Limpiar
					</Button>
				</div>

				<TransitionGroup
					className="flex flex-wrap gap-3"
					enterConfig={{
						type: 'slide',
						direction,
						duration,
					}}
					exitConfig={{
						type: 'slide',
						direction:
							direction === 'bottom' ? 'top' : direction === 'top' ? 'bottom' : direction === 'left' ? 'right' : 'left',
						duration: duration * 0.8,
					}}
					isVisible={items.length > 0}
					staggerDelay={stagger}
				>
					{items.map((item, index) => (
						<TransitionItem id={`item-${item}`} index={index} key={item}>
							<button
								className={cn(
									'flex h-12 w-12 items-center justify-center rounded-lg font-bold',
									'bg-primary text-primary-foreground',
									'transition-colors hover:bg-primary/90'
								)}
								onClick={() => removeItem(index)}
								type="button"
							>
								{item}
							</button>
						</TransitionItem>
					))}
				</TransitionGroup>
			</CardContent>
		</Card>
	);
}

// ============================================================================
// Demo de Morphing
// ============================================================================

function MorphDemo() {
	const [shape, setShape] = useState('square');
	const [color, setColor] = useState('bg-primary');

	const shapes = [
		{ value: 'square', label: 'Cuadrado' },
		{ value: 'rounded', label: 'Redondeado' },
		{ value: 'circle', label: 'Círculo' },
		{ value: 'pill', label: 'Píldora' },
		{ value: 'organic', label: 'Orgánico' },
	];

	const colors = [
		{ value: 'bg-primary', label: 'Primario' },
		{ value: 'bg-secondary', label: 'Secundario' },
		{ value: 'bg-destructive', label: 'Destructivo' },
		{ value: 'bg-accent', label: 'Acento' },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Morphing</CardTitle>
				<CardDescription>Transformaciones de forma fluidas</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex gap-4">
					<div className="flex-1 space-y-2">
						<Label>Forma</Label>
						<Select onValueChange={setShape} value={shape}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{shapes.map((s) => (
									<SelectItem key={s.value} value={s.value}>
										{s.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex-1 space-y-2">
						<Label>Color</Label>
						<Select onValueChange={setColor} value={color}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{colors.map((c) => (
									<SelectItem key={c.value} value={c.value}>
										{c.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex items-center justify-center rounded-lg bg-muted/30 p-8">
					<MorphContainer
						className={cn(
							'flex h-32 w-32 items-center justify-center font-bold text-white transition-colors duration-300',
							color
						)}
						config={{ duration: 500, easing: customEasings.liquid }}
						morphId="demo-morph"
						shape={shape}
					>
						<span className="text-2xl">M</span>
					</MorphContainer>
				</div>
			</CardContent>
		</Card>
	);
}

// ============================================================================
// Demo de Entity Card
// ============================================================================

function EntityCardDemo() {
	const [selected, setSelected] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);

	const entities = [
		{ id: '1', type: 'folder' as const, name: 'Carpeta 1', count: 42 },
		{ id: '2', type: 'image' as const, name: 'Imagen 1', count: 128 },
		{ id: '3', type: 'video' as const, name: 'Video 1', count: 15 },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Entity Card Transitions</CardTitle>
				<CardDescription>Transiciones especializadas para tarjetas de entidades</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-3 gap-4">
					{entities.map((entity) => (
						<EntityCardDemoItem
							entity={entity}
							isExpanded={expanded === entity.id}
							isSelected={selected === entity.id}
							key={entity.id}
							onExpand={() => setExpanded(expanded === entity.id ? null : entity.id)}
							onSelect={() => setSelected(selected === entity.id ? null : entity.id)}
						/>
					))}
				</div>
				<p className="text-muted-foreground text-sm">Click para seleccionar, doble click para expandir</p>
			</CardContent>
		</Card>
	);
}

interface EntityCardDemoItemProps {
	entity: { id: string; type: 'folder' | 'image' | 'video'; name: string; count: number };
	isSelected: boolean;
	isExpanded: boolean;
	onSelect: () => void;
	onExpand: () => void;
}

function EntityCardDemoItem({ entity, isSelected, isExpanded, onSelect, onExpand }: EntityCardDemoItemProps) {
	const { cardRef, handleCardClick, handleSelectionChange, transitionClasses } = useEntityCardTransition({
		entityId: entity.id,
		entityType: entity.type,
		isSelected,
		isExpanded,
	});

	const handleClick = () => {
		handleCardClick(() => onSelect());
	};

	const handleDoubleClick = () => {
		handleCardClick(() => onExpand());
	};

	// Efecto de selección
	React.useEffect(() => {
		handleSelectionChange(isSelected);
	}, [isSelected, handleSelectionChange]);

	return (
		<div
			className={cn(
				'cursor-pointer select-none rounded-lg border p-4',
				'bg-card transition-all',
				isSelected && 'ring-2 ring-primary',
				isExpanded && 'col-span-2 row-span-2',
				transitionClasses
			)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			ref={cardRef}
		>
			<div className="flex items-center gap-3">
				<div
					className={cn(
						'flex h-10 w-10 items-center justify-center rounded-lg text-white',
						entity.type === 'folder' && 'bg-yellow-500',
						entity.type === 'image' && 'bg-blue-500',
						entity.type === 'video' && 'bg-red-500'
					)}
				>
					{entity.type === 'folder' && '📁'}
					{entity.type === 'image' && '🖼️'}
					{entity.type === 'video' && '🎬'}
				</div>
				<div>
					<h4 className="font-medium">{entity.name}</h4>
					<p className="text-muted-foreground text-sm">{entity.count} items</p>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Demo Principal
// ============================================================================

export function TransitionsDemo() {
	return (
		<div className="container mx-auto space-y-6 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl">Sistema de Transiciones</h1>
				<p className="text-muted-foreground">Demostración del sistema de transiciones fluidas para Image Manager</p>
			</div>

			<Tabs className="space-y-6" defaultValue="flip">
				<TabsList>
					<TabsTrigger value="flip">FLIP</TabsTrigger>
					<TabsTrigger value="enterexit">Enter/Exit</TabsTrigger>
					<TabsTrigger value="morph">Morphing</TabsTrigger>
					<TabsTrigger value="entity">Entity Cards</TabsTrigger>
				</TabsList>

				<TabsContent value="flip">
					<FlipDemo />
				</TabsContent>

				<TabsContent value="enterexit">
					<EnterExitDemo />
				</TabsContent>

				<TabsContent value="morph">
					<MorphDemo />
				</TabsContent>

				<TabsContent value="entity">
					<EntityCardDemo />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default TransitionsDemo;

// Exportar función para obtener métricas de rendimiento
export function getTransitionMetrics() {
	return {
		flip: getFlipEngine().getMetrics(),
	};
}

// Exportar función para limpiar transiciones
export function clearAllTransitions() {
	getFlipEngine().destroy();
	getEnterExitCoordinator().clearAll();
}
