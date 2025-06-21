// Serializers para Workflow
import type { Workflow } from '@/types/entities/workflow';
import { workflowSchema } from '@/types/entities/workflow/workflow.schema';

export function validateWorkflow(input: unknown): Workflow {
	return workflowSchema.parse(input) as Workflow;
}
