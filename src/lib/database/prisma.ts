/**
 * @file Instancia única del cliente de Prisma
 * @module lib/prisma
 * @description Centraliza la creación del cliente de Prisma para evitar múltiples instancias.
 * En un entorno de desarrollo, la variable global se usa para preservar el cliente
 * a través de las recargas en caliente de Next.js.
 * En producción, se crea una nueva instancia.
 *
 * Este enfoque es una solución temporal para compatibilidad con servicios que no
 * están diseñados para instanciación asíncrona. El enfoque recomendado es
 * usar `getPrismaClient` de `@/lib/db`.
 */
import { PrismaClient } from '@prisma/client';

// Evitar múltiples instancias de PrismaClient en desarrollo
declare const global: {
	prisma?: PrismaClient;
};

export const prisma =
	global.prisma ||
	new PrismaClient({
		log: ['query', 'info', 'warn', 'error'],
	});

if (process.env.NODE_ENV !== 'production') {
	global.prisma = prisma;
}
