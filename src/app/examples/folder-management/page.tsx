import FolderManagerExample from '@/components/examples/folder-manager-example';

export const metadata = {
	title: 'Gestor de Carpetas | Image Manager',
	description: 'Ejemplo del componente de gestión de carpetas con enfoque funcional',
};

export default function FolderManagementPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Demostración del Gestor de Carpetas</h1>
				<p className="text-muted-foreground mt-2">
					Esta página muestra un ejemplo funcional del gestor de carpetas implementado con programación funcional.
					Permite crear, eliminar y reindexar carpetas usando el servicio funcional.
				</p>
			</div>

			<div className="border rounded-lg p-6 bg-card">
				<FolderManagerExample />
			</div>

			<div className="mt-8 space-y-4">
				<h2 className="text-2xl font-semibold">Detalles de la implementación</h2>
				<p>
					Este componente demuestra la integración entre React y el servicio de carpetas funcional, mostrando:
				</p>
				<ul className="list-disc pl-6 space-y-2">
					<li>Gestión de estado con React hooks</li>
					<li>Suscripción a eventos del servicio mediante callbacks</li>
					<li>Integración con Server Actions para operaciones CRUD</li>
					<li>Visualización en tiempo real del progreso de indexación</li>
					<li>Manejo de errores y casos límite</li>
				</ul>
			</div>
		</div>
	);
}