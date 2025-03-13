'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatFileSize } from '@/lib/utils';
import { formatDate } from '@/lib/utils/utils';
import {
	AlignLeft,
	Calendar,
	Camera,
	Clock,
	FileDigit,
	FileImage,
	FileType,
	HardDrive,
	Info,
	MapIcon,
	MapPin,
	Maximize2,
	Tag,
	Target,
	User2,
	Variable,
} from 'lucide-react';
import { Copy, CopyCheck, ImageIcon } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { InfoItem } from './details-panel-info-item';
import type { MetadataComponentProps } from './details-panel-types';

/**
 * Componente para metadata XMP
 */
export function XMPInfo({ metadata }: MetadataComponentProps) {
	const [copied, setCopied] = useState(false);

	if (!metadata?.xmp) {
		return <div className="text-xs text-muted-foreground">No hay datos XMP disponibles</div>;
	}

	const { xmp } = metadata;

	// Función para copiar al portapapeles
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<div className="space-y-2">
			{xmp.creator && (
				<InfoItem label="Creador" value={xmp.creator} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />
			)}

			{xmp.title && <InfoItem label="Título" value={xmp.title} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />}

			{xmp.description && (
				<InfoItem label="Descripción" value={xmp.description} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />
			)}

			{xmp.rights && (
				<InfoItem label="Derechos" value={xmp.rights} icon={<Copy className="h-3.5 w-3.5 text-red-500" />} />
			)}

			{xmp.toolkit && (
				<InfoItem label="Toolkit" value={xmp.toolkit} icon={<Info className="h-3.5 w-3.5 text-purple-500" />} />
			)}

			{xmp.subject && xmp.subject.length > 0 && (
				<div className="space-y-1">
					<div className="text-xs font-medium text-muted-foreground flex items-center">
						<Info className="h-3.5 w-3.5 text-green-500 mr-1.5" />
						Etiquetas
					</div>
					<div className="flex flex-wrap gap-1">
						{xmp.subject.map((tag) => (
							<button
								key={`tag-${tag}`}
								className="text-xs rounded-full bg-muted px-2 py-0.5 hover:bg-muted/80"
								onClick={() => copyToClipboard(tag)}
								type="button"
							>
								{tag}
							</button>
						))}
					</div>
				</div>
			)}

			{xmp.rawData && (
				<div className="flex flex-col space-y-1">
					<div className="text-xs font-medium text-muted-foreground flex items-center">
						<Info className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
						Datos XMP sin procesar
					</div>
					<div className="relative">
						<div className="max-h-20 overflow-y-auto text-xs p-2 bg-muted/50 rounded-md font-mono whitespace-pre-wrap text-[10px]">
							{typeof xmp.rawData === 'string'
								? xmp.rawData.substring(0, 500) + (xmp.rawData.length > 500 ? '...' : '')
								: JSON.stringify(xmp.rawData, null, 2)}
						</div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="sm"
										variant="ghost"
										className="absolute top-1 right-1 h-6 w-6 p-0"
										onClick={() =>
											copyToClipboard(
												typeof xmp.rawData === 'string' ? xmp.rawData : JSON.stringify(xmp.rawData, null, 2)
											)
										}
									>
										{copied ? <CopyCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="text-xs">{copied ? 'Copiado!' : 'Copiar al portapapeles'}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			)}

			{!xmp.creator &&
				!xmp.title &&
				!xmp.description &&
				!xmp.rights &&
				!xmp.toolkit &&
				(!xmp.subject || xmp.subject.length === 0) &&
				!xmp.rawData && (
					<p className="text-xs text-muted-foreground italic">
						Esta imagen contiene metadatos XMP pero no hay información detallada disponible
					</p>
				)}
		</div>
	);
}

/**
 * Componente para metadata IPTC
 */
