'use client';

import {
	ArrowUpDown,
	Clock,
	CornerRightDown,
	Hourglass,
	Layers,
	MousePointer,
	Play,
	Sparkles,
	Zap,
	ZapOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../../types/card-settings-types';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
	panelColors
} from './shared';

// Tipo para las opciones de animación
interface AnimationOptions {
	enabled: boolean;
	duration: number;
	easing: string;
	delay: number;

	// Opciones de hover
	hoverEffect: string;
	hoverScale: number;
	hoverRotation: number;

	// Opciones de clic
	clickEffect: string;
	clickScale: number;
	clickTransform: string;

	// Opciones de intro
	introAnimation: boolean;
	introDuration: number;
	introEffect: string;

	// Opciones de parallax
	parallaxEffect: boolean;
	parallaxIntensity: number;
}

// Sección de Configuración General
const GeneralSection = ({
	animation,
	onAnimationChange,
	disabled
}: {
	animation: AnimationOptions;
	onAnimationChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	// Opciones para los select
	const easingOptions = [
		{ value: 'ease', label: 'Suave (ease)' },
		{ value: 'ease-in', label: 'Aceleración (ease-in)' },
		{ value: 'ease-out', label: 'Desaceleración (ease-out)' },
		{ value: 'ease-in-out', label: 'Suave Completa (ease-in-out)' },
		{ value: 'linear', label: 'Lineal (velocidad constante)' },
		{ value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Rebote Suave' },
		{ value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', label: 'Rebote Intenso' }
	];

	return (
		<FormSection
			title="Configuración General"
			description="Ajustes generales de animación para la tarjeta"
			colorScheme="design"
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-animations"
						label="Habilitar Animaciones"
						description="Activa o desactiva todas las animaciones"
						checked={animation.enabled}
						onCheckedChange={(checked) => onAnimationChange('enabled', checked)}
						disabled={disabled}
						icon={<Play className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
				</FormRow>

				<FormRow>
					<FormSlider
						id="animation-duration"
						label="Duración"
						description="Duración general de las animaciones"
						value={animation.duration}
						onValueChange={(value) => onAnimationChange('duration', value)}
						min={0.1}
						max={2}
						step={0.05}
						unit="s"
						disabled={disabled || !animation.enabled}
					/>
					<FormSlider
						id="animation-delay"
						label="Retardo"
						description="Tiempo de espera antes de iniciar animaciones"
						value={animation.delay}
						onValueChange={(value) => onAnimationChange('delay', value)}
						min={0}
						max={1}
						step={0.05}
						unit="s"
						disabled={disabled || !animation.enabled}
					/>
				</FormRow>

				<FormRow>
					<FormSelect
						id="animation-easing"
						label="Tipo de Transición"
						description="Define cómo se aceleran o desaceleran las animaciones"
						value={animation.easing}
						onValueChange={(value) => onAnimationChange('easing', value)}
						options={easingOptions}
						disabled={disabled || !animation.enabled}
						icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Sección de Efecto Hover
const HoverEffectSection = ({
	animation,
	onAnimationChange,
	disabled
}: {
	animation: AnimationOptions;
	onAnimationChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	// Opciones para los efectos de hover
	const hoverEffectOptions = [
		{ value: 'none', label: 'Ninguno' },
		{ value: 'scale', label: 'Escala' },
		{ value: 'rotate', label: 'Rotación' },
		{ value: 'glow', label: 'Resplandor' },
		{ value: 'lift', label: 'Elevación 3D' },
		{ value: 'custom', label: 'Personalizado' }
	];

	return (
		<FormSection
			title="Efectos al Pasar el Cursor"
			description="Animaciones cuando el usuario pasa el cursor sobre la tarjeta"
			colorScheme="design"
			icon={<MousePointer className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="hover-effect"
						label="Tipo de Efecto"
						description="Define el tipo de animación al pasar el cursor"
						value={animation.hoverEffect}
						onValueChange={(value) => onAnimationChange('hoverEffect', value)}
						options={hoverEffectOptions}
						disabled={disabled || !animation.enabled}
					/>
				</FormRow>

				{animation.hoverEffect === 'scale' && (
					<FormRow>
						<FormSlider
							id="hover-scale"
							label="Escala"
							description="Factor de aumento de tamaño al pasar el cursor"
							value={animation.hoverScale}
							onValueChange={(value) => onAnimationChange('hoverScale', value)}
							min={1}
							max={1.5}
							step={0.01}
							disabled={disabled || !animation.enabled}
						/>
					</FormRow>
				)}

				{animation.hoverEffect === 'rotate' && (
					<FormRow>
						<FormSlider
							id="hover-rotation"
							label="Rotación"
							description="Ángulo de rotación al pasar el cursor"
							value={animation.hoverRotation}
							onValueChange={(value) => onAnimationChange('hoverRotation', value)}
							min={-15}
							max={15}
							step={0.5}
							unit="°"
							disabled={disabled || !animation.enabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

// Sección de Efecto Click
const ClickEffectSection = ({
	animation,
	onAnimationChange,
	disabled
}: {
	animation: AnimationOptions;
	onAnimationChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	// Opciones para los efectos de click
	const clickEffectOptions = [
		{ value: 'none', label: 'Ninguno' },
		{ value: 'pulse', label: 'Pulso' },
		{ value: 'bounce', label: 'Rebote' },
		{ value: 'flip', label: 'Volteo' },
		{ value: 'shake', label: 'Sacudida' },
		{ value: 'custom', label: 'Personalizado' }
	];

	const clickTransformOptions = [
		{ value: 'none', label: 'Ninguna' },
		{ value: 'scale-down', label: 'Reducir Escala' },
		{ value: 'scale-up', label: 'Aumentar Escala' },
		{ value: 'rotate-left', label: 'Rotar Izquierda' },
		{ value: 'rotate-right', label: 'Rotar Derecha' }
	];

	return (
		<FormSection
			title="Efectos al Hacer Click"
			description="Animaciones cuando el usuario hace click en la tarjeta"
			colorScheme="design"
			icon={<CornerRightDown className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="click-effect"
						label="Tipo de Efecto"
						description="Define el tipo de animación al hacer click"
						value={animation.clickEffect}
						onValueChange={(value) => onAnimationChange('clickEffect', value)}
						options={clickEffectOptions}
						disabled={disabled || !animation.enabled}
					/>
				</FormRow>

				{animation.clickEffect !== 'none' && (
					<FormRow>
						<FormSelect
							id="click-transform"
							label="Transformación"
							description="Tipo de transformación aplicada al hacer click"
							value={animation.clickTransform}
							onValueChange={(value) => onAnimationChange('clickTransform', value)}
							options={clickTransformOptions}
							disabled={disabled || !animation.enabled}
						/>
						<FormSlider
							id="click-scale"
							label="Intensidad"
							description="Intensidad del efecto al hacer click"
							value={animation.clickScale}
							onValueChange={(value) => onAnimationChange('clickScale', value)}
							min={0.5}
							max={1.5}
							step={0.05}
							disabled={disabled || !animation.enabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

// Sección de Animación de Introducción
const IntroAnimationSection = ({
	animation,
	onAnimationChange,
	disabled
}: {
	animation: AnimationOptions;
	onAnimationChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	// Opciones para los efectos de intro
	const introEffectOptions = [
		{ value: 'none', label: 'Ninguno' },
		{ value: 'fade-in', label: 'Aparecer' },
		{ value: 'slide-up', label: 'Deslizar Arriba' },
		{ value: 'slide-down', label: 'Deslizar Abajo' },
		{ value: 'zoom-in', label: 'Zoom In' },
		{ value: 'rotate-in', label: 'Rotación' }
	];

	return (
		<FormSection
			title="Animación de Introducción"
			description="Efecto al cargar inicialmente la tarjeta"
			colorScheme="design"
			icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="intro-animation"
						label="Habilitar Animación Inicial"
						description="Activa o desactiva la animación de entrada"
						checked={animation.introAnimation}
						onCheckedChange={(checked) => onAnimationChange('introAnimation', checked)}
						disabled={disabled || !animation.enabled}
					/>
				</FormRow>

				{animation.introAnimation && (
					<>
						<FormRow>
							<FormSelect
								id="intro-effect"
								label="Tipo de Efecto"
								description="Define el tipo de animación de introducción"
								value={animation.introEffect}
								onValueChange={(value) => onAnimationChange('introEffect', value)}
								options={introEffectOptions}
								disabled={disabled || !animation.enabled}
							/>
						</FormRow>
						<FormRow>
							<FormSlider
								id="intro-duration"
								label="Duración"
								description="Duración de la animación de introducción"
								value={animation.introDuration}
								onValueChange={(value) => onAnimationChange('introDuration', value)}
								min={0.2}
								max={2}
								step={0.1}
								unit="s"
								disabled={disabled || !animation.enabled}
							/>
						</FormRow>
					</>
				)}
			</FormGroup>
		</FormSection>
	);
};

// Sección de Efecto Parallax
const ParallaxEffectSection = ({
	animation,
	onAnimationChange,
	disabled
}: {
	animation: AnimationOptions;
	onAnimationChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efecto Parallax"
			description="Efecto de profundidad basado en el movimiento del cursor"
			colorScheme="design"
			icon={<Layers className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="parallax-effect"
						label="Habilitar Parallax"
						description="Activa o desactiva el efecto de paralaje al mover el cursor"
						checked={animation.parallaxEffect}
						onCheckedChange={(checked) => onAnimationChange('parallaxEffect', checked)}
						disabled={disabled || !animation.enabled}
					/>
				</FormRow>

				{animation.parallaxEffect && (
					<FormRow>
						<FormSlider
							id="parallax-intensity"
							label="Intensidad"
							description="Intensidad del efecto de paralaje"
							value={animation.parallaxIntensity}
							onValueChange={(value) => onAnimationChange('parallaxIntensity', value)}
							min={0.1}
							max={1}
							step={0.05}
							disabled={disabled || !animation.enabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

export function AnimationSettings({
	cardOptions,
	onCardOptionsChange,
	disabled = false
}: {
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar opciones de animación desde las opciones de la tarjeta
	const [animation, setAnimation] = useState<AnimationOptions>(
		cardOptions.animation || {
			enabled: true,
			duration: 0.3,
			easing: 'ease-in-out',
			delay: 0,

			hoverEffect: 'scale',
			hoverScale: 1.05,
			hoverRotation: 5,

			clickEffect: 'pulse',
			clickScale: 0.95,
			clickTransform: 'scale-down',

			introAnimation: false,
			introDuration: 0.5,
			introEffect: 'fade-in',

			parallaxEffect: false,
			parallaxIntensity: 0.2
		}
	);

	// Actualizar animación cuando cambien las opciones externas
	useEffect(() => {
		if (cardOptions.animation) {
			setAnimation(cardOptions.animation);
		}
	}, [cardOptions.animation]);

	// Manejador para cambios en propiedades de animación
	const handleAnimationChange = (key: string, value: unknown) => {
		const updatedAnimation = {
			...animation,
			[key]: value,
		};

		setAnimation(updatedAnimation);

		// Propagar cambios al componente padre
		onCardOptionsChange({
			...cardOptions,
			animation: updatedAnimation,
		});
	};

	return (
		<FormLayout
			title="Animaciones"
			description="Configura las animaciones y transiciones de las tarjetas"
			colorScheme="design"
			variant="colored"
			maxHeight={600}
			tabs={[
				{ value: 'general', label: 'General', icon: <Play className="h-3.5 w-3.5" /> },
				{ value: 'hover', label: 'Hover', icon: <MousePointer className="h-3.5 w-3.5" /> },
				{ value: 'click', label: 'Click', icon: <CornerRightDown className="h-3.5 w-3.5" /> },
				{ value: 'intro', label: 'Intro', icon: <Sparkles className="h-3.5 w-3.5" /> },
				{ value: 'parallax', label: 'Parallax', icon: <Layers className="h-3.5 w-3.5" /> },
			]}
		>
			{(tab) => (
				tab === 'general' ? (
					<GeneralSection
						animation={animation}
						onAnimationChange={handleAnimationChange}
						disabled={disabled}
					/>
				) : tab === 'hover' ? (
					<HoverEffectSection
						animation={animation}
						onAnimationChange={handleAnimationChange}
						disabled={disabled}
					/>
				) : tab === 'click' ? (
					<ClickEffectSection
						animation={animation}
						onAnimationChange={handleAnimationChange}
						disabled={disabled}
					/>
				) : tab === 'intro' ? (
					<IntroAnimationSection
						animation={animation}
						onAnimationChange={handleAnimationChange}
						disabled={disabled}
					/>
				) : (
					<ParallaxEffectSection
						animation={animation}
						onAnimationChange={handleAnimationChange}
						disabled={disabled}
					/>
				)
			)}
		</FormLayout>
	);
}
