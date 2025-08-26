import type {
	ComfyWorkflow,
	WorkflowWithStats,
	WorkflowStats,
	ComfyNodeTypeInfo,
	WorkflowExecutionContext,
} from '@/types/workflow';
import { ComfyNodeCategory } from '@/types/workflow';

/**
 * Node type mappings for ComfyUI nodes
 */
const NODE_TYPE_MAPPINGS: Record<string, ComfyNodeTypeInfo> = {
	// Input nodes
	CheckpointLoaderSimple: {
		category: ComfyNodeCategory.INPUT,
		displayName: 'Checkpoint Loader',
		color: '#4f46e5',
		description: 'Load model checkpoint',
	},
	CLIPTextEncode: {
		category: ComfyNodeCategory.CONDITIONING,
		displayName: 'CLIP Text Encode',
		color: '#059669',
		description: 'Encode text prompt',
	},
	EmptyLatentImage: {
		category: ComfyNodeCategory.LATENT,
		displayName: 'Empty Latent',
		color: '#dc2626',
		description: 'Create empty latent image',
	},

	// Sampling
	KSampler: {
		category: ComfyNodeCategory.SAMPLING,
		displayName: 'KSampler',
		color: '#ea580c',
		description: 'Sampling with scheduler',
	},
	KSamplerAdvanced: {
		category: ComfyNodeCategory.SAMPLING,
		displayName: 'KSampler Advanced',
		color: '#ea580c',
		description: 'Advanced sampling options',
	},

	// Output
	VAEDecode: {
		category: ComfyNodeCategory.OUTPUT,
		displayName: 'VAE Decode',
		color: '#7c3aed',
		description: 'Decode latent to image',
	},
	SaveImage: {
		category: ComfyNodeCategory.OUTPUT,
		displayName: 'Save Image',
		color: '#be123c',
		description: 'Save generated image',
	},
	PreviewImage: {
		category: ComfyNodeCategory.OUTPUT,
		displayName: 'Preview Image',
		color: '#be123c',
		description: 'Preview generated image',
	},
};

/**
 * 🔄 Servicio para gestión de workflows ComfyUI
 */
