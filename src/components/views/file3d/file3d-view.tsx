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
		await createFile3D({ name: newFile3DName, path: newFile3DFile.name }); // Asumiendo que 'path' es el nombre del archivo
		setNewFile3DName('');
		setNewFile3DFile(null);
		setShowForm(false);
	}, [newFile3DName, newFile3DFile, createFile3D]);

	// Cachear el resultado de getSortedFile3Ds
	const sortedFile3Ds = useMemo(() => {
		return getSortedFile3Ds();
	}, [getSortedFile3Ds]);

	return (
		<File3DContentView
			file3ds={sortedFile3Ds}
			isLoading={isLoading}
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