export function IPTCInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.iptc) {
		return <div className="text-xs text-muted-foreground">No hay datos IPTC disponibles</div>;
	}

	const { iptc } = metadata;

	return (
		<div className="space-y-2">
			{iptc.creator && iptc.creator.length > 0 && (
				<InfoItem
					label="Creador"
					value={iptc.creator.join(', ')}
					icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
				/>
			)}

			{iptc.headline && (
				<InfoItem label="Titular" value={iptc.headline} icon={<Info className="h-3.5 w-3.5 text-amber-500" />} />
			)}

			{iptc.caption && (
				<InfoItem label="Leyenda" value={iptc.caption} icon={<Info className="h-3.5 w-3.5 text-purple-500" />} />
			)}

			{iptc.copyright && (
				<InfoItem label="Copyright" value={iptc.copyright} icon={<Copy className="h-3.5 w-3.5 text-red-500" />} />
			)}

			{iptc.source && (
				<InfoItem label="Fuente" value={iptc.source} icon={<Info className="h-3.5 w-3.5 text-green-500" />} />
			)}

			{iptc.keywords && iptc.keywords.length > 0 && (
				<div className="space-y-1">
					<div className="text-xs font-medium text-muted-foreground flex items-center">
						<Info className="h-3.5 w-3.5 text-green-500 mr-1.5" />
						Palabras clave
					</div>
					<div className="flex flex-wrap gap-1">
						{iptc.keywords.map((keyword) => (
							<div key={`keyword-${keyword}`} className="text-xs rounded-full bg-muted px-2 py-0.5">
								{keyword}
							</div>
						))}
					</div>
				</div>
			)}

			{!iptc.creator &&
				!iptc.headline &&
				!iptc.caption &&
				!iptc.copyright &&
				!iptc.source &&
				(!iptc.keywords || iptc.keywords.length === 0) && (
					<p className="text-xs text-muted-foreground italic">
						Esta imagen contiene metadatos IPTC pero no hay información detallada disponible
					</p>
				)}
		</div>
	);
}

/**
 * Componente para metadata EXIF
 */
export function ExifInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.exif) {
		return <div className="text-xs text-muted-foreground">No hay datos EXIF disponibles</div>;
	}

	const { exif } = metadata;

	// Función para formatear la fecha EXIF en formato legible
	const formatExifDate = (dateStr?: string | Date) => {
		if (!dateStr) {
			return 'No disponible';
		}

		try {
			// Intentar parsear la fecha si es string o usar directamente si es Date
			const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

			if (Number.isNaN(date.getTime())) {
				// Si la fecha no es válida, mostrar como string
				return typeof dateStr === 'string' ? dateStr : 'Fecha inválida';
			}

			// Formato de fecha: DD/MM/YYYY HH:MM:SS
			return date.toLocaleString();
		} catch (_error) {
			return dateStr;
		}
	};

	return (
		<div className="space-y-2">
			{exif.make && (
				<InfoItem label="Fabricante" value={exif.make} icon={<Camera className="h-3.5 w-3.5 text-indigo-500" />} />
			)}

			{exif.model && (
				<InfoItem label="Modelo" value={exif.model} icon={<Camera className="h-3.5 w-3.5 text-indigo-500" />} />
			)}

			{exif.software && (
				<InfoItem label="Software" value={exif.software} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />
			)}

			{exif.dateTime && (
				<InfoItem
					label="Fecha"
					value={formatExifDate(exif.dateTime)}
					icon={<Calendar className="h-3.5 w-3.5 text-amber-500" />}
				/>
			)}

			{exif.exposureTime && (
				<InfoItem
					label="Tiempo exposición"
					value={`${exif.exposureTime}s`}
					icon={<Camera className="h-3.5 w-3.5 text-purple-500" />}
				/>
			)}

			{exif.fNumber && (
				<InfoItem
					label="Apertura"
					value={`f/${exif.fNumber}`}
					icon={<Camera className="h-3.5 w-3.5 text-purple-500" />}
				/>
			)}

			{exif.iso && (
				<InfoItem label="ISO" value={exif.iso.toString()} icon={<Camera className="h-3.5 w-3.5 text-purple-500" />} />
			)}

			{exif.focalLength && (
				<InfoItem
					label="Distancia focal"
					value={`${exif.focalLength}mm`}
					icon={<Camera className="h-3.5 w-3.5 text-purple-500" />}
				/>
			)}

			{exif.lensModel && (
				<InfoItem
					label="Modelo de lente"
					value={exif.lensModel}
					icon={<Camera className="h-3.5 w-3.5 text-purple-500" />}
				/>
			)}

			{exif.copyright && (
				<InfoItem label="Copyright" value={exif.copyright} icon={<Copy className="h-3.5 w-3.5 text-red-500" />} />
			)}

			{exif.artist && (
				<InfoItem label="Artista" value={exif.artist} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />
			)}

			{exif.description && (
				<InfoItem label="Descripción" value={exif.description} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />
			)}

			{!exif.make &&
				!exif.model &&
				!exif.software &&
				!exif.dateTime &&
				!exif.exposureTime &&
				!exif.fNumber &&
				!exif.iso &&
				!exif.focalLength &&
				!exif.lensModel &&
				!exif.copyright &&
				!exif.artist &&
				!exif.description && (
					<p className="text-xs text-muted-foreground italic">
						Esta imagen contiene metadatos EXIF pero no hay información detallada disponible
					</p>
				)}
		</div>
	);
}

/**
 * Componente para información GPS
 */
export function GPSInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.exif?.gps) {
		return <div className="text-xs text-muted-foreground">No hay datos GPS disponibles</div>;
	}

	const { gps } = metadata.exif;

	// Formatear coordenadas
	const formatCoordinate = (value: number, isLatitude: boolean) => {
		const direction = isLatitude ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'O';

		const absValue = Math.abs(value);
		const degrees = Math.floor(absValue);
		const minutes = Math.floor((absValue - degrees) * 60);
		const seconds = ((absValue - degrees) * 60 - minutes) * 60;

		return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
	};

	// URL para Google Maps con las coordenadas
	const googleMapsUrl =
		gps.latitude !== undefined && gps.longitude !== undefined
			? `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`
			: undefined;

	return (
		<div className="space-y-2">
			{gps.latitude !== undefined && (
				<InfoItem
					label="Latitud"
					value={formatCoordinate(gps.latitude, true)}
					icon={<MapPin className="h-3.5 w-3.5 text-green-500" />}
				/>
			)}

			{gps.longitude !== undefined && (
				<InfoItem
					label="Longitud"
					value={formatCoordinate(gps.longitude, false)}
					icon={<MapPin className="h-3.5 w-3.5 text-blue-500" />}
				/>
			)}

			{gps.altitude !== undefined && (
				<InfoItem
					label="Altitud"
					value={`${gps.altitude} metros`}
					icon={<MapPin className="h-3.5 w-3.5 text-purple-500" />}
				/>
			)}

			{googleMapsUrl && (
				<div className="pt-1">
					<Button
						variant="outline"
						size="sm"
						className="w-full text-xs"
						onClick={() => window.open(googleMapsUrl, '_blank')}
					>
						<MapPin className="h-3.5 w-3.5 mr-1.5" />
						Ver en Google Maps
					</Button>
				</div>
			)}

			{gps.latitude === undefined && gps.longitude === undefined && gps.altitude === undefined && (
				<p className="text-xs text-muted-foreground italic">
					Esta imagen contiene datos GPS pero no hay coordenadas disponibles
				</p>
			)}
		</div>
	);
}

/**
 * Componente para información técnica de la imagen
 */
export function TechnicalInfo({ metadata }: MetadataComponentProps) {
	if (!metadata) {
		return null;
	}

	return (
		<div className="space-y-2">
			{metadata.dimensions && (
				<InfoItem
					label="Dimensiones"
					value={`${metadata.dimensions.width} × ${metadata.dimensions.height} px`}
					icon={<ImageIcon className="h-3.5 w-3.5 text-green-500" />}
				/>
			)}

			{metadata.mimeType && (
				<InfoItem label="Tipo MIME" value={metadata.mimeType} icon={<Info className="h-3.5 w-3.5 text-blue-500" />} />
			)}

			{metadata.fileSize !== undefined && (
				<InfoItem
					label="Tamaño"
					value={formatFileSize(metadata.fileSize)}
					icon={<Info className="h-3.5 w-3.5 text-green-500" />}
				/>
			)}

			{metadata.colorSpace && (
				<InfoItem
					label="Espacio de color"
					value={metadata.colorSpace}
					icon={<Info className="h-3.5 w-3.5 text-purple-500" />}
				/>
			)}

			{metadata.hasAlpha !== undefined && (
				<InfoItem
					label="Canal alfa"
					value={metadata.hasAlpha ? 'Sí' : 'No'}
					icon={<Info className="h-3.5 w-3.5 text-amber-500" />}
				/>
			)}

			{metadata.isAnimated !== undefined && (
				<InfoItem
					label="Animada"
					value={metadata.isAnimated ? 'Sí' : 'No'}
					icon={<Info className="h-3.5 w-3.5 text-indigo-500" />}
				/>
			)}

			{!metadata.dimensions &&
				!metadata.mimeType &&
				!metadata.fileSize &&
				!metadata.colorSpace &&
				metadata.hasAlpha === undefined &&
				metadata.isAnimated === undefined && (
					<p className="text-xs text-muted-foreground italic">No se encontró información técnica para esta imagen</p>
				)}
		</div>
	);
}
