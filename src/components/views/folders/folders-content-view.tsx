import { DatabaseIcon, FolderIcon, RefreshCw, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderCard } from '@/components/cards/folder-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FolderWithStats } from '@/types/entities/folder';

interface FoldersContentViewProps {
	folders: FolderWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newFolderName: string;
	newFolderPath: string;
	optimisticFolders: FolderWithStats[];
	setShowForm: (show: boolean) => void;
	setNewFolderName: (name: string) => void;
	setNewFolderPath: (path: string) => void;
	handleFolderClick: (folder: FolderWithStats) => void;
	handleCreateFolder: () => void;
	handleManualRetry: () => void;
}

const MemoizedFolderCard = React.memo(
	({ folder, onFolderClick }: { folder: FolderWithStats; onFolderClick: () => void }) => (
		<FolderCard folder={folder} onClick={onFolderClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.folder.id === nextProps.folder.id &&
		prevProps.folder.name === nextProps.folder.name &&
		prevProps.folder.updatedAt === nextProps.folder.updatedAt &&
		(prevProps.folder._count?.images || 0) === (nextProps.folder._count?.images || 0) &&
		prevProps.folder.totalSize === nextProps.folder.totalSize &&
		prevProps.folder.totalFiles === nextProps.folder.totalFiles
);
MemoizedFolderCard.displayName = 'MemoizedFolderCard';

const FoldersContentView: React.FC<FoldersContentViewProps> = ({
	folders,
	isLoading,
	error,
	showForm,
	newFolderName,
	newFolderPath,
	optimisticFolders,
	setShowForm,
	setNewFolderName,
	setNewFolderPath,
	handleFolderClick,
	handleCreateFolder,
	handleManualRetry,
}) => {
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6">
				<div className="max-w-md w-full bg-destructive/10 rounded-lg p-6 text-center">
					<XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
					<h3 className="text-xl font-semibold text-destructive mb-2">Error al cargar carpetas</h3>
					<p className="text-sm mb-4">{error}</p>
					<p className="text-xs text-muted-foreground mb-4">
						Este error podría estar relacionado con problemas de conexión a la base de datos o problemas con la
						estructura de tablas.
					</p>
					<div className="flex flex-col gap-2">
						<Button variant="outline" onClick={handleManualRetry}>
							<RefreshCw className="h-4 w-4 mr-2" />
							Reintentar
						</Button>
						<Link to="/diagnostics/database" className={buttonVariants({ variant: 'default' })}>
							<DatabaseIcon className="h-4 w-4 mr-2" />
							Ejecutar diagnóstico
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Carpetas</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Carpeta'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nueva Carpeta</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="folderName">Nombre</Label>
							<Input
								id="folderName"
								value={newFolderName}
								onChange={(e) => setNewFolderName(e.target.value)}
								placeholder="Nombre de la carpeta"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="folderPath">Ruta</Label>
							<Input
								id="folderPath"
								value={newFolderPath}
								onChange={(e) => setNewFolderPath(e.target.value)}
								placeholder="Ruta de la carpeta (ej: /ruta/a/mi/carpeta)"
							/>
						</div>
						<Button onClick={handleCreateFolder}>Guardar Carpeta</Button>
					</div>
				)}

				{!optimisticFolders || optimisticFolders.length === 0 ? (
					<EmptyState
						icon={FolderIcon}
						title="No hay carpetas indexadas"
						description="Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
						{optimisticFolders.map((folder, index) => {
							// Verificar que la carpeta tenga un id válido
							if (!folder || !folder.id) {
								console.error('Carpeta sin id válido:', folder);
								return null;
							}

							// Crear una función de clic específica para esta carpeta
							const onFolderClick = () => handleFolderClick(folder);

							return (
								<motion.div
									key={folder.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: index * 0.1,
										duration: 0.4,
										type: 'spring',
										stiffness: 100,
										damping: 12,
									}}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-folder-id={folder.id}
									>
										<MemoizedFolderCard folder={folder} onFolderClick={onFolderClick} />
									</div>
								</motion.div>
							);
						})}
					</div>
				)}

				{/* Footer con información adicional */}
				{optimisticFolders.length > 0 && (
					<div className="mt-8 pt-6 border-t border-border">
						<p className="text-sm text-muted-foreground text-center">
							Mostrando {optimisticFolders.length} {optimisticFolders.length === 1 ? 'carpeta' : 'carpetas'}
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default FoldersContentView;
