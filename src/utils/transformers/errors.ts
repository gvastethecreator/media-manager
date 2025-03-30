/**
 * 🚨 Error base para transformers
 */
export class TransformerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransformerError';
  }
}

/**
 * 🔍 Error de validación
 */
export class ValidationError extends TransformerError {
  constructor(message: string, public fields?: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 🔄 Error de serialización
 */
export class SerializationError extends TransformerError {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'SerializationError';
  }
}

/**
 * 🎯 Error de mapeo
 */
export class MappingError extends TransformerError {
  constructor(message: string, public source?: unknown) {
    super(message);
    this.name = 'MappingError';
  }
}

/**
 * 🔗 Error de relación
 */
export class RelationError extends TransformerError {
  constructor(message: string, public relation?: string) {
    super(message);
    this.name = 'RelationError';
  }
}

/**
 * 📝 Error de tipo
 */
export class TypeMismatchError extends TransformerError {
  constructor(message: string, public expectedType?: string, public receivedType?: string) {
    super(message);
    this.name = 'TypeMismatchError';
  }
}

/**
 * 🔍 Error de búsqueda
 */
export class SearchError extends TransformerError {
  constructor(message: string, public filters?: unknown) {
    super(message);
    this.name = 'SearchError';
  }
}

/**
 * 🎨 Error de UI
 */
export class UIError extends TransformerError {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'UIError';
  }
}

/**
 * 📊 Error de metadata
 */
export class MetadataError extends TransformerError {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'MetadataError';
  }
}

/**
 * 🔄 Función helper para manejar errores
 */
export function handleTransformerError(error: unknown): TransformerError {
  if (error instanceof TransformerError) {
    return error;
  }

  if (error instanceof Error) {
    return new TransformerError(error.message);
  }

  return new TransformerError('Error desconocido en el transformer');
}