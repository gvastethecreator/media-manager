/**
 * Utilidad para validar estructuras de datos y detectar problemas con tipos
 */

/**
 * Valida si un objeto tiene las propiedades requeridas
 * @param obj Objeto a validar
 * @param requiredProps Lista de propiedades requeridas
 * @returns Resultado de la validación y mensajes de error
 */
export function validateRequiredProps(
  obj: any,
  requiredProps: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj) {
    return { isValid: false, errors: ['El objeto es null o undefined'] };
  }

  for (const prop of requiredProps) {
    if (obj[prop] === undefined) {
      errors.push(`Falta la propiedad requerida "${prop}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica si un objeto puede ser utilizado como una entidad de un tipo específico
 * @param obj Objeto a verificar
 * @param entityType Tipo de entidad esperado
 * @returns Resultado de la verificación y mensajes de problema
 */
export function validateEntityType(
  obj: any,
  entityType: string
): { isValid: boolean; messages: string[] } {
  const messages: string[] = [];

  // Propiedades base que todas las entidades deben tener
  const baseProps = ['id', 'name'];
  const { isValid: hasBaseProps, errors: baseErrors } = validateRequiredProps(obj, baseProps);

  if (!hasBaseProps) {
    messages.push(...baseErrors);
  }

  // Validaciones específicas por tipo de entidad
  switch (entityType) {
    case 'folder':
      if (obj._count === undefined && obj.imageCount === undefined) {
        messages.push('Folder requiere _count.images o imageCount');
      }
      break;

    case 'album':
      if (obj._count === undefined) {
        messages.push('Album requiere _count.images');
      }
      if (!obj.createdAt) {
        messages.push('Album requiere createdAt');
      }
      break;

    case 'tag':
      // Tags requieren un nombre y opcionalmente color
      break;

    case 'character':
      if (obj.stats !== undefined) {
        if (typeof obj.stats === 'string') {
          try {
            JSON.parse(obj.stats);
          } catch (e) {
            messages.push('Character.stats es un string pero no es JSON válido');
          }
        } else if (typeof obj.stats !== 'object') {
          messages.push('Character.stats debe ser un objeto o un string JSON');
        }
      }
      break;

    case 'prompt':
      if (obj.tags !== undefined) {
        if (!Array.isArray(obj.tags) && typeof obj.tags !== 'string') {
          messages.push('Prompt.tags debe ser un array o un string');
        }
      }
      if (obj._count === undefined) {
        messages.push('Prompt requiere _count.uses o similares');
      }
      break;
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}

/**
 * Normaliza los datos de una entidad para asegurar compatibilidad
 * @param entity La entidad a normalizar
 * @param entityType El tipo de entidad
 * @returns Entidad normalizada con valores por defecto donde sea necesario
 */
export function normalizeEntityData(entity: any, entityType: string): any {
  if (!entity) return {};

  // Crear una copia para no modificar el original
  const normalizedEntity = { ...entity };

  // Asegurar que propiedades base existan
  normalizedEntity.id = normalizedEntity.id || `temp-${Date.now()}`;
  normalizedEntity.name = normalizedEntity.name || 'Sin nombre';
  normalizedEntity.description = normalizedEntity.description || '';

  // Normalizar propiedades específicas por tipo
  switch (entityType) {
    case 'folder':
      // Asegurar que _count existe
      if (!normalizedEntity._count) {
        normalizedEntity._count = {
          images: normalizedEntity.imageCount || 0
        };
      }
      break;

    case 'album':
      // Asegurar que _count existe
      if (!normalizedEntity._count) {
        normalizedEntity._count = {
          images: normalizedEntity.imageCount || 0
        };
      }
      // Asegurar que createdAt es una fecha
      if (normalizedEntity.createdAt && !(normalizedEntity.createdAt instanceof Date)) {
        try {
          normalizedEntity.createdAt = new Date(normalizedEntity.createdAt);
        } catch (e) {
          normalizedEntity.createdAt = new Date();
        }
      } else if (!normalizedEntity.createdAt) {
        normalizedEntity.createdAt = new Date();
      }
      break;

    case 'character':
      // Normalizar stats si es un string JSON
      if (typeof normalizedEntity.stats === 'string') {
        try {
          normalizedEntity.stats = JSON.parse(normalizedEntity.stats);
        } catch (e) {
          // Si no podemos parsear, crear objeto vacío
          normalizedEntity.stats = {};
        }
      } else if (normalizedEntity.stats === undefined) {
        normalizedEntity.stats = {};
      }
      break;

    case 'prompt':
      // Normalizar tags
      if (typeof normalizedEntity.tags === 'string') {
        // Convertir string a array, dividiendo por comas o manteniendo como único ítem
        normalizedEntity.tags = normalizedEntity.tags.includes(',')
          ? normalizedEntity.tags.split(',').map((t: string) => t.trim())
          : [normalizedEntity.tags];
      } else if (!normalizedEntity.tags) {
        normalizedEntity.tags = [];
      }

      // Asegurar que _count existe
      if (!normalizedEntity._count) {
        normalizedEntity._count = { uses: 0 };
      }
      break;
  }

  return normalizedEntity;
}

/**
 * Registra mensajes de diagnóstico sobre la entidad durante el desarrollo
 * @param entity La entidad a diagnosticar
 * @param entityType Tipo de entidad
 * @param componentName Nombre del componente para los logs
 */
export function debugEntityData(entity: any, entityType: string, componentName: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.group(`🔍 [${componentName}] Diagnóstico de datos para ${entityType}`);

  // Validar la entidad
  const validation = validateEntityType(entity, entityType);
  if (!validation.isValid) {
    console.warn('⚠️ Problemas encontrados:', validation.messages);
  } else {
    console.log('✅ La entidad pasa la validación básica');
  }

  // Mostrar resumen de propiedades importantes
  const keys = Object.keys(entity || {});
  console.log(`📊 Propiedades (${keys.length}):`, keys);

  // Verificar tipos específicos problemáticos
  checkProblemTypes(entity, entityType);

  console.groupEnd();
}

/**
 * Verifica tipos que comúnmente causan problemas
 */
function checkProblemTypes(entity: any, entityType: string): void {
  try {
    // Verificar _count
    if (entity._count) {
      console.log(`_count: ${JSON.stringify(entity._count)}`);
    } else if (entity.imageCount !== undefined) {
      console.log(`imageCount: ${entity.imageCount}`);
    }

    // Verificar createdAt
    if (entity.createdAt) {
      console.log(`createdAt: ${entity.createdAt instanceof Date ? 'Date object' : typeof entity.createdAt}`);
    }

    // Verificar tipos específicos
    switch (entityType) {
      case 'character':
        if (entity.stats) {
          console.log(`stats: ${typeof entity.stats}`, entity.stats);
        }
        break;
      case 'prompt':
        if (entity.tags) {
          console.log(`tags: ${typeof entity.tags}`, entity.tags);
        }
        break;
    }
  } catch (e) {
    console.error('Error al verificar tipos:', e);
  }
}