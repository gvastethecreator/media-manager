import { Box } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { File3DCard } from '@/components/cards/file3d-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFile3DStore } from '@/store/entities/file-3d';
import type { File3DWithStats } from '@/types/entities/file3d';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('File3DView');

const MemoizedFile3DCard = React.memo(
	({ file3d, onFile3DClick }: { file3d: File3DWithStats; onFile3DClick: () => void }) => (
		<File3DCard file3d={file3d} onClick={onFile3DClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.file3d.id === nextProps.file3d.id &&
		prevProps.file3d.name === nextProps.file3d.name &&
		prevProps.file3d.updatedAt === nextProps.file3d.updatedAt
);
MemoizedFile3DCard.displayName = 'MemoizedFile3DCard';

/**
 * Vista de archivos 3D
 * Muestra una lista de archivos 3D con cards TCG y soporte para visualización.
 */
export function File3DView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const file3dsRecord = useFile3DStore((s) => s.file3Ds);
	const isLoading = useFile3DStore((s) => s.isLoading);
	const error = useFile3DStore((s) => s.error);
	const loadFile3Ds = useFile3DStore((s) => s.loadFile3Ds);
	const createFile3D = useFile3DStore((s) => s.createFile3D); // Obtener la función createFile3D
	const getSortedFile3Ds = useFile3DStore((s) => s.getSortedFile3Ds);

	const [showForm, setShowForm] = useState(false);
	const [newFile3DName, setNewFile3DName] = useState('');
	const [newFile3DFile, setNewFile3DFile] = useState<File | null>(null);

	useEffect(() => {
		if (Object.keys(file3dsRecord).length === 0) {
			viewLogger.info('Store de archivos 3D vacío, cargando desde el servidor...');
			loadFile3Ds();
		}
	}, [loadFile3Ds, file3dsRecord]);

	const handleFile3DClick = useCallback((file3d: File3DWithStats) => {
		viewLogger.info('🖱️ Click en archivo 3D:', file3d.name);
		// Lógica de navegación o apertura de visor 3D aquí
	}, []);

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setNewFile3DFile(event.target.files[0]);
		}
	}, []);

	const handleCreateFile3D = useCallback(async () => {
		const { toast } = useToast();
		if (newFile3DName.trim() === '' || !newFile3DFile) {
			toast({
				title: '❌ Error',
				description: 'El nombre y el archivo 3D no pueden estar vacíos.',
				variant: 'destructive',
			});
			return;
		}
		// Aquí deberías manejar la subida del archivo.
		// Por ahora, solo simularemos la creación con el nombre.
		// En una implementación real, enviarías el archivo al backend.
		await createFile3D({ name: newFile3DName, path: newFile3DFile.name }); // Asumiendo que 'path' es el nombre del archivo
		setNewFile3DName('');
		setNewFile3DFile(null);
		setShowForm(false);
	}, [newFile3DName, newFile3DFile, createFile3D]);

	// Cachear el resultado de getSortedFile3Ds
	const sortedFile3Ds = useMemo(() => {
		return getSortedFile3Ds();
	}, [getSortedFile3Ds]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && Object.keys(file3dsRecord).length === 0) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Archivos 3D</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Subir Archivo 3D'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Archivo 3D</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="file3dName">Nombre</Label>
							<Input
								id="file3dName"
								value={newFile3DName}
								onChange={(e) => setNewFile3DName(e.target.value)}
								placeholder="Nombre del archivo 3D"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="file3dFile">Archivo 3D</Label>
							<Input
								id="file3dFile"
								type="file"
								accept=".glb,.gltf,.obj,.fbx" // Aceptar tipos de archivos 3D comunes
								onChange={handleFileChange}
							/>
						</div>
						<Button onClick={handleCreateFile3D}>Guardar Archivo 3D</Button>
					</div>
				)}

				{sortedFile3Ds.length === 0 && !isLoading && !showForm ? (
					<EmptyState icon={Box} title="No hay archivos 3D" description="Sube archivos 3D para comenzar a usar el visor." />
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{sortedFile3Ds.map((file3d, index) => {
							const onFile3DClick = () => handleFile3DClick(file3d);
							return (
								<motion.div
									key={file3d.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-file3d-id={file3d.id}
									>
										<MemoizedFile3DCard file3d={file3d} onFile3DClick={onFile3DClick} />
									</div>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa File3DCard TCG con efectos holográficos
 * - Integra store Zustand para gestión de estado
 * - Soporte para viewer 3D simulado con rotación automática
 * - Efectos cónicos y gradientes por formato (GLB, GLTF, OBJ, FBX, etc.)
 * - Animaciones fluidas con motion/react
 * - Lazy loading y memoización para rendimiento
 */

