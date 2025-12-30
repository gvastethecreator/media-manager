// Sistema de animaciones para canvas que maneja hover states, tooltips y transiciones fluidas

export interface AnimationState {
	startTime: number;
	duration: number;
	easeFunction: (t: number) => number;
	fromValue: number;
	toValue: number;
	currentValue: number;
	isActive: boolean;
}

export interface HoverAnimationState {
	// Animación de escala para hover
	scale: AnimationState;
	// Animación de alpha para borde de hover
	borderAlpha: AnimationState;
	// Animación de offset Y (elevación)
	offsetY: AnimationState;
	// Animación de sombra (blur radius)
	shadowBlur: AnimationState;
}

export interface TooltipAnimationState {
	// Animación de alpha para fade in/out
	alpha: AnimationState;
	// Animación de escala para bounce effect
	scale: AnimationState;
	// Animación de posición Y para slide
	offsetY: AnimationState;
}

// Funciones de easing
export const EasingFunctions = {
	linear: (t: number) => t,
	easeOut: (t: number) => 1 - (1 - t) ** 3,
	easeIn: (t: number) => t * t * t,
	easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	bounceOut: (t: number) => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) return n1 * t * t;
		if (t < 2 / d1) {
			const t2 = t - 1.5 / d1;
			return n1 * t2 * t2 + 0.75;
		}
		if (t < 2.5 / d1) {
			const t2 = t - 2.25 / d1;
			return n1 * t2 * t2 + 0.9375;
		}
		const t2 = t - 2.625 / d1;
		return n1 * t2 * t2 + 0.984_375;
	},
	elastic: (t: number) => {
		if (t === 0) return 0;
		if (t === 1) return 1;
		return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
	},
};

// Configuración de animaciones
export const AnimationConfig = {
	hover: {
		duration: 200, // ms
		scale: { from: 1.0, to: 1.05 },
		borderAlpha: { from: 0.0, to: 0.3 },
		offsetY: { from: 0, to: -2 },
		shadowBlur: { from: 0, to: 8 },
		easing: EasingFunctions.easeOut,
	},
	tooltip: {
		duration: 150, // ms
		fadeDelay: 300, // ms antes de mostrar
		alpha: { from: 0.0, to: 0.9 },
		scale: { from: 0.8, to: 1.0 },
		offsetY: { from: 10, to: 0 },
		easing: EasingFunctions.easeOut,
	},
	selection: {
		duration: 100, // ms
		scale: { from: 1.0, to: 1.02 },
		borderAlpha: { from: 0.0, to: 0.6 },
		easing: EasingFunctions.easeInOut,
	},
};

// Crear una nueva animación
export function createAnimation(
	fromValue: number,
	toValue: number,
	duration: number,
	easeFunction: (t: number) => number = EasingFunctions.linear
): AnimationState {
	return {
		startTime: performance.now(),
		duration,
		easeFunction,
		fromValue,
		toValue,
		currentValue: fromValue,
		isActive: true,
	};
}

// Actualizar el estado de una animación
export function updateAnimation(animation: AnimationState, currentTime: number): boolean {
	if (!animation.isActive) return false;

	const elapsed = currentTime - animation.startTime;
	const progress = Math.min(elapsed / animation.duration, 1);
	const easedProgress = animation.easeFunction(progress);

	animation.currentValue = animation.fromValue + (animation.toValue - animation.fromValue) * easedProgress;

	if (progress >= 1) {
		animation.isActive = false;
		animation.currentValue = animation.toValue;
		return false; // animación completada
	}

	return true; // animación en progreso
}

// Crear estado de animación de hover completo
export function createHoverAnimation(isEntering: boolean): HoverAnimationState {
	const config = AnimationConfig.hover;
	const scale = isEntering ? config.scale : { from: config.scale.to, to: config.scale.from };
	const borderAlpha = isEntering ? config.borderAlpha : { from: config.borderAlpha.to, to: config.borderAlpha.from };
	const offsetY = isEntering ? config.offsetY : { from: config.offsetY.to, to: config.offsetY.from };
	const shadowBlur = isEntering ? config.shadowBlur : { from: config.shadowBlur.to, to: config.shadowBlur.from };

	return {
		scale: createAnimation(scale.from, scale.to, config.duration, config.easing),
		borderAlpha: createAnimation(borderAlpha.from, borderAlpha.to, config.duration, config.easing),
		offsetY: createAnimation(offsetY.from, offsetY.to, config.duration, config.easing),
		shadowBlur: createAnimation(shadowBlur.from, shadowBlur.to, config.duration, config.easing),
	};
}

// Crear estado de animación de tooltip
export function createTooltipAnimation(isEntering: boolean, delay = 0): TooltipAnimationState {
	const config = AnimationConfig.tooltip;
	const alpha = isEntering ? config.alpha : { from: config.alpha.to, to: config.alpha.from };
	const scale = isEntering ? config.scale : { from: config.scale.to, to: config.scale.from };
	const offsetY = isEntering ? config.offsetY : { from: config.offsetY.to, to: config.offsetY.from };

	// Aplicar delay solo para fade in
	const startTime = performance.now() + (isEntering ? delay : 0);

	return {
		alpha: {
			...createAnimation(alpha.from, alpha.to, config.duration, config.easing),
			startTime,
		},
		scale: {
			...createAnimation(scale.from, scale.to, config.duration, EasingFunctions.bounceOut),
			startTime,
		},
		offsetY: {
			...createAnimation(offsetY.from, offsetY.to, config.duration, config.easing),
			startTime,
		},
	};
}

