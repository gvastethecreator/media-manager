import type { Group } from '@prisma/client';
import { z } from 'zod';

export interface GroupCount {
  images: number;
  videos: number;
  albums: number;
  collections: number;
  tags: number;
  characters: number;
  places: number;
  worldItems: number;
  concepts: number;
  prompts: number;
  notes: number;
  wildcards: number;
  properties: number;
}

export interface GroupWithStats extends Group {
  _count: GroupCount;
}

export type GroupSortKey = 'name' | 'category' | 'createdAt';

// Validación de filtros con zod
export const groupFilterSchema = z.object({
  type: z.enum(['tag', 'character', 'place', 'concept', 'worldItem']),
  operator: z.enum(['AND', 'OR', 'NOT']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  field: z.string().optional(),
});

export type GroupFilter = z.infer<typeof groupFilterSchema>;

// Validación del grupo completo
export const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  emoji: z.string(),
  color: z.string(),
  category: z.string().nullable(),
  shortcut: z.string().nullable(),
  sortBy: z.string().nullable(),
  filters: z.string(), // JSON string de GroupFilter[]
  isFavorite: z.boolean(),
  featuredImage: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});