import { FolderDiagnostics } from '@/components/views/folders/diagnostics/folder-diagnostics';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Diagnóstico de Base de Datos',
	description: 'Herramienta para diagnosticar problemas con la base de datos',
};

export default function DatabaseDiagnosticsPage() {
	return (
		<div className="container py-8">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Diagnóstico de Base de Datos</h1>
					<p className="text-muted-foreground mt-2">
						Esta herramienta le ayudará a diagnosticar problemas comunes con la conexión a la base de datos y la
						estructura de tablas.
					</p>
				</div>

				<FolderDiagnostics />

				<div className="mt-8 text-sm bg-muted p-4 rounded-md">
					<h3 className="font-medium mb-2">Acerca de esta herramienta</h3>
					<p>
						Si está experimentando errores al cargar carpetas o imágenes, es posible que haya problemas con la conexión
						a la base de datos o con la estructura de las tablas. Esta herramienta ejecuta pruebas de diagnóstico para
						ayudar a identificar la causa del problema.
					</p>
					<p className="mt-2">Si los diagnósticos muestran errores, verifique:</p>
					<ul className="list-disc pl-5 mt-1 space-y-1">
						<li>Que el servidor de base de datos esté funcionando</li>
						<li>Que la cadena de conexión en .env sea correcta</li>
						<li>Que haya ejecutado las migraciones de Prisma</li>
						<li>Que tenga permisos adecuados para acceder a la base de datos</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
