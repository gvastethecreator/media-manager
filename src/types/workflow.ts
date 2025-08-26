/**
 * ComfyUI Workflow v1.0 Type Definitions
 * Based on https://docs.comfy.org/specs/workflow_json
 */

export interface ComfyPosition {
	0: number;
	1: number;
}

export interface ComfySize {
	0: number;
	1: number;
}

export interface ComfyNodeFlags {
	collapsed?: boolean;
	pinned?: boolean;
	allow_interaction?: boolean;
	horizontal?: boolean;
	skip_repeated_outputs?: boolean;
}

export interface ComfyNodeInput {
	name: string;
	type: string | string[] | number;
	link?: number | null;
	slot_index?: number | string;
}

export interface ComfyNodeOutput {
	name: string;
	type: string | string[] | number;
	links?: number[] | null;
	slot_index?: number | string;
}

export interface ComfyNode {
	id: number | string;
	type: string;
	pos: ComfyPosition | [number, number];
	size: ComfySize | [number, number];
	flags: ComfyNodeFlags;
	order: number;
	mode: number;
	inputs?: ComfyNodeInput[];
	outputs?: ComfyNodeOutput[];
	properties: {
		'Node name for S&R'?: string;
		[key: string]: any;
	};
	widgets_values?: any[] | Record<string, any>;
	color?: string;
	bgcolor?: string;
}

export interface ComfyLink {
	id: number;
	origin_id: number | string;
	origin_slot: number | string;
	target_id: number | string;
	target_slot: number | string;
	type: string | string[] | number;
	parentId?: number;
}

export interface ComfyGroup {
	title: string;
	bounding: [number, number, number, number];
	color?: string;
	font_size?: number;
	locked?: boolean;
}

export interface ComfyReroute {
	id: number;
	parentId?: number;
	pos: ComfyPosition | [number, number];
	linkIds?: number[] | null;
}

export interface ComfyWorkflowConfig {
	links_ontop?: boolean;
	align_to_grid?: boolean;
	[key: string]: any;
}

export interface ComfyWorkflowState {
	lastGroupid?: number;
	lastNodeId?: number;
	lastLinkId?: number;
	lastRerouteId?: number;
	[key: string]: any;
}

export interface ComfyWorkflowInfo {
	name: string;
	author: string;
	description: string;
	version: string;
	created: string;
	modified: string;
	software: string;
}

export interface ComfyWorkflowExtra {
	ds?: {
		scale: number;
		offset: ComfyPosition | [number, number];
	};
	info?: ComfyWorkflowInfo;
	linkExtensions?: Array<{
		id: number;
		parentId: number;
		[key: string]: any;
	}>;
	reroutes?: ComfyReroute[];
	[key: string]: any;
}

export interface ComfyWorkflowModel {
	name: string;
	url: string;
	hash?: string;
	hash_type?: string;
	directory: string;
}

export interface ComfyWorkflow {
	version: 1;
	config?: ComfyWorkflowConfig | null;
	state: ComfyWorkflowState;
	groups?: ComfyGroup[];
	nodes: ComfyNode[];
	links?: ComfyLink[];
	reroutes?: ComfyReroute[];
	extra?: ComfyWorkflowExtra | null;
	models?: ComfyWorkflowModel[];
}

// Extended types for our application
export interface WorkflowStats {
	nodeCount: number;
	linkCount: number;
	groupCount: number;
	modelCount: number;
	lastModified?: string;
	fileSize?: number;
}

export interface WorkflowWithStats extends ComfyWorkflow {
	id: string;
	filePath: string;
	fileName: string;
	stats: WorkflowStats;
	createdAt: Date;
	updatedAt: Date;
}

// Node type categories for visualization
export enum ComfyNodeCategory {
	INPUT = 'input',
	OUTPUT = 'output',
	PROCESSING = 'processing',
	CONDITIONING = 'conditioning',
	MODEL = 'model',
	SAMPLING = 'sampling',
	LATENT = 'latent',
	IMAGE = 'image',
	UTILS = 'utils',
	UNKNOWN = 'unknown',
}

export interface ComfyNodeTypeInfo {
	category: ComfyNodeCategory;
	displayName: string;
	description?: string;
	color: string;
	icon?: string;
}

// Workflow execution context
export interface WorkflowExecutionContext {
	workflowId: string;
	status: 'idle' | 'running' | 'completed' | 'error';
	progress?: number;
	currentNode?: string;
	startTime?: Date;
	endTime?: Date;
	errors?: string[];
}
