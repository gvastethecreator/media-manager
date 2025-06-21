import { type FolderComplete, getAllFolders } from '@/app/actions/folders';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function FoldersPage() {
	const folders = await getAllFolders();

	return (
		<div className="p-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Carpetas</h1>
				<Link href="/folders/create">
					<Button>Nueva Carpeta</Button>
				</Link>
			</div>

			{folders.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 mb-4">No hay carpetas disponibles.</p>
					<Link href="/folders/create">
						<Button variant="outline">Crear primera carpeta</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{folders.map((folder: FolderComplete) => (
						<Link
							key={folder.id}
							href={`/folders/${folder.id}`}
							className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
						>
							<div className="flex items-center gap-3">
								<span className="text-2xl">{folder.emoji || '📁'}</span>
								<div>
									<h2 className="font-medium">{folder.name}</h2>
									{folder.description && <p className="text-sm text-gray-500">{folder.description}</p>}
									<p className="text-xs text-gray-400 mt-1">{folder.path}</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
