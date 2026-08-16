'use client';

import gsap from 'gsap';
import type { JSX } from 'react';
import { type CSSProperties, createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

// Types for motion compatibility
type EasingType = 'easeIn' | 'easeOut' | 'easeInOut' | 'linear' | string;
type AnimationVariantType = 'spring' | 'tween' | 'inertia' | 'decay' | 'keyframes';

interface TransitionConfig {
	damping?: number;
	delay?: number;
	duration?: number;
	ease?: string | EasingType;
	mass?: number;
	staggerChildren?: number;
	stiffness?: number;
	type?: AnimationVariantType;
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
	filter?: string;
	opacity?: number;
	rotateX?: number;
	rotateY?: number;
	rotateZ?: number;
	rotation?: number;
	scale?: number;
	transition?: TransitionConfig;
	x?: number;
	y?: number;
	// Support for variants
	[key: string]: any;
}

interface MotionProps {
	animate?: AnimationState | string;
	children?: ReactNode;
	className?: string;
	// Drag props for compatibility
	drag?: boolean | 'x' | 'y';
	dragConstraints?: object;
	exit?: AnimationState | string;
	// Animation props
	initial?: AnimationState | false | string;
	layout?: boolean;
	layoutId?: string;
	onBlur?: () => void;
	onClick?: () => void;
	onDrag?: (event: any, info: any) => void;
	onDragEnd?: (event: any, info: any) => void;
	onDragStart?: (event: any, info: any) => void;
	onFocus?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onMouseMove?: (event: React.MouseEvent) => void;
	onWheel?: (event: any) => void;
	style?: CSSProperties;
	transition?: TransitionConfig;
	// Variants support
	variants?: AnimationVariants;
	whileHover?: AnimationState;
	whileTap?: AnimationState;
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

// Map common Framer/legacy easing names to GSAP
function mapEasing(ease?: string): string {
	if (!ease) return 'power2.out';
	const map: Record<string, string> = {
		easeIn: 'power1.in',
		easeOut: 'power1.out',
		easeInOut: 'power1.inOut',
		easeInQuad: 'power1.in',
		easeOutQuad: 'power1.out',
		easeInOutQuad: 'power1.inOut',
		easeInCubic: 'power2.in',
		easeOutCubic: 'power2.out',
		easeInOutCubic: 'power2.inOut',
		easeInBack: 'back.in(1.7)',
		easeOutBack: 'back.out(1.7)',
		easeInOutBack: 'back.inOut(1.7)',
		linear: 'none',
	};
	return map[ease] || ease;
}

// Helper to remove undefined keys
function cleanProps(props: Record<string, any>) {
	const clean: Record<string, any> = {};
	for (const key of Object.keys(props)) {
		if (props[key] !== undefined) {
			clean[key] = props[key];
		}
	}
	return clean;
}

// Normalize motion props to GSAP-friendly properties
function mapProperties(props: AnimationState) {
	const { x, y, rotation, rotateX, rotateY, rotateZ, transition, ...rest } = props;
	return cleanProps({
		...rest,
		x,
		y,
		rotation,
		rotateX,
		rotateY,
		rotateZ,
	});
}

// Enhanced motion component factory with variants support
function createMotionComponent(tag: keyof JSX.IntrinsicElements) {
	return function MotionComponent(props: MotionProps & React.HTMLAttributes<HTMLElement>) {
		const {
			children,
			initial = { opacity: 0 },
			animate: animateProp = { opacity: 1 },
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
		const activeAnimationRef = useRef<gsap.core.Tween | null>(null);

		// Resolve animations using variants
		const resolvedInitial = resolveAnimation(variants, initial);
		const resolvedAnimate = resolveAnimation(variants, animateProp, { opacity: 1 });
		const resolvedExit = resolveAnimation(variants, exit);

		useEffect(() => {
			if (!elementRef.current) return;

			// Set initial state
			if (resolvedInitial) {
				const initialProps = mapProperties(resolvedInitial);
				if (Object.keys(initialProps).length > 0) {
					gsap.set(elementRef.current, initialProps);
				}
			}
		}, [resolvedInitial]); // Run once on mount

		// Animate to target state
		useEffect(() => {
			if (!(elementRef.current && resolvedAnimate)) return;

			const targetProps = mapProperties(resolvedAnimate);
			if (Object.keys(targetProps).length === 0) return;

			const animProps = {
				...targetProps,
				duration: transition.duration || 0.3,
				ease: mapEasing(transition.ease as string),
				delay: transition.delay || 0,
			};

			activeAnimationRef.current = gsap.to(elementRef.current, animProps);

			return () => {
				activeAnimationRef.current?.kill();
			};
		}, [resolvedAnimate, transition]);

		// Handle exit animation
		useEffect(() => {
			if (resolvedExit && elementRef.current && presenceContext.mode === 'wait') {
				const targetProps = mapProperties(resolvedExit);
				if (Object.keys(targetProps).length === 0) return;

				const animProps = {
					...targetProps,
					duration: transition.duration || 0.2,
					ease: mapEasing(transition.ease as string),
					onComplete: () => {
						presenceContext.onExitComplete?.();
					},
				};

				const exitAnim = gsap.to(elementRef.current, animProps);
				return () => {
					exitAnim.kill();
				};
			}
		}, [resolvedExit, presenceContext, transition]);

		// Handle hover animations
		const isHoverAnimatingRef = useRef(false);

		const handleMouseEnter = () => {
			if (whileHover && elementRef.current) {
				isHoverAnimatingRef.current = true;
				activeAnimationRef.current?.kill();

				const hoverProps = mapProperties(whileHover);
				if (Object.keys(hoverProps).length > 0) {
					gsap.to(elementRef.current, {
						...hoverProps,
						duration: 0.15,
						ease: 'power1.out',
						onComplete: () => {
							isHoverAnimatingRef.current = false;
						},
					});
				}
			}
			onMouseEnter?.();
		};

		const handleMouseLeave = () => {
			if (whileHover && elementRef.current && resolvedAnimate) {
				isHoverAnimatingRef.current = true;
				// Return to animate state
				const targetProps = mapProperties(resolvedAnimate);
				if (Object.keys(targetProps).length > 0) {
					gsap.to(elementRef.current, {
						...targetProps,
						duration: 0.15,
						ease: 'power1.out',
						onComplete: () => {
							isHoverAnimatingRef.current = false;
						},
					});
				}
			}
			onMouseLeave?.();
		};

		const handleClick = () => {
			if (whileTap && elementRef.current) {
				const tapProps = mapProperties(whileTap);
				if (Object.keys(tapProps).length > 0) {
					gsap.to(elementRef.current, {
						...tapProps,
						duration: 0.08,
						ease: 'power1.out',
						yoyo: true,
						repeat: 1,
					});
				}
			}
			onClick?.();
		};

		const Component = tag as any;

		return (
			<Component
				className={className}
				onBlur={onBlur}
				onClick={handleClick}
				onFocus={onFocus}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseMove={onMouseMove}
				onWheel={onWheel}
				ref={elementRef}
				style={style}
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
	easeIn: 'power1.in',
	easeOut: 'power1.out',
	easeInOut: 'power1.inOut',
	linear: 'none',
} as const;

// Export types
export type { AnimationVariantType, AnimationVariants, AnimationState, MotionProps };
