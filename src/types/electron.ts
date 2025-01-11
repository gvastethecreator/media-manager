/**
 * Tipos para la API de Electron
 * Estas interfaces definen los métodos disponibles a través del puente entre Electron y el renderer
 */

export interface ElectronAPI {
  // Operaciones de archivos
  openPath: (path: string) => Promise<void>;
  downloadFile: (path: string) => Promise<void>;
  copyFile: (path: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;

  // Operaciones del sistema
  getPath: (name: string) => Promise<string>;
  getAppPath: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getVersion: () => Promise<string>;

  // Operaciones de ventana
  quit: () => Promise<void>;
  reload: () => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  close: () => Promise<void>;

  // Eventos del sistema
  onFileChange: (callback: (event: any) => void) => void;
  onError: (callback: (error: Error) => void) => void;
}