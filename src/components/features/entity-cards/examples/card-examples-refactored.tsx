'use client';

import { Calendar, Clock, Folder, MessageSquare, Tag, Users } from 'lucide-react';
import type React from 'react';

// Importar componentes base
import {
	BaseCardLayout,
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection
} from '../base';

// Importar tipos y utilidades
import { adaptCardOptions, type CardOptions } from '../types';

/**
 * EJEMPLO 1: Tarjeta Simple
 * Implementación básica para mostrar un tweet o mensaje
 */
interface MessageCardProps {
	data: {
		id: string;
		author: string;
		text: string;
		date: Date | string;
		likes?: number;
		replies?: number;
	};
	onClick?: () => void;
	className?: string;
	options?: Partial<CardOptions>;
}

export function MessageCard({ data, onClick, className, options }: MessageCardProps) {
	return (
		<BaseCardLayout
			data={{
				id: data.id,
				name: data.author,
				description: data.text,
				createdAt: data.date,
			}}
			onClick={onClick}
			className={className}
			options={adaptCardOptions(options)}
		>
			<CardHeader
				title={data.author}
				subtitle={'@' + data.author.toLowerCase().replace(/\s+/g, '')}
				rightContent={<Clock className="h-4 w-4 text-muted-foreground" />}
			/>

			<CardDescriptionSection
				description={data.text}
				maxLines={4}
				className="flex-grow"
			/>

			<CardFooter
				leftContent={
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="flex items-center">
							<MessageSquare className="h-3.5 w-3.5 mr-1" />
							{data.replies || 0}
						</span>
						<span className="flex items-center">
							<Users className="h-3.5 w-3.5 mr-1" />
							{data.likes || 0}
						</span>
					</div>
				}
				rightContent={
					<span className="text-xs text-muted-foreground">
						{typeof data.date === 'string'
							? data.date
							: data.date.toLocaleDateString()}
					</span>
				}
			/>
		</BaseCardLayout>
	);
}

/**
 * EJEMPLO 2: Tarjeta con Imagen
 * Implementación para un evento o conferencia
 */
interface EventCardProps {
	data: {
		id: string;
		title: string;
		description?: string;
		date: Date | string;
		location?: string;
		imageUrl?: string;
		attendees?: number;
		category?: string;
	};
	onClick?: () => void;
	className?: string;
	options?: Partial<CardOptions>;
}

export function EventCard({ data, onClick, className, options }: EventCardProps) {
	const defaultOptions: Partial<CardOptions> = {
		designSystem: {
			preset: 'modern',
			cornerRadius: 8,
			borderWidth: 1,
		},
		glowOptions: {
			intensity: 0.5,
			color: '#3b82f6',
			visibleOnHover: true,
		},
	};

	// Generar metadatos del evento
	const metadataItems = [
		data.location && {
			label: 'Ubicación',
			value: data.location,
			icon: <Folder className="h-3.5 w-3.5" />,
		},
		data.category && {
			label: 'Categoría',
			value: data.category,
			icon: <Tag className="h-3.5 w-3.5" />,
		},
		data.attendees !== undefined && {
			label: 'Asistentes',
			value: data.attendees,
			icon: <Users className="h-3.5 w-3.5" />,
		},
	].filter(Boolean) as Array<{ label: string; value: string | number; icon: React.ReactNode }>;

	return (
		<BaseCardLayout
			data={{
				id: data.id,
				name: data.title,
				description: data.description,
				createdAt: data.date,
				imageUrl: data.imageUrl,
			}}
			onClick={onClick}
			className={className}
			options={adaptCardOptions({
				...defaultOptions,
				...options,
			})}
		>
			{/* Imagen del evento primero (si existe) */}
			<CardImageSection
				imageUrl={data.imageUrl}
				alt={data.title}
				aspectRatio="wide"
				priority={true}
			/>

			{/* Cabecera con título */}
			<CardHeader
				title={data.title}
				subtitle={typeof data.date === 'string'
					? data.date
					: data.date.toLocaleDateString()
				}
				showIcon={false}
				rightContent={<Calendar className="h-4 w-4 text-primary" />}
			/>

			{/* Descripción del evento */}
			{data.description && (
				<CardDescriptionSection
					description={data.description}
					maxLines={2}
				/>
			)}

			{/* Metadatos del evento */}
			{metadataItems.length > 0 && (
				<CardMetadataSection items={metadataItems} />
			)}

			<CardFooter
				rightContent={
					<div className="text-xs text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
						{typeof data.date === 'string'
							? data.date
							: data.date.toLocaleDateString()}
					</div>
				}
			/>
		</BaseCardLayout>
	);
}

