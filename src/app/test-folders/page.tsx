import { FoldersSettings } from '@/components/settings/folders/folders-settings';

export default function TestFoldersPage() {
	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Prueba de Configuración de Carpetas</h1>
			<div className="max-w-md">
				<FoldersSettings />
			</div>
		</div>
	);
}