// Actualizar todas las animaciones de hover
export function updateHoverAnimation(hoverState: HoverAnimationState, currentTime: number): boolean {
	const scaleActive = updateAnimation(hoverState.scale, currentTime);
	const borderActive = updateAnimation(hoverState.borderAlpha, currentTime);
	const offsetActive = updateAnimation(hoverState.offsetY, currentTime);
	const shadowActive = updateAnimation(hoverState.shadowBlur, currentTime);

	return scaleActive || borderActive || offsetActive || shadowActive;
}

// Actualizar todas las animaciones de tooltip
export function updateTooltipAnimation(tooltipState: TooltipAnimationState, currentTime: number): boolean {
	const alphaActive = updateAnimation(tooltipState.alpha, currentTime);
	const scaleActive = updateAnimation(tooltipState.scale, currentTime);
	const offsetActive = updateAnimation(tooltipState.offsetY, currentTime);

	return alphaActive || scaleActive || offsetActive;
}

// Manager central de animaciones para canvas
export class CanvasAnimationManager {
	private hoverAnimations = new Map<number, HoverAnimationState>();
	private tooltipAnimation: TooltipAnimationState | null = null;
	private tooltipTimeout: number | null = null;
	private needsRedraw = false;
	private animationFrameId: number | null = null;
	private lastFrameTime = 0;

	// Iniciar animación de hover para un índice específico
	startHoverAnimation(itemIndex: number): void {
		// Cancelar animación anterior si existe
		if (this.hoverAnimations.has(itemIndex)) {
			this.hoverAnimations.delete(itemIndex);
		}

		const hoverState = createHoverAnimation(true);
		this.hoverAnimations.set(itemIndex, hoverState);
		this.needsRedraw = true;
		this.startAnimationLoop();
	}

	// Terminar animación de hover
	endHoverAnimation(itemIndex: number): void {
		if (!this.hoverAnimations.has(itemIndex)) return;

		const hoverState = createHoverAnimation(false);
		this.hoverAnimations.set(itemIndex, hoverState);
		this.needsRedraw = true;
		this.startAnimationLoop();
	}

	// Iniciar animación de tooltip
	startTooltipAnimation(delay: number = AnimationConfig.tooltip.fadeDelay): void {
		// Cancelar timeout previo
		if (this.tooltipTimeout) {
			clearTimeout(this.tooltipTimeout);
		}

		// Cancelar animación previa
		if (this.tooltipAnimation) {
			this.tooltipAnimation = null;
		}

		this.tooltipTimeout = setTimeout(() => {
			this.tooltipAnimation = createTooltipAnimation(true, 0);
			this.needsRedraw = true;
			this.startAnimationLoop();
		}, delay) as any;
	}

	// Terminar animación de tooltip inmediatamente
	endTooltipAnimation(): void {
		if (this.tooltipTimeout) {
			clearTimeout(this.tooltipTimeout);
			this.tooltipTimeout = null;
		}

		if (this.tooltipAnimation) {
			this.tooltipAnimation = createTooltipAnimation(false);
			this.needsRedraw = true;
			this.startAnimationLoop();
		}
	}

	// Start animation loop only when needed
	private startAnimationLoop(): void {
		if (this.animationFrameId !== null) return; // Already running

		const animate = (currentTime: number) => {
			// Throttle to 60fps max
			if (currentTime - this.lastFrameTime < 16.67) {
				this.animationFrameId = requestAnimationFrame(animate);
				return;
			}

			const hasActiveAnimations = this.update(currentTime);
			this.lastFrameTime = currentTime;

			if (hasActiveAnimations) {
				this.animationFrameId = requestAnimationFrame(animate);
			} else {
				this.animationFrameId = null; // Stop loop when no active animations
			}
		};

		this.animationFrameId = requestAnimationFrame(animate);
	}

	// Actualizar todas las animaciones y retornar si necesita redraw
	update(currentTime: number): boolean {
		let hasActiveAnimations = false;

		// Actualizar animaciones de hover
		for (const [itemIndex, hoverState] of this.hoverAnimations) {
			const isActive = updateHoverAnimation(hoverState, currentTime);

			if (isActive) {
				hasActiveAnimations = true;
			} else if (hoverState.scale.toValue === AnimationConfig.hover.scale.from) {
				// Animación completada, remover si era de salida
				this.hoverAnimations.delete(itemIndex);
			}
		}

		// Actualizar animación de tooltip
		if (this.tooltipAnimation) {
			const isActive = updateTooltipAnimation(this.tooltipAnimation, currentTime);

			if (!isActive && this.tooltipAnimation.alpha.toValue === AnimationConfig.tooltip.alpha.from) {
				// Tooltip fade out completado
				this.tooltipAnimation = null;
			} else if (isActive) {
				hasActiveAnimations = true;
			}
		}

		const needsRedraw = this.needsRedraw || hasActiveAnimations;
		this.needsRedraw = false;

		return needsRedraw;
	}

	// Obtener estado de animación de hover para un índice
	getHoverAnimation(itemIndex: number): HoverAnimationState | null {
		return this.hoverAnimations.get(itemIndex) || null;
	}

	// Obtener estado de animación de tooltip
	getTooltipAnimation(): TooltipAnimationState | null {
		return this.tooltipAnimation;
	}

	// Limpiar todas las animaciones
	clear(): void {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		this.hoverAnimations.clear();
		this.tooltipAnimation = null;
		if (this.tooltipTimeout) {
			clearTimeout(this.tooltipTimeout);
			this.tooltipTimeout = null;
		}
		this.needsRedraw = false;
	}
}
