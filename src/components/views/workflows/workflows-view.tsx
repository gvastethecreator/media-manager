// Vista de workflows
import { WorkflowCard } from '@/components/entities/workflow/workflow-card';

/**
 * Vista de ejemplo para workflows
 * Mostrará una lista de workflows con cards y soporte futuro para edición/ejecución.
 */
export function WorkflowsView() {
	// Ejemplo de datos mock
	const workflows = [
		{ name: 'Pipeline de imágenes' },
		{ name: 'Automatización de backup' },
	];

	return (
		<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{workflows.map((wf) => (
				<WorkflowCard key={wf.name} name={wf.name} />
			))}
			{/* Próximamente: editor y ejecución de workflows */}
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Esta vista lista workflows y permitirá edición/ejecución.
 * - Extensible para integración con motores de automatización.
 */
