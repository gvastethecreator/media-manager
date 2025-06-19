// Mappers para Workflow
import type { Workflow } from '@/types/entities/workflow';

export function fromPrismaWorkflow(prisma: any): Workflow {
	return {
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		content: prisma.content,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
	};
}

export function toPrismaWorkflow(workflow: Workflow): any {
	return {
		id: workflow.id,
		name: workflow.name,
		filePath: workflow.filePath,
		content: workflow.content,
		createdAt: workflow.createdAt,
		updatedAt: workflow.updatedAt,
	};
}