/**
 * EJEMPLO 3: Tarjeta Personalizada
 * Usando los componentes base pero con estructura personalizada
 */
interface CustomCardProps {
	title: string;
	subtitle?: string;
	content?: React.ReactNode;
	footer?: React.ReactNode;
	imageUrl?: string;
	onClick?: () => void;
	className?: string;
}

export function CustomCard({
	title,
	subtitle,
	content,
	footer,
	imageUrl,
	onClick,
	className,
}: CustomCardProps) {
	return (
		<div
			className={`custom-card relative w-full h-full rounded-lg overflow-hidden border border-muted ${className || ''}`}
			onClick={onClick}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
		>
			{/* Estructura personalizada usando algunos componentes base */}
			<div className="flex flex-col h-full">
				{/* Cabecera personalizada */}
				<div className="bg-primary text-primary-foreground p-3">
					<h3 className="text-lg font-semibold">{title}</h3>
					{subtitle && (
						<p className="text-sm opacity-80">{subtitle}</p>
					)}
				</div>

				{/* Imagen opcional */}
				{imageUrl && (
					<CardImageSection
						imageUrl={imageUrl}
						alt={title}
						aspectRatio="video"
					/>
				)}

				{/* Contenido personalizado */}
				<div className="flex-grow p-4">
					{content || <p>Sin contenido</p>}
				</div>

				{/* Pie personalizado */}
				<div className="border-t p-3 bg-muted/30">
					{footer || <span className="text-xs text-muted-foreground">© 2024</span>}
				</div>
			</div>
		</div>
	);
}

/**
 * Ejemplo de cómo implementar un nuevo tipo de tarjeta rápidamente
 * usando los componentes base
 */
export function ImplementNewCardExample() {
	// Datos de ejemplo
	const messageData = {
		id: '123',
		author: 'Ana García',
		text: 'Esta nueva biblioteca de tarjetas es increíble! Mucho más fácil de personalizar y con mejor rendimiento.',
		date: '20/04/2024',
		likes: 45,
		replies: 12,
	};

	const eventData = {
		id: '456',
		title: 'Conferencia React 2024',
		description: 'La conferencia anual sobre las últimas novedades en React y su ecosistema.',
		date: '15/06/2024',
		location: 'Madrid, España',
		imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e4',
		attendees: 250,
		category: 'Desarrollo Web',
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
			<div className="h-80">
				<MessageCard
					data={messageData}
					onClick={() => alert('Mensaje clickeado!')}
				/>
			</div>

			<div className="h-80">
				<EventCard
					data={eventData}
					onClick={() => alert('Evento clickeado!')}
				/>
			</div>

			<div className="h-80">
				<CustomCard
					title="Tarjeta personalizada"
					subtitle="Usando componentes base con estructura propia"
					imageUrl="https://images.unsplash.com/photo-1579547945413-497e1b99f0c9"
					content={
						<div className="space-y-2">
							<p>Este es un ejemplo de contenido personalizado.</p>
							<button className="px-3 py-1 bg-primary text-primary-foreground rounded">
								Acción
							</button>
						</div>
					}
					footer={
						<div className="flex justify-between">
							<span>Izquierda</span>
							<span>Derecha</span>
						</div>
					}
					onClick={() => alert('Personalizada clickeada!')}
				/>
			</div>
		</div>
	);
}