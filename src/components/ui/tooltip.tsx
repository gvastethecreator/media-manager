'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type * as React from 'react';
import { memo, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';

// Optimizado para evitar re-renderizaciones con referencia estable
const TooltipProvider = memo(function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
	return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
});
TooltipProvider.displayName = 'TooltipProvider';

// Provider global para toda la aplicación - evita múltiples providers
const GlobalTooltipProvider = memo(function GlobalTooltipProvider({ children }: { children: React.ReactNode }) {
	return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
});
GlobalTooltipProvider.displayName = 'GlobalTooltipProvider';

// Tooltip optimizado
const Tooltip = memo(function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
});
Tooltip.displayName = 'Tooltip';

// Trigger optimizado con callbacks estables
const TooltipTrigger = memo(function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
	// Extraemos los event handlers para crear callbacks estables
	const {
		onPointerMove,
		onPointerLeave,
		onPointerDown,
		onFocus,
		onBlur,
		onClick,
		...restProps
	} = props;

	// Creamos callbacks estables para cada evento, solo si están definidos
	const stableOnPointerMove = useCallback(
		onPointerMove ? (e: React.PointerEvent) => onPointerMove(e) : undefined,
		[onPointerMove]
	);

	const stableOnPointerLeave = useCallback(
		onPointerLeave ? (e: React.PointerEvent) => onPointerLeave(e) : undefined,
		[onPointerLeave]
	);

	const stableOnPointerDown = useCallback(
		onPointerDown ? (e: React.PointerEvent) => onPointerDown(e) : undefined,
		[onPointerDown]
	);

	const stableOnFocus = useCallback(
		onFocus ? (e: React.FocusEvent) => onFocus(e) : undefined,
		[onFocus]
	);

	const stableOnBlur = useCallback(
		onBlur ? (e: React.FocusEvent) => onBlur(e) : undefined,
		[onBlur]
	);

	const stableOnClick = useCallback(
		onClick ? (e: React.MouseEvent) => onClick(e) : undefined,
		[onClick]
	);

	return (
		<TooltipPrimitive.Trigger
			data-slot="tooltip-trigger"
			{...restProps}
			onPointerMove={stableOnPointerMove}
			onPointerLeave={stableOnPointerLeave}
			onPointerDown={stableOnPointerDown}
			onFocus={stableOnFocus}
			onBlur={stableOnBlur}
			onClick={stableOnClick}
		/>
	);
}, (prevProps, nextProps) => {
	// Implementar una comparación personalizada para evitar re-renders innecesarios
	// Solo re-renderizar si las props importantes han cambiado

	// Si asChild o className cambian, debemos re-renderizar
	if (prevProps.asChild !== nextProps.asChild || prevProps.className !== nextProps.className) {
		return false;
	}

	// Si los hijos cambian, debemos re-renderizar
	if (prevProps.children !== nextProps.children) {
		return false;
	}

	// Si los refs cambian, debemos re-renderizar
	if (prevProps.ref !== nextProps.ref) {
		return false;
	}

	// Si llegamos aquí, consideramos que las props son iguales y no necesitamos re-renderizar
	return true;
});
TooltipTrigger.displayName = 'TooltipTrigger';

// Contenido optimizado
const TooltipContent = memo(function TooltipContent({
	className,
	sideOffset = 0,
	children,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
	// Memoizamos las clases para evitar recálculos constantes
	const combinedClassName = useMemo(() =>
		cn(
			'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance',
			className
		),
		[className]);

	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				data-slot="tooltip-content"
				sideOffset={sideOffset}
				className={combinedClassName}
				{...props}
			>
				{children}
				<TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
});
TooltipContent.displayName = 'TooltipContent';

export { GlobalTooltipProvider, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

