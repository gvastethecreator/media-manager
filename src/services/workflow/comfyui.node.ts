import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { ComfyUIWorkflowService } from '@/services/workflow/comfyui.service';
import type { ComfyWorkflow, WorkflowWithStats } from '@/types/workflow';

/**
 * Servicio Node-only para operaciones con filesystem de Workflows ComfyUI
 * No debe importarse en código del cliente.
 */
export const ComfyUIWorkflowNodeService = {
	/** Lee y parsea un archivo JSON de workflow por ruta absoluta */
	async parseWorkflowFile(filePath: string): Promise<WorkflowWithStats | null> {
		try {
			const fileContent = await readFile(filePath, 'utf-8');
			const fileStats = await stat(filePath);

			const workflow: ComfyWorkflow = JSON.parse(fileContent);
			if (!ComfyUIWorkflowService.isValidComfyWorkflow(workflow)) return null;

			const stats = ComfyUIWorkflowService.calculateWorkflowStats(workflow, fileStats.size);

			const workflowWithStats: WorkflowWithStats = {
				...workflow,
				id: ComfyUIWorkflowService.generateWorkflowId(filePath),
				filePath,
				fileName: ComfyUIWorkflowService.extractFileName(filePath),
				stats,
				createdAt: fileStats.birthtime,
				updatedAt: fileStats.mtime,
			};

			return workflowWithStats;
		} catch {
			return null;
		}
	},

	/** Escanea un directorio buscando archivos .json de workflows */
	async scanDirectoryForWorkflows(directoryPath: string): Promise<WorkflowWithStats[]> {
		try {
			const entries = await readdir(directoryPath, { withFileTypes: true });
			const workflows: WorkflowWithStats[] = [];

			for (const file of entries) {
				if (file.isFile() && file.name.toLowerCase().endsWith('.json')) {
					const filePath = join(directoryPath, file.name);
					const wf = await this.parseWorkflowFile(filePath);
					if (wf) workflows.push(wf);
				}
			}

			return workflows;
		} catch {
			return [];
		}
	},
};
