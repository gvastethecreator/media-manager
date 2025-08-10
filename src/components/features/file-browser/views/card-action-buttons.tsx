/**
 * @file Botones de acción para tarjetas en CardsView
 * @description Componente que muestra botones de acción al hacer hover sobre las tarjetas
 */

import * as LucideIcons from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type CardActionButton, DEFAULT_ACTION_BUTTONS } from '@/types/file-browser/cards-view-config';
import type { AnyEntityWithStats } from '@/types/migration';

interface CardActionButtonsProps {
	/** Entidad sobre la que actuar */
	entity: AnyEntityWithStats;
	/** Si mostrar los botones */
	visible: boolean;
	/** Botones de acción a mostrar (ids o config completa) */
	actionButtons: (string | CardActionButton)[];
	/** Duración de la animación */
	animationDuration?: number;
}

export function CardActionButtons({ entity, visible, actionButtons, animationDuration = 300 }: CardActionButtonsProps) {
	// Normalizar: si llega string => buscar definición por id (DEFAULT_ACTION_BUTTONS)
	const resolvedButtons = React.useMemo(() => {
		return actionButtons
			.map((btn) => {
				if (typeof btn === 'string') {
					return DEFAULT_ACTION_BUTTONS.find((b) => b.id === btn) || null;
				}
				return btn;
			})
			.filter(Boolean) as CardActionButton[];
	}, [actionButtons]);

	// Agrupar botones por posición
	const buttonsByPosition = resolvedButtons
		.filter((btn) => btn.visible)
		.reduce(
			(acc, button) => {
				if (!acc[button.position]) {
					acc[button.position] = [];
				}
				acc[button.position].push(button);
				return acc;
			},
			{} as Record<string, CardActionButton[]>
		);

	const getPositionClasses = (position: string) => {
		switch (position) {
			case 'top-left':
				return 'top-2 left-2';
			case 'top-right':
				return 'top-2 right-2';
			case 'bottom-left':
				return 'bottom-2 left-2';
			case 'bottom-right':
				return 'bottom-2 right-2';
			default:
				return 'top-2 right-2';
		}
	};

	const getAnimationVariants = (position: string) => {
		const isTop = position.includes('top');
		const isLeft = position.includes('left');

		return {
			initial: {
				opacity: 0,
				scale: 0.8,
				x: isLeft ? -10 : 10,
				y: isTop ? -10 : 10,
			},
			animate: {
				opacity: 1,
				scale: 1,
				x: 0,
				y: 0,
			},
			exit: {
				opacity: 0,
				scale: 0.8,
				x: isLeft ? -10 : 10,
				y: isTop ? -10 : 10,
			},
		};
	};

	const renderActionButton = (button: CardActionButton, index: number) => {
		// Obtener el componente de icono dinámicamente
		const IconComponent = (LucideIcons as any)[button.icon] || LucideIcons.Circle;

		const handleClick = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			button.action(entity);
		};

		return (
			<Tooltip key={button.id}>
				<TooltipTrigger asChild>
					<Button
						className={cn(
							'h-8 w-8 border bg-background/80 p-0 shadow-sm hover:bg-background',
							'backdrop-blur-sm transition-all duration-200',
							'hover:scale-110 active:scale-95'
						)}
						onClick={handleClick}
						size="sm"
						style={{
							animationDelay: `${index * 50}ms`,
						}}
						variant="secondary"
					>
						<IconComponent className="h-4 w-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p>{button.tooltip}</p>
				</TooltipContent>
			</Tooltip>
		);
	};

	return (
		<TooltipProvider delayDuration={200}>
			<AnimatePresence>
				{visible &&
					Object.entries(buttonsByPosition).map(([position, buttons]) => (
						<motion.div
							animate="animate"
							className={cn(
								'absolute z-20 flex gap-1',
								getPositionClasses(position),
								position.includes('left') ? 'flex-row' : 'flex-row-reverse',
								position.includes('top') ? 'flex-col' : 'flex-col-reverse'
							)}
							exit="exit"
							initial="initial"
							key={position}
							transition={{
								duration: animationDuration / 1000,
								staggerChildren: 0.05,
							}}
							variants={getAnimationVariants(position)}
						>
							{buttons.map((button, index) => (
								<motion.div
									key={button.id}
									transition={{
										delay: index * 0.05,
										duration: animationDuration / 1000,
									}}
									variants={{
										initial: { opacity: 0, scale: 0.5 },
										animate: { opacity: 1, scale: 1 },
										exit: { opacity: 0, scale: 0.5 },
									}}
								>
									{renderActionButton(button, index)}
								</motion.div>
							))}
						</motion.div>
					))}
			</AnimatePresence>
		</TooltipProvider>
	);
}
