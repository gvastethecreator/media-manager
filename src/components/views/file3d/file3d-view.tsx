import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFile3DStore } from '@/store/entities/file-3d';
import type { File3DWithStats } from '@/types/entities/file3d';
import type { ViewProps } from '../types';
import File3DContentView from './file3d-content-view';

const viewLogger = clientLogger.withContext('File3DView');

/**
 * Vista de archivos 3D
 * Muestra una lista de archivos 3D con cards TCG y soporte para visualización.
 */
export function File3DView(_props: ViewProps) {
	const navigate = useNavigate();

	// Usar selectores normales de Zustand
	const file3ds = useFile3DStore((state) => state.file3Ds) || [];
	const loading = useFile3DStore((state) => state.loading) || false;
	const error = useFile3DStore((state) => state.error) || null;
	const fetchFile3Ds = useFile3DStore((state) => state.fetchFile3Ds);
	const createFile3D = useFile3DStore((state) => state.createFile3D);

	const [showForm, setShowForm] = useState(false);
	const [newFile3DName, setNewFile3DName] = useState('');
	const [newFile3DFile, setNewFile3DFile] = useState<File | null>(null);

	useEffect(() => {
		if (file3ds.length === 0) {
			viewLogger.info('Store de archivos 3D vacío, cargando desde el servidor...');
			fetchFile3Ds();
		}
	}, [fetchFile3Ds, file3ds]);

	const handleFile3DClick = useCallback(
		(file3d: File3DWithStats) => {
			viewLogger.info('🖱️ Click en archivo 3D:', file3d.name);
			navigate(`/file3d/${file3d.id}`);
		},
		[navigate]
	);

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setNewFile3DFile(event.target.files[0]);
		}
	}, []);

	const handleCreateFile3D = useCallback(async () => {
		// const { toast } = useToast();
		if (newFile3DName.trim() === '' || !newFile3DFile) {
			// toast({
			// 	title: '❌ Error',
			// 	description: 'El nombre y el archivo 3D no pueden estar vacíos.',
			// 	variant: 'destructive',
			// });
			return;
		}
		// Aquí deberías manejar la subida del archivo.
		// Por ahora, solo simularemos la creación con el nombre.
		// En una implementación real, enviarías el archivo al backend.
		// TODO: Implementar la subida real del archivo y obtener los metadatos necesarios
		await createFile3D({
			name: newFile3DName,
			path: newFile3DFile.name,
			size: newFile3DFile.size,
			hash: '', // TODO: Calcular hash del archivo
			mimeType: newFile3DFile.type,
			extension: newFile3DFile.name.split('.').pop() || '',
			folderId: '', // TODO: Obtener folderId actual
			isFavorite: false,
			isArchived: false,
			format: newFile3DFile.name.split('.').pop() || null,
			version: null,
			vertices: null,
			faces: null,
			triangles: null,
			materials: null,
			textures: null,
			animations: null,
			bones: null,
			scenes: null,
			cameras: null,
			lights: null,
			hasUV: null,
			hasNormals: null,
			hasColors: null,
			boundingBox: null,
		});
		setNewFile3DName('');
		setNewFile3DFile(null);
		setShowForm(false);
	}, [newFile3DName, newFile3DFile, createFile3D]);

	// Usar directamente el array de file3ds
	const sortedFile3Ds = useMemo(() => {
		return file3ds;
	}, [file3ds]);

	return (
		<File3DContentView
			file3ds={sortedFile3Ds}
			isLoading={loading}
			error={error}
			showForm={showForm}
			newFile3DName={newFile3DName}
			newFile3DFile={newFile3DFile}
			setShowForm={setShowForm}
			setNewFile3DName={setNewFile3DName}
			setNewFile3DFile={setNewFile3DFile}
			handleFile3DClick={handleFile3DClick}
			handleFileChange={handleFileChange}
			handleCreateFile3D={handleCreateFile3D}
		/>
	);
}
