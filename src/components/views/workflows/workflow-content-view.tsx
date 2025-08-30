import { memo, useMemo } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { WorkflowDropZone } from '@/components/features/workflow/workflow-drop-zone';
import { WorkflowViewer } from '@/components/features/workflow/workflow-viewer';
import { cn } from '@/lib/utils';

import { useComfyUIWorkflowStore } from '@/stores/comfyui-workflow.store';
import type { WorkflowWithStats } from '@/types/workflow';
import type { ViewProps } from '../types';

interface WorkflowContentViewProps extends ViewProps {
	workflowId?: string;
}

export const WorkflowContentView = memo(function WorkflowContentView({ className }: WorkflowContentViewProps) {
	const { currentWorkflow, isLoading, getFilteredWorkflows, setCurrentWorkflow, loadWorkflows } =
		useComfyUIWorkflowStore();

	// Si hay un workflow seleccionado, mostrar el visor a pantalla completa
	if (currentWorkflow) {
		return (
			<div className={cn('h-full', className)}>
				<WorkflowViewer className="h-full" workflow={currentWorkflow} />
			</div>
		);
	}

	// Adaptar workflows a elementos genéricos para el FileBrowser (como si fueran JSON)
	const items = useMemo(() => {
		return getFilteredWorkflows().map((w) => ({
			id: w.id,
			name: w.fileName,
			entityType: 'json' as const,
			mimeType: 'application/json',
			_workflow: w,
		}));
	}, [getFilteredWorkflows]);

	const handleOpenItem = (item: any) => {
		const wf = (item?._workflow || null) as WorkflowWithStats | null;
		if (wf) setCurrentWorkflow(wf);
	};

	const handleImportSuccess = () => {
		loadWorkflows();
	};

	return (
		<div className={cn('flex h-full flex-col', className)}>
			<div className="shrink-0 border-b p-4">
				<WorkflowDropZone onError={(e) => console.error(e)} onSuccess={handleImportSuccess} />
			</div>
			<div className="flex-1 overflow-hidden">
				<FileBrowser
					className="h-full"
					isLoading={isLoading}
					items={items as unknown as any[]}
					onItemDoubleClick={handleOpenItem}
				/>
			</div>
		</div>
	);
});

WorkflowContentView.displayName = 'WorkflowContentView';
