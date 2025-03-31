/**
 * @file Transformadores para datos de configuración
 * @module transformers/settings
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { Language, Settings, ThemeMode } from '@/types/settings';
import { handleTransformerError } from '@/utils/transformers/errors';
import { mappers, serializers } from './internal';

const logger = serverLogger.withContext('SettingsTransformer');

/**
 * Transforma los datos raw de configuración a una estructura tipada
 */
export function deserializeSettings(rawData: Record<string, unknown>): Settings {
  return {
    appearance: {
      theme: (rawData.theme as ThemeMode) || 'system',
      fontSize: (rawData.fontSize as number) || 16,
      language: (rawData.language as Language) || 'es',
      reducedAnimations: Boolean(rawData.reducedAnimations),
      highContrast: Boolean(rawData.highContrast),
    },
    notifications: {
      enabled: rawData.notificationsEnabled !== false,
      email: Boolean(rawData.emailNotifications),
      desktop: Boolean(rawData.desktopNotifications),
      frequency: (rawData.notificationFrequency as string) || 'daily',
    },
    privacy: {
      shareUsageData: Boolean(rawData.shareUsageData),
      storeCookies: Boolean(rawData.storeCookies),
      storeHistory: Boolean(rawData.storeHistory),
    },
    advanced: {
      apiKey: (rawData.apiKey as string) || null,
      devMode: Boolean(rawData.devMode),
      experimentalFeatures: Boolean(rawData.experimentalFeatures),
    },
  };
}

/**
 * Transforma la estructura tipada de configuración a un formato raw
 */
export function serializeSettings(settings: Settings): Record<string, unknown> {
  return {
    theme: settings.appearance.theme,
    fontSize: settings.appearance.fontSize,
    language: settings.appearance.language,
    reducedAnimations: settings.appearance.reducedAnimations,
    highContrast: settings.appearance.highContrast,

    notificationsEnabled: settings.notifications.enabled,
    emailNotifications: settings.notifications.email,
    desktopNotifications: settings.notifications.desktop,
    notificationFrequency: settings.notifications.frequency,

    shareUsageData: settings.privacy.shareUsageData,
    storeCookies: settings.privacy.storeCookies,
    storeHistory: settings.privacy.storeHistory,

    apiKey: settings.advanced.apiKey,
    devMode: settings.advanced.devMode,
    experimentalFeatures: settings.advanced.experimentalFeatures,
  };
}

/**
 * Fusiona dos objetos de configuración, priorizando los valores del segundo
 */
export function mergeSettings(base: Settings, override: Partial<Settings>): Settings {
  return {
    appearance: {
      ...base.appearance,
      ...override.appearance,
    },
    notifications: {
      ...base.notifications,
      ...override.notifications,
    },
    privacy: {
      ...base.privacy,
      ...override.privacy,
    },
    advanced: {
      ...base.advanced,
      ...override.advanced,
    },
  };
}

/**
 * Verifica si hay diferencias entre dos objetos de configuración
 */
export function hasSettingsChanged(oldSettings: Settings, newSettings: Settings): boolean {
  // Comparar appearance
  if (
    oldSettings.appearance.theme !== newSettings.appearance.theme ||
    oldSettings.appearance.fontSize !== newSettings.appearance.fontSize ||
    oldSettings.appearance.language !== newSettings.appearance.language ||
    oldSettings.appearance.reducedAnimations !== newSettings.appearance.reducedAnimations ||
    oldSettings.appearance.highContrast !== newSettings.appearance.highContrast
  ) {
    return true;
  }

  // Comparar notifications
  if (
    oldSettings.notifications.enabled !== newSettings.notifications.enabled ||
    oldSettings.notifications.email !== newSettings.notifications.email ||
    oldSettings.notifications.desktop !== newSettings.notifications.desktop ||
    oldSettings.notifications.frequency !== newSettings.notifications.frequency
  ) {
    return true;
  }

  // Comparar privacy
  if (
    oldSettings.privacy.shareUsageData !== newSettings.privacy.shareUsageData ||
    oldSettings.privacy.storeCookies !== newSettings.privacy.storeCookies ||
    oldSettings.privacy.storeHistory !== newSettings.privacy.storeHistory
  ) {
    return true;
  }

  // Comparar advanced
  if (
    oldSettings.advanced.apiKey !== newSettings.advanced.apiKey ||
    oldSettings.advanced.devMode !== newSettings.advanced.devMode ||
    oldSettings.advanced.experimentalFeatures !== newSettings.advanced.experimentalFeatures
  ) {
    return true;
  }

  return false;
}

/**
 * Transforma los datos de configuración de Prisma a su formato para la interfaz de usuario
 */
export async function fromPrismaSettings<T>(settingsData: T): Promise<T> {
  try {
    return serializers.fromPrismaSettings(settingsData);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Transforma los datos de configuración de la interfaz de usuario a su formato para Prisma
 */
export async function toPrismaSettings<T>(settingsData: T): Promise<T> {
  try {
    return serializers.toPrismaSettings(settingsData);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Deserializa campos JSON en la configuración
 */
export function deserializeSettingsJson<T>(settingsData: T): T {
  try {
    return serializers.deserializeSettingsJson(settingsData);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Serializa campos a JSON en la configuración
 */
export function serializeSettingsJson<T>(settingsData: T): T {
  try {
    return serializers.serializeSettingsJson(settingsData);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Valida los datos de configuración
 */
export function validateSettings<T>(settingsData: T): T {
  try {
    return serializers.validateSettings(settingsData);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

/**
 * Mapea los datos de configuración para actualizar en Prisma
 */
export function mapSettingsUpdateToPrisma<T, U>(updateData: T): U {
  try {
    return mappers.mapSettingsUpdateToPrisma(updateData);
  } catch (error) {
    throw handleTransformerError(error);
  }
}

// Compatibilidad para código existente
export const SettingsTransformer = {
  fromPrisma: fromPrismaSettings,
  toPrisma: toPrismaSettings,
  deserializeJson: deserializeSettingsJson,
  serializeJson: serializeSettingsJson,
  validate: validateSettings,
  mapUpdateToPrisma: mapSettingsUpdateToPrisma
};