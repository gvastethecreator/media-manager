'use client';

import { useRef, type CSSProperties, type ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { JSX } from 'react';

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

// Types for motion compatibility
type EasingType = 'easeIn' | 'easeOut' | 'easeInOut' | 'linear' | string;
type AnimationVariantType = 'spring' | 'tween' | 'inertia' | 'decay' | 'keyframes';

interface TransitionConfig {
	duration?: number;
	ease?: string | EasingType;
	delay?: number;
	type?: AnimationVariantType;
	stiffness?: number;
	damping?: number;
	mass?: number;
	staggerChildren?: number;
}

// Variants support
interface AnimationVariants {
	[key: string]: AnimationState;
}

// Context for AnimatePresence
interface AnimatePresenceContextType {
	mode?: 'wait' | 'sync';
	onExitComplete?: () => void;
}

const AnimatePresenceContext = createContext<AnimatePresenceContextType>({});

interface AnimationState {
	opacity?: number;
	x?: number;
	y?: number;
	scale?: number;
	rotation?: number;
	rotateX?: number;
	rotateY?: number;
	rotateZ?: number;
	filter?: string;
	transition?: TransitionConfig;
	// Support for variants
	[key: string]: any;
}

interface MotionProps {
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onMouseMove?: (event: React.MouseEvent) => void;
	onBlur?: () => void;
	onFocus?: () => void;
	// Animation props
	initial?: AnimationState | false | string;
	animate?: AnimationState | string;
	exit?: AnimationState | string;
	whileHover?: AnimationState;
	whileTap?: AnimationState;
	transition?: TransitionConfig;
	layout?: boolean;
	layoutId?: string;
	// Variants support
	variants?: AnimationVariants;
	// Drag props for compatibility
	drag?: boolean | 'x' | 'y';
	dragConstraints?: object;
	onDrag?: (event: any, info: any) => void;
	onDragStart?: (event: any, info: any) => void;
	onDragEnd?: (event: any, info: any) => void;
	onWheel?: (event: any) => void;
}

// Helper function to resolve variant or direct animation state
function resolveAnimation(
	variants: AnimationVariants | undefined,
	animation: AnimationState | string | false | undefined,
	fallback: AnimationState = {}
): AnimationState | null {
	if (animation === false) return null;
	if (typeof animation === 'string' && variants) {
		return variants[animation] || fallback;
	}
	if (typeof animation === 'object') {
		return animation;
	}
	return fallback;
}

// Enhanced motion component factory with variants support
function createMotionComponent(tag: keyof JSX.IntrinsicElements) {
	return function MotionComponent(props: MotionProps & React.HTMLAttributes<HTMLElement>) {
		const {
			children,
			initial = { opacity: 0 },
			animate = { opacity: 1 },
			exit,
			whileHover,
			whileTap,
			transition = { duration: 0.3 },
			variants,
			className,
			style,
			onClick,
			onMouseEnter,
			onMouseLeave,
			onMouseMove,
			onBlur,
			onFocus,
			layout,
			layoutId,
			drag,
			dragConstraints,
			onDrag,
			onDragStart,
			onDragEnd,
			onWheel,
			...restProps
		} = props;

		const elementRef = useRef<HTMLElement>(null);
		const presenceContext = useContext(AnimatePresenceContext);

		// Resolve animations using variants
		const resolvedInitial = resolveAnimation(variants, initial);
		const resolvedAnimate = resolveAnimation(variants, animate, { opacity: 1 });
		const resolvedExit = resolveAnimation(variants, exit);

		useGSAP(
			() => {
				if (!elementRef.current) return;

				// Set initial state
				if (resolvedInitial) {
					gsap.set(elementRef.current, {
						opacity: resolvedInitial.opacity ?? 1,
						x: resolvedInitial.x ?? 0,
						y: resolvedInitial.y ?? 0,
						scale: resolvedInitial.scale ?? 1,
						rotation: resolvedInitial.rotation ?? 0,
						rotateX: resolvedInitial.rotateX ?? 0,
						rotateY: resolvedInitial.rotateY ?? 0,
						rotateZ: resolvedInitial.rotateZ ?? 0,
						filter: resolvedInitial.filter ?? 'none',
					});
				}

				// Animate to target state
				if (resolvedAnimate) {
					const animateDelay = transition.delay ?? 0;
					gsap.to(elementRef.current, {
						opacity: resolvedAnimate.opacity ?? 1,
						x: resolvedAnimate.x ?? 0,
						y: resolvedAnimate.y ?? 0,
						scale: resolvedAnimate.scale ?? 1,
						rotation: resolvedAnimate.rotation ?? 0,
						rotateX: resolvedAnimate.rotateX ?? 0,
						rotateY: resolvedAnimate.rotateY ?? 0,
						rotateZ: resolvedAnimate.rotateZ ?? 0,
						filter: resolvedAnimate.filter ?? 'none',
						duration: transition.duration ?? 0.3,
						ease: transition.ease ?? 'power2.out',
						delay: animateDelay,
					});
				}
			},
			{ scope: elementRef, dependencies: [resolvedInitial, resolvedAnimate, transition, variants] }
		);

		// Handle exit animation
		useEffect(() => {
			if (resolvedExit && elementRef.current && presenceContext.mode === 'wait') {
				const exitAnimation = gsap.to(elementRef.current, {
					opacity: resolvedExit.opacity ?? 0,
					x: resolvedExit.x ?? 0,
					y: resolvedExit.y ?? 0,
					scale: resolvedExit.scale ?? 1,
					rotation: resolvedExit.rotation ?? 0,
					filter: resolvedExit.filter ?? 'none',
					duration: transition.duration ?? 0.2,
					ease: transition.ease ?? 'power2.in',
					onComplete: presenceContext.onExitComplete,
				});
				return () => {
					exitAnimation.kill();
				};
			}
		}, [resolvedExit, presenceContext, transition]);

		// Handle hover animations
		const handleMouseEnter = () => {
			if (whileHover && elementRef.current) {
				gsap.to(elementRef.current, {
					scale: whileHover.scale ?? undefined,
					opacity: whileHover.opacity ?? undefined,
					x: whileHover.x ?? undefined,
					y: whileHover.y ?? undefined,
					rotation: whileHover.rotation ?? undefined,
					duration: 0.2,
					ease: 'power2.out',
				});
			}
			onMouseEnter?.();
		};

		const handleMouseLeave = () => {
			if (whileHover && elementRef.current && resolvedAnimate) {
				gsap.to(elementRef.current, {
					scale: resolvedAnimate.scale ?? 1,
					opacity: resolvedAnimate.opacity ?? 1,
					x: resolvedAnimate.x ?? 0,
					y: resolvedAnimate.y ?? 0,
					rotation: resolvedAnimate.rotation ?? 0,
					duration: 0.2,
					ease: 'power2.out',
				});
			}
			onMouseLeave?.();
		};

		// Handle tap animation
		const handleClick = () => {
			if (whileTap && elementRef.current) {
				gsap.to(elementRef.current, {
					scale: whileTap.scale ?? 0.95,
					duration: 0.1,
					ease: 'power2.out',
					yoyo: true,
					repeat: 1,
				});
			}
			onClick?.();
		};

		const Component = tag as any;

		return (
			<Component
				ref={elementRef}
				className={className}
				style={style}
				onClick={handleClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseMove={onMouseMove}
				onBlur={onBlur}
				onFocus={onFocus}
				onWheel={onWheel}
				{...restProps}
			>
				{children}
			</Component>
		);
	};
}

// Motion components
export const motion = {
	div: createMotionComponent('div'),
	button: createMotionComponent('button'),
	span: createMotionComponent('span'),
	img: createMotionComponent('img'),
	section: createMotionComponent('section'),
	article: createMotionComponent('article'),
	header: createMotionComponent('header'),
	footer: createMotionComponent('footer'),
	nav: createMotionComponent('nav'),
	main: createMotionComponent('main'),
	aside: createMotionComponent('aside'),
	h1: createMotionComponent('h1'),
	h2: createMotionComponent('h2'),
	h3: createMotionComponent('h3'),
	h4: createMotionComponent('h4'),
	h5: createMotionComponent('h5'),
	h6: createMotionComponent('h6'),
	p: createMotionComponent('p'),
	ul: createMotionComponent('ul'),
	ol: createMotionComponent('ol'),
	li: createMotionComponent('li'),
	form: createMotionComponent('form'),
	input: createMotionComponent('input'),
	textarea: createMotionComponent('textarea'),
	select: createMotionComponent('select'),
	label: createMotionComponent('label'),
	video: createMotionComponent('video'),
	canvas: createMotionComponent('canvas'),
	svg: createMotionComponent('svg'),
	path: createMotionComponent('path'),
};

// Enhanced AnimatePresence component
interface AnimatePresenceProps {
	children: ReactNode;
	mode?: 'wait' | 'sync';
	onExitComplete?: () => void;
}

export function AnimatePresence({ children, mode = 'sync', onExitComplete }: AnimatePresenceProps) {
	const contextValue = { mode, onExitComplete };

	return <AnimatePresenceContext.Provider value={contextValue}>{children}</AnimatePresenceContext.Provider>;
}

// Enhanced hook replacements
export function useMotionValue(initialValue: number) {
	const [value, setValue] = useState(initialValue);
	return {
		get: () => value,
		set: setValue,
		current: value,
	};
}

export function useSpring(source: any) {
	const [value, setValue] = useState(source?.current || source || 0);

	useEffect(() => {
		if (source?.current !== undefined) {
			setValue(source.current);
		} else if (typeof source === 'number') {
			setValue(source);
		}
	}, [source]);

	return value;
}

export function useTransform(source: any, inputRange: number[], outputRange: number[]) {
	const [value, setValue] = useState(outputRange[0] || 0);

	useEffect(() => {
		const currentValue = source?.current || source || 0;
		if (inputRange.length === 2 && outputRange.length === 2) {
			const progress = (currentValue - inputRange[0]) / (inputRange[1] - inputRange[0]);
			const clampedProgress = Math.max(0, Math.min(1, progress));
			const result = outputRange[0] + (outputRange[1] - outputRange[0]) * clampedProgress;
			setValue(result);
		}
	}, [source, inputRange, outputRange]);

	return value;
}

// Easing constants
export const Easing = {
	easeIn: 'power2.in',
	easeOut: 'power2.out',
	easeInOut: 'power2.inOut',
	linear: 'none',
} as const;

// Export types
export type { AnimationVariantType, AnimationVariants, AnimationState, MotionProps };
