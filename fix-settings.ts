/**
 * Función para crear errores de configuración (enfoque funcional)
 */
function createSettingsError(
  message: string,
  code?: string,
  cause?: unknown
): SettingsErrorData {
  return {
    name: 'SettingsError',
    message,
    code,
    cause
  };
}