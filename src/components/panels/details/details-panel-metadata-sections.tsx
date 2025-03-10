'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
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
import * as React from 'react';
import { InfoItem } from './details-panel-info-item';
import type { MetadataComponentProps } from './details-panel-types';

/**
 * Componente para metadata XMP
 */
export function XMPInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.xmp) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información XMP</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.xmp.title && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-blue-400" />}
						label="Título"
						value={metadata.xmp.title}
					/>
				)}
				{metadata.xmp.creator && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-green-400" />}
						label="Creador"
						value={metadata.xmp.creator}
					/>
				)}
				{metadata.xmp.rights && (
					<InfoItem
						icon={<Target className="h-3.5 w-3.5 text-red-400" />}
						label="Derechos"
						value={metadata.xmp.rights}
					/>
				)}
				{metadata.xmp.subject && metadata.xmp.subject.length > 0 && (
					<InfoItem
						icon={<Tag className="h-3.5 w-3.5 text-purple-400" />}
						label="Temas"
						value={metadata.xmp.subject.join(', ')}
					/>
				)}
				{metadata.xmp.rating !== undefined && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-yellow-400" />}
						label="Valoración"
						value={metadata.xmp.rating}
					/>
				)}
			</div>
		</div>
	);
}

/**
 * Componente para metadata IPTC
 */
export function IPTCInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.iptc) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información IPTC</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.iptc.headline && (
					<InfoItem
						icon={<AlignLeft className="h-3.5 w-3.5 text-blue-400" />}
						label="Titular"
						value={metadata.iptc.headline}
					/>
				)}
				{metadata.iptc.caption && (
					<InfoItem
						icon={<AlignLeft className="h-3.5 w-3.5 text-green-400" />}
						label="Descripción"
						value={metadata.iptc.caption}
					/>
				)}
				{metadata.iptc.keywords && metadata.iptc.keywords.length > 0 && (
					<InfoItem
						icon={<FileDigit className="h-3.5 w-3.5 text-purple-400" />}
						label="Palabras clave"
						value={metadata.iptc.keywords.join(', ')}
					/>
				)}
				{metadata.iptc.copyright && (
					<InfoItem
						icon={<Info className="h-3.5 w-3.5 text-red-400" />}
						label="Copyright"
						value={metadata.iptc.copyright}
					/>
				)}
				{metadata.iptc.source && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-cyan-400" />}
						label="Fuente"
						value={metadata.iptc.source}
					/>
				)}
			</div>
		</div>
	);
}

/**
 * Componente para metadata EXIF
 */
export function ExifInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.exif) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información EXIF</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.exif.make && (
					<InfoItem
						icon={<HardDrive className="h-3.5 w-3.5 text-indigo-400" />}
						label="Fabricante"
						value={metadata.exif.make}
					/>
				)}
				{metadata.exif.model && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-pink-400" />}
						label="Modelo"
						value={metadata.exif.model}
					/>
				)}
				{metadata.exif.software && (
					<InfoItem
						icon={<Variable className="h-3.5 w-3.5 text-cyan-400" />}
						label="Software"
						value={metadata.exif.software}
					/>
				)}
				{metadata.exif.dateTime && (
					<InfoItem
						icon={<Calendar className="h-3.5 w-3.5 text-orange-400" />}
						label="Fecha"
						value={formatDate(metadata.exif.dateTime)}
					/>
				)}
				{metadata.exif.exposureTime && (
					<InfoItem
						icon={<Clock className="h-3.5 w-3.5 text-red-400" />}
						label="Tiempo de exposición"
						value={`${metadata.exif.exposureTime}s`}
					/>
				)}
				{metadata.exif.fNumber && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-emerald-400" />}
						label="Apertura"
						value={`f/${metadata.exif.fNumber}`}
					/>
				)}
				{metadata.exif.iso && (
					<InfoItem
						icon={<FileDigit className="h-3.5 w-3.5 text-violet-400" />}
						label="ISO"
						value={metadata.exif.iso}
					/>
				)}
				{metadata.exif.focalLength && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-amber-400" />}
						label="Distancia focal"
						value={`${metadata.exif.focalLength}mm`}
					/>
				)}
				{metadata.exif.lens && (
					<InfoItem icon={<Camera className="h-3.5 w-3.5 text-teal-400" />} label="Lente" value={metadata.exif.lens} />
				)}
				{metadata.exif.copyright && (
					<InfoItem
						icon={<Info className="h-3.5 w-3.5 text-red-400" />}
						label="Copyright"
						value={metadata.exif.copyright}
					/>
				)}
				{metadata.exif.artist && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-purple-400" />}
						label="Artista"
						value={metadata.exif.artist}
					/>
				)}
				{metadata.exif.description && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-blue-400" />}
						label="Descripción"
						value={metadata.exif.description}
					/>
				)}
			</div>
		</div>
	);
}

/**
 * Componente para información GPS
 */
export function GPSInfo({ metadata }: MetadataComponentProps) {
	if (!metadata?.exif?.gps) {
		return null;
	}

	const { latitude, longitude, altitude } = metadata.exif.gps;
	const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información GPS</h3>
			<div className="flex flex-col gap-1.5">
				<InfoItem icon={<MapPin className="h-3.5 w-3.5 text-red-400" />} label="Latitud" value={latitude.toFixed(6)} />
				<InfoItem
					icon={<MapPin className="h-3.5 w-3.5 text-blue-400" />}
					label="Longitud"
					value={longitude.toFixed(6)}
				/>
				{altitude !== undefined && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-green-400" />}
						label="Altitud"
						value={`${altitude.toFixed(1)}m`}
					/>
				)}
				<Button variant="ghost" size="sm" className="mt-1" onClick={() => window.open(mapsUrl, '_blank')}>
					<MapIcon className="h-3.5 w-3.5 mr-2" />
					Ver en Google Maps
				</Button>
			</div>
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
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información Técnica</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.mimeType && (
					<InfoItem
						icon={<FileType className="h-3.5 w-3.5 text-blue-400" />}
						label="Formato"
						value={metadata.mimeType.split('/')[1].toUpperCase()}
					/>
				)}
				{metadata.dimensions && (
					<InfoItem
						icon={<Maximize2 className="h-3.5 w-3.5 text-green-400" />}
						label="Dimensiones"
						value={`${metadata.dimensions.width} × ${metadata.dimensions.height}`}
					/>
				)}
			</div>
		</div>
	);
}
