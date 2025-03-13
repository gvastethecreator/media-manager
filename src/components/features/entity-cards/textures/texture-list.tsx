'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Edit, Eye, Trash } from 'lucide-react';
import React from 'react';

interface TextureItem {
	id: string;
	name: string;
	imageUrl?: string;
	patternType?: string;
	color: string;
	opacity: number;
	description?: string;
	blendMode?: string;
	noiseType?: string;
	animated?: boolean;
	animationSpeed?: number;
	density?: number;
	contrast?: number;
	visibleOnHover?: boolean;
	layerOrder?: number;
	scale?: number;
}

interface TextureListProps {
	textures: TextureItem[];
	onEditTexture: (texture: TextureItem) => void;
	onDeleteTexture: (textureId: string) => void;
	onPreviewTexture: (texture: TextureItem) => void;
}

export function TextureList({ textures, onEditTexture, onDeleteTexture, onPreviewTexture }: TextureListProps) {
	// Obtener el color con opacidad para la vista previa
	const getColorWithOpacity = (color: string, opacity: number) => {
		// Si el color es en formato hex (#RRGGBB), convertirlo a rgba
		if (color.startsWith('#')) {
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		return color;
	};

	// Obtener estilo del patrón para la vista previa
	const getPatternStyle = (patternType?: string, color?: string, opacity = 0.5) => {
		const colorWithOpacity = color ? getColorWithOpacity(color, opacity) : 'rgba(59, 130, 246, 0.5)';

		switch (patternType) {
			case 'dots':
				return {
					backgroundImage: `radial-gradient(${colorWithOpacity} 1px, transparent 1px)`,
					backgroundSize: '8px 8px',
				};
			case 'lines':
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: '10px 10px',
				};
			case 'grid':
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px),
                             linear-gradient(90deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: '10px 10px',
				};
			case 'waves':
				return {
					background: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${colorWithOpacity} 6px, transparent 10px)`,
				};
			case 'noise':
				return {
					backgroundColor: colorWithOpacity,
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
					backgroundBlendMode: 'overlay',
				};
			case 'circles':
				return {
					backgroundImage: `radial-gradient(circle at 50% 50%, ${colorWithOpacity} 20%, transparent 25%)`,
					backgroundSize: '20px 20px',
				};
			case 'squares':
				return {
					backgroundImage: `linear-gradient(0deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px),
                             linear-gradient(90deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px)`,
					backgroundSize: '15px 15px',
				};
			case 'diagonal':
				return {
					backgroundImage: `repeating-linear-gradient(45deg, ${colorWithOpacity}, ${colorWithOpacity} 1px, transparent 1px, transparent 10px)`,
				};
			case 'chevron':
				return {
					backgroundImage: `
            linear-gradient(135deg, ${colorWithOpacity} 25%, transparent 25%),
            linear-gradient(225deg, ${colorWithOpacity} 25%, transparent 25%)
          `,
					backgroundSize: '20px 20px',
				};
			default:
				return {
					backgroundColor: opacity > 0 ? colorWithOpacity : 'transparent',
				};
		}
	};

	return (
		<div className="bg-card border rounded-md">
			{textures.length === 0 ? (
				<div className="p-8 text-center text-muted-foreground">
					<AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
					<p className="text-sm">No hay texturas definidas</p>
					<p className="text-xs mt-1">Agrega texturas o usa los presets predefinidos</p>
				</div>
			) : (
				<ScrollArea className="h-64">
					<div className="divide-y">
						{textures.map((texture) => (
							<div key={texture.id} className="p-2 flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 flex-1">
									<div
										className="w-6 h-6 rounded border"
										style={getPatternStyle(texture.patternType, texture.color, texture.opacity)}
									/>
									<span className="text-sm">{texture.name}</span>
								</div>

								<div className="flex gap-1 items-center">
									<Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditTexture(texture)}>
										<Edit className="h-3.5 w-3.5" />
									</Button>

									<Button size="icon" variant="ghost" onClick={() => onPreviewTexture(texture)} title="Vista previa">
										<Eye className="h-4 w-4" />
									</Button>

									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
												<Trash className="h-3.5 w-3.5" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Eliminar textura</AlertDialogTitle>
												<AlertDialogDescription>
													¿Estás seguro de que deseas eliminar esta textura? Esta acción no se puede deshacer.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction onClick={() => onDeleteTexture(texture.id)}>Eliminar</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
}
