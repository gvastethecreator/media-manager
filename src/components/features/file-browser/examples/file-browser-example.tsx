'use client';

import type { FileItem } from '@/types/file-item';
import { useEffect, useState } from 'react';
import { IntegratedFileBrowser } from '../integrated-file-browser';

// Datos de ejemplo para mostrar en el navegador de archivos
const generateMockFiles = (count: number): FileItem[] => {
	const fileTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf', 'text/plain'];
	const files: FileItem[] = [];

	console.log('[generateMockFiles] Generando', count, 'archivos de ejemplo');

	for (let i = 1; i <= count; i++) {
		const isImage = Math.random() > 0.3;
		const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
		const createdDate = new Date();
		createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

		const width = isImage ? Math.floor(Math.random() * 1000) + 800 : 0;
		const height = isImage ? Math.floor(Math.random() * 800) + 600 : 0;

		// Asegurar que tenemos una miniatura válida
		const imageId = (i % 85) + 10; // Picsum tiene un rango limitado de IDs
		const thumbnail = isImage ? `https://picsum.photos/id/${imageId}/200/150` : null;

		files.push({
			id: `file-${i}`,
			name: `Archivo ${i}.${fileType.split('/')[1]}`,
			path: `/uploads/file-${i}.${fileType.split('/')[1]}`,
			size: Math.floor(Math.random() * 10000000),
			type: fileType,
			mimeType: fileType,
			createdAt: createdDate.toISOString(),
			updatedAt: new Date().toISOString(),
			modifiedAt: new Date().toISOString(),
			accessedAt: new Date().toISOString(),
			width,
			height,
			isFavorite: Math.random() > 0.8,
			isPublic: Math.random() > 0.7,
			metadata: JSON.stringify({
				dimensions: { width, height },
				colorSpace: Math.random() > 0.5 ? 'sRGB' : 'Adobe RGB',
				...(Math.random() > 0.7 && {
					generation: {
						type: ['stable-diffusion', 'midjourney', 'comfyui'][Math.floor(Math.random() * 3)],
						model: 'v1.5',
						prompt: 'Un paisaje hermoso con montañas'
					}
				})
			}),
			tags: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
				id: `tag-${j}`,
				name: ['Paisaje', 'Retrato', 'Abstracto', 'Naturaleza', 'Ciudad', 'Personas'][Math.floor(Math.random() * 6)]
			})),
			collections: Math.random() > 0.5 ? Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
				id: `collection-${j}`,
				name: ['Vacaciones', 'Trabajo', 'Familia', 'Proyectos'][Math.floor(Math.random() * 4)]
			})) : [],
			albums: Math.random() > 0.7 ? [{ id: 'album-1', name: 'Álbum de prueba' }] : [],
			characters: Math.random() > 0.8 ? [{ id: 'character-1', name: 'Personaje' }] : [],
			places: Math.random() > 0.9 ? [{ id: 'place-1', name: 'Madrid' }] : [],
			worldItems: Math.random() > 0.95 ? [{ id: 'item-1', name: 'Objeto' }] : [],
			thumbnail: thumbnail,
			src: isImage ? `https://picsum.photos/id/${imageId}/800/600` : null
		});
	}

	console.log('[generateMockFiles] Generados', files.length, 'archivos de ejemplo');
	return files;
};

export function FileBrowserExample() {
	const [files, setFiles] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Simular carga de datos
	useEffect(() => {
		const timer = setTimeout(() => {
			setFiles(generateMockFiles(50));
			setIsLoading(false);
		}, 1500);

		return () => clearTimeout(timer);
	}, []);

	// Manejadores de eventos
	const handleItemSelect = (item: FileItem) => {
		console.log('Seleccionado:', item.name);
	};

	const handleItemDoubleClick = (item: FileItem) => {
		console.log('Doble clic en:', item.name);
		alert(`Abriendo ${item.name}`);
	};

	return (
		<div className="h-[calc(100vh-4rem)] border rounded-md overflow-hidden">
			<IntegratedFileBrowser
				items={files}
				isLoading={isLoading}
				onItemSelect={handleItemSelect}
				onItemDoubleClick={handleItemDoubleClick}
			/>
		</div>
	);
}