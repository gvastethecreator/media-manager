/**
 * Categorías disponibles para prompts
 */
export enum PromptCategory {
	GENERAL = 'general',
	TEXT = 'text',
	IMAGE = 'image',
	AUDIO = 'audio',
	VIDEO = 'video',
	CODE = 'code',
	CHAT = 'chat',
	WORLDBUILDING = 'worldbuilding',
	CHARACTER = 'character',
	SETTING = 'setting',
	STORY = 'story',
	CREATIVE = 'creative',
	ASSISTANT = 'assistant',
	SYSTEM = 'system',
	UNCLASSIFIED = 'unclassified',
	OTHER = 'other',
}

/**
 * Modelos de IA disponibles para prompts
 */
export enum PromptModel {
	GPT_3_5 = 'gpt-3.5-turbo',
	GPT_4 = 'gpt-4',
	GPT4_VISION = 'gpt-4-vision',
	GPT_4_TURBO = 'gpt-4-turbo',
	CLAUDE_INSTANT = 'claude-instant',
	CLAUDE_2 = 'claude-2',
	CLAUDE_3_OPUS = 'claude-3-opus',
	CLAUDE_3_SONNET = 'claude-3-sonnet',
	CLAUDE_3_HAIKU = 'claude-3-haiku',
	LLAMA_3_8B = 'llama-3-8b',
	LLAMA_3_70B = 'llama-3-70b',
	GEMINI_PRO = 'gemini-pro',
	GEMINI_FLASH = 'gemini-flash',
	MISTRAL_7B = 'mistral-7b',
	CUSTOM = 'custom',
}

/**
 * Estado de un prompt
 */
export enum PromptStatus {
	DRAFT = 'draft',
	ACTIVE = 'active',
	ARCHIVED = 'archived',
}

/**
 * Tipo de vista para los prompts
 */
export enum PromptViewMode {
	GRID = 'grid',
	LIST = 'list',
	COMPACT = 'compact',
	DETAILED = 'detailed',
}

/**
 * Opciones de ordenación para prompts
 */
export enum PromptSortOption {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	CREATED_ASC = 'created_asc',
	CREATED_DESC = 'created_desc',
	UPDATED_ASC = 'updated_asc',
	UPDATED_DESC = 'updated_desc',
	CATEGORY_ASC = 'category_asc',
	CATEGORY_DESC = 'category_desc',
	FAVORITES_FIRST = 'favorites_first',
}

/**
 * Criterios de ordenación para prompts
 */
export enum PromptSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	CREATED_AT_ASC = 'createdAt_asc',
	CREATED_AT_DESC = 'createdAt_desc',
	UPDATED_AT_ASC = 'updatedAt_asc',
	UPDATED_AT_DESC = 'updatedAt_desc',
	CATEGORY_ASC = 'category_asc',
	CATEGORY_DESC = 'category_desc',
	FAVORITES_FIRST = 'favorites_first',
}

/**
 * Eventos relacionados con prompts
 */
export const PROMPT_EVENTS = {
	PROMPT_CREATED: 'prompt:created',
	PROMPT_UPDATED: 'prompt:updated',
	PROMPT_DELETED: 'prompt:deleted',
	PROMPT_LINKED: 'prompt:linked',
	PROMPT_UNLINKED: 'prompt:unlinked',
	PROMPT_EXECUTED: 'prompt:executed',
} as const;