// --- Funciones internas ---
const generateWorkflowId = (seed: string): string => {
	const base64 =
		typeof btoa === 'function'
			? btoa(unescape(encodeURIComponent(seed)))
			: (globalThis as any)?.Buffer
				? (globalThis as any).Buffer.from(seed).toString('base64')
				: `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
	return `workflow_${base64.replace(/[^A-Za-z0-9]/g, '').slice(0, 16)}`;
};

const extractFileName = (filePath: string): string => {
	const fileName = (filePath || '').split(/[\\/]/).pop() || '';
	return fileName.replace(/\.json$/i, '') || 'workflow';
};

const isValidComfyWorkflow = (obj: any): obj is ComfyWorkflow =>
	obj && typeof obj === 'object' && obj.version === 1 && Array.isArray(obj.nodes) && typeof obj.state === 'object';

const calculateWorkflowStats = (workflow: ComfyWorkflow, fileSize: number): WorkflowStats => ({
	nodeCount: workflow.nodes.length,
	linkCount: workflow.links?.length || 0,
	groupCount: workflow.groups?.length || 0,
	modelCount: workflow.models?.length || 0,
	lastModified: workflow.extra?.info?.modified,
	fileSize,
});

const getNodeTypeInfo = (nodeType: string): ComfyNodeTypeInfo =>
	NODE_TYPE_MAPPINGS[nodeType] || {
		category: ComfyNodeCategory.UNKNOWN,
		displayName: nodeType,
		color: '#6b7280',
		description: 'Unknown node type',
	};

const groupNodesByCategory = (workflow: ComfyWorkflow): Record<ComfyNodeCategory, typeof workflow.nodes> => {
	const groups = Object.values(ComfyNodeCategory).reduce(
		(acc, category) => {
			acc[category] = [] as typeof workflow.nodes;
			return acc;
		},
		{} as Record<ComfyNodeCategory, typeof workflow.nodes>
	);

	for (const node of workflow.nodes) {
		const typeInfo = getNodeTypeInfo(node.type);
		groups[typeInfo.category].push(node);
	}

	return groups;
};

const calculateComplexity = (
	workflow: ComfyWorkflow
): { score: number; level: 'simple' | 'medium' | 'complex' | 'advanced' } => {
	const nodeCount = workflow.nodes.length;
	const linkCount = workflow.links?.length || 0;
	const groupCount = workflow.groups?.length || 0;

	const score = nodeCount * 1 + linkCount * 0.5 + groupCount * 2;

	let level: 'simple' | 'medium' | 'complex' | 'advanced';
	if (score <= 10) level = 'simple';
	else if (score <= 25) level = 'medium';
	else if (score <= 50) level = 'complex';
	else level = 'advanced';

	return { score, level };
};

const extractRequiredModels = (workflow: ComfyWorkflow): string[] => {
	const models = new Set<string>();

	if (workflow.models) {
		for (const model of workflow.models) models.add(model.name);
	}

	for (const node of workflow.nodes) {
		if (node.widgets_values && Array.isArray(node.widgets_values)) {
			for (const value of node.widgets_values) {
				if (
					typeof value === 'string' &&
					value.includes('.') &&
					(value.endsWith('.safetensors') || value.endsWith('.ckpt') || value.endsWith('.pt') || value.endsWith('.bin'))
				) {
					models.add(value);
				}
			}
		}
	}

	return Array.from(models);
};

const createExecutionContext = (workflowId: string): WorkflowExecutionContext => ({
	workflowId,
	status: 'idle',
	progress: 0,
	errors: [],
});

const validateWorkflowForExecution = (
	workflow: ComfyWorkflow
): { isValid: boolean; errors: string[]; warnings: string[] } => {
	const errors: string[] = [];
	const warnings: string[] = [];

	const nodeTypes = workflow.nodes.map((node) => node.type);

	if (!nodeTypes.includes('CheckpointLoaderSimple')) {
		errors.push('Missing CheckpointLoaderSimple node - workflow cannot run without a model');
	}

	if (!nodeTypes.some((type) => type.includes('Sampler'))) {
		errors.push('Missing sampler node - workflow needs a sampling method');
	}

	const hasOutput = nodeTypes.includes('SaveImage') || nodeTypes.includes('PreviewImage');
	if (!hasOutput) {
		warnings.push('No output node found - workflow may not produce visible results');
	}

	if (!workflow.links || workflow.links.length === 0) {
		warnings.push('No connections found - nodes may not be properly linked');
	}

	return { isValid: errors.length === 0, errors, warnings };
};

const parseWorkflowFromString = (json: string, sourceName = 'inline'): WorkflowWithStats | null => {
	try {
		const obj: unknown = JSON.parse(json);
		return parseWorkflowFromObject(obj as ComfyWorkflow, sourceName, json);
	} catch {
		return null;
	}
};

const parseWorkflowFromObject = (
	workflow: ComfyWorkflow,
	sourceName = 'inline',
	rawJson?: string
): WorkflowWithStats | null => {
	try {
		if (!isValidComfyWorkflow(workflow)) throw new Error('Invalid ComfyUI workflow structure');

		const fileSize = rawJson ? new TextEncoder().encode(rawJson).length : 0;
		const stats = calculateWorkflowStats(workflow, fileSize);

		const now = new Date();
		const idSeed = `${sourceName}:${now.getTime()}:${Math.random()}`;
		const id = generateWorkflowId(idSeed);
		const fileName = extractFileName(sourceName);

		const workflowWithStats: WorkflowWithStats = {
			...workflow,
			id,
			filePath: sourceName,
			fileName,
			stats,
			createdAt: now,
			updatedAt: now,
		};

		return workflowWithStats;
	} catch {
		return null;
	}
};

const scanDirectoryForWorkflows = async (_directoryPath: string): Promise<WorkflowWithStats[]> => {
	throw new Error('scanDirectoryForWorkflows no está disponible en el navegador');
};

const parseWorkflowFile = async (_filePath: string): Promise<WorkflowWithStats | null> => {
	throw new Error('parseWorkflowFile no está disponible en el navegador');
};

// API pública con el mismo nombre utilizado por el resto del código
export const ComfyUIWorkflowService = {
	// parseo (browser)
	parseWorkflowFromString,
	parseWorkflowFromObject,

	// validación y análisis
	isValidComfyWorkflow,
	calculateWorkflowStats,
	getNodeTypeInfo,
	groupNodesByCategory,
	calculateComplexity,
	extractRequiredModels,
	createExecutionContext,
	validateWorkflowForExecution,

	// utilidades
	generateWorkflowId,
	extractFileName,

	// stubs Node-only
	scanDirectoryForWorkflows,
	parseWorkflowFile,
};
