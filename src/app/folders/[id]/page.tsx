import { getFolder } from '@/app/actions/folders/crud.actions';
import { Button } from '@/components/ui/button';
import { FolderContentView } from '@/components/views/folders/views/folder-content-view';
import { formatDate, formatFileSize } from '@/lib/utils/format.utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DeleteFolderButton from './delete-button';

interface FolderPageProps {
	params: {
		id: string;
	};
}

export default async function FolderPage({ params }: FolderPageProps) {
	const { id } = params;
	const folder = await getFolder(id);

	if (!folder) {
		notFound();
	}

	return (
		<div className="p-8">
			<div className="flex justify-between items-start mb-8">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<span className="text-3xl">{folder.emoji || '📁'}</span>
						<h1 className="text-2xl font-bold">{folder.name}</h1>
					</div>
					{folder.description && <p className="text-gray-600 mb-2">{folder.description}</p>}
					<p className="text-sm text-gray-500">Ruta: {folder.path}</p>
				</div>
				<div className="flex gap-2">
					<Link href={`/folders/${id}/edit`}>
						<Button variant="outline">Editar</Button>
					</Link>
					<DeleteFolderButton id={id} />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="bg-gray-50 p-4 rounded-lg">
					<h2 className="font-medium mb-3">Información</h2>
					<dl className="space-y-2">
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">ID:</dt>
							<dd className="font-mono text-sm">{folder.id}</dd>
						</div>
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Archivos:</dt>
							<dd>{folder.totalFiles}</dd>
						</div>
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Tamaño total:</dt>
							<dd>{formatFileSize(folder.totalSize)}</dd>
						</div>
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Favorito:</dt>
							<dd>{folder.isFavorite ? 'Sí' : 'No'}</dd>
						</div>
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Creado:</dt>
							<dd>{formatDate(new Date(folder.createdAt))}</dd>
						</div>
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Actualizado:</dt>
							<dd>{formatDate(new Date(folder.updatedAt))}</dd>
						</div>
					</dl>
				</div>

				<div className="bg-gray-50 p-4 rounded-lg">
					<h2 className="font-medium mb-3">Indexación</h2>
					<dl className="space-y-2">
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Última indexación:</dt>
							<dd>{folder.lastIndexed ? formatDate(new Date(folder.lastIndexed)) : 'Nunca'}</dd>
						</div>
						<div className="grid grid-cols-2">
							<dt className="text-gray-500">Auto-indexación:</dt>
							<dd>{folder.autoReindex ? 'Activada' : 'Desactivada'}</dd>
						</div>
					</dl>
					<div className="mt-4">
						<Button variant="outline" size="sm">
							Indexar ahora
						</Button>
					</div>
				</div>
			</div>

			<div className="border-t pt-6">
				<h2 className="text-xl font-medium mb-4">Contenido</h2>
				<FolderContentView folderId={folder.id} />
			</div>
		</div>
	);
}
