'use client';

import type { FileItem } from '@/types/file-item';
import { FileProcessingStatus, FileType } from '@/types/file-item';
import { useEffect, useState } from 'react';
import { GridView } from './grid-view';

/**
 * Componente de prueba para verificar el funcionamiento del GridView
 * con una configuración aislada y datos de prueba.
 */
export default function TestGridView() {
	// Estado para los elementos de prueba
	const [testItems, setTestItems] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState(true);

	// Efecto para generar elementos de prueba al montar el componente
	useEffect(() => {
		// Simular carga asíncrona de datos
		setLoading(true);

		// Generar elementos de prueba
		const generateTestItems = () => {
			const items: FileItem[] = [];

			// Crear 100 elementos de prueba
			for (let i = 1; i <= 100; i++) {
				items.push({
					id: `test-${i}`,
					name: `Test Image ${i}.jpg`,
					path: `/test/images/test-${i}.jpg`,
					type: FileType.IMAGE,
					size: 1024 * 1024 * Math.random(),
					mimeType: 'image/jpeg',
					metadata: '{}',
					processingStatus: FileProcessingStatus.COMPLETED,
					createdAt: new Date(),
					updatedAt: new Date(),
					// Propiedades adicionales para visualización
					width: 500,
					height: 500,
					// Usar imágenes de prueba de Placeholder.com o similar
					thumbnail: `https://picsum.photos/id/${(i % 30) + 1}/500/500`,
					src: `https://picsum.photos/id/${(i % 30) + 1}/500/500`,
					// Hacer algunos elementos favoritos aleatoriamente
					isFavorite: Math.random() > 0.8,
				});
			}

			return items;
		};

		// Simular retraso de red
		setTimeout(() => {
			setTestItems(generateTestItems());
			setLoading(false);
		}, 500);
	}, []);

	// Manejadores de eventos simulados
	const handleItemClick = (item: FileItem) => {
		console.log('Item clicked:', item.name);
	};

	const handleItemDoubleClick = (item: FileItem) => {
		console.log('Item double-clicked:', item.name);
	};

	const handleContextMenu = (item: FileItem, e: React.MouseEvent) => {
		console.log('Context menu for item:', item.name);
	};

	// Renderizar el componente de prueba
	return (
		<div className="w-full h-screen bg-background">
			<div className="container mx-auto p-4">
				<h1 className="text-2xl font-bold mb-4">Test GridView</h1>

				<div className="border border-border rounded-lg h-[800px] w-full">
					{loading ? (
						<div className="w-full h-full flex items-center justify-center">
							<div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
						</div>
					) : (
						<GridView
							items={testItems}
							onItemClick={handleItemClick}
							onItemDoubleClick={handleItemDoubleClick}
							onContextMenu={handleContextMenu}
						/>
					)}
				</div>

				<div className="mt-4 text-sm text-muted-foreground">
					<p>Mostrando {testItems.length} elementos en formato de cuadrícula.</p>
					<p>Desplázate para probar la carga progresiva y las animaciones.</p>
				</div>
			</div>
		</div>
	);
}