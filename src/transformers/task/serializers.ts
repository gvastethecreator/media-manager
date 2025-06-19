/**
 * @file Serializadores para la entidad Task - DESHABILITADO
 * @module transformers/task/serializers
 * @deprecated El modelo Task no existe en el esquema Prisma actual
 */

// ❌ ARCHIVO DESHABILITADO - NO EXISTE MODELO TASK EN PRISMA
// TODO: Implementar modelo Task en Prisma si es necesario

export function fromPrismaTask(_prismaTask: any): never {
	throw new Error('❌ Task serializers deshabilitado - No existe modelo Task en Prisma');
}

export function toExtendedTask(_task: any, _options: any = {}): never {
	throw new Error('❌ Task serializers deshabilitado - No existe modelo Task en Prisma');
}
