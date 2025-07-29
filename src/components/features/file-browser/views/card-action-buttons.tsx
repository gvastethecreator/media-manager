/**
 * @file Botones de acción para tarjetas en CardsView
 * @description Componente que muestra botones de acción al hacer hover sobre las tarjetas
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import type { AnyEntityWithStats } from '@/types/migration';
import type { CardActionButton } from '@/types/file-browser/cards-view-config';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CardActionButtonsProps {
	/** Entidad sobre la que actuar */
	entity: AnyEntityWithStats;
	/** Si mostrar los botones */
	visible: boolean;
	/** Botones de acción a mostrar */
	actionButtons: CardActionButton[];
	/** Duración de la animación */
	animationDuration?: number;
}

export function CardActionButtons({
	entity,
	visible,
	actionButtons,
	animationDuration = 300,
}: CardActionButtonsProps) {
	// Agrupar botones por posición
	const buttonsByPosition = actionButtons
		.filter(btn => btn.visible)
		.reduce((acc, button) => {
			if (!acc[button.position]) {
				acc[button.position] = [];
			}
			acc[button.position].push(button);
			return acc;
		}, {} as Record<string, CardActionButton[]>);

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
						variant="secondary"
						size="sm"
						className={cn(
							'h-8 w-8 p-0 bg-background/80 hover:bg-background border shadow-sm',
							'backdrop-blur-sm transition-all duration-200',
							'hover:scale-110 active:scale-95'
						)}
						onClick={handleClick}
						style={{
							animationDelay: `${index * 50}ms`,
						}}
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
				{visible && Object.entries(buttonsByPosition).map(([position, buttons]) => (
					<motion.div
						key={position}
						className={cn(
							'absolute z-20 flex gap-1',
							getPositionClasses(position),
							position.includes('left') ? 'flex-row' : 'flex-row-reverse',
							position.includes('top') ? 'flex-col' : 'flex-col-reverse'
						)}
						variants={getAnimationVariants(position)}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{
							duration: animationDuration / 1000,
							staggerChildren: 0.05,
						}}
					>
						{buttons.map((button, index) => (
							<motion.div
								key={button.id}
								variants={{
									initial: { opacity: 0, scale: 0.5 },
									animate: { opacity: 1, scale: 1 },
									exit: { opacity: 0, scale: 0.5 },
								}}
								transition={{
									delay: index * 0.05,
									duration: animationDuration / 1000,
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
