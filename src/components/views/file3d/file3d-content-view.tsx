import { Box } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { File3DCard } from '@/components/cards/file3d-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { File3DWithStats } from '@/types/entities/file3d';

interface File3DContentViewProps {
	file3ds: File3DWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newFile3DName: string;
	newFile3DFile: File | null;
	setShowForm: (show: boolean) => void;
	setNewFile3DName: (name: string) => void;
	setNewFile3DFile: (file: File | null) => void;
	handleFile3DClick: (file3d: File3DWithStats) => void;
	handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleCreateFile3D: () => Promise<void>;
}

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

const File3DContentView: React.FC<File3DContentViewProps> = ({
	file3ds,
	isLoading,
	error,
	showForm,
	newFile3DName,
	newFile3DFile,
	setShowForm,
	setNewFile3DName,
	setNewFile3DFile,
	handleFile3DClick,
	handleFileChange,
	handleCreateFile3D,
}) => {
	const { toast } = useToast();

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && (!file3ds || file3ds.length === 0)) {
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

				{(!file3ds || file3ds.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						icon={Box}
						title="No hay archivos 3D"
						description="Sube archivos 3D para comenzar a usar el visor."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{file3ds?.map((file3d, index) => {
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
};

export default File3DContentView;
