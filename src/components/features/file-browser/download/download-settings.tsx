/**
 * Download Settings Component
 * 
 * This component provides a settings panel for configuring download preferences.
 * Users can set default options for format, quality, compression, and behavior.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Settings, 
  Save, 
  RotateCcw,
  HelpCircle,
  FolderOpen,
  Zap,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface DownloadSettings {
  // Format settings
  defaultFormat: 'original' | 'zip' | 'pdf';
  autoZipThreshold: number; // Number of files to auto-zip
  
  // Quality settings
  defaultQuality: 'original' | 'high' | 'medium' | 'low';
  compressionLevel: number; // 0-9
  
  // Behavior settings
  showProgress: boolean;
  maxConcurrentDownloads: number;
  autoRetryFailed: boolean;
  retryAttempts: number;
  
  // Storage settings
  defaultDownloadPath: string;
  organizeByDate: boolean;
  organizeByType: boolean;
  
  // Performance settings
  enableBatchOptimization: boolean;
  chunkSize: number; // KB
  timeoutDuration: number; // seconds
}

const defaultSettings: DownloadSettings = {
  defaultFormat: 'original',
  autoZipThreshold: 5,
  defaultQuality: 'original',
  compressionLevel: 6,
  showProgress: true,
  maxConcurrentDownloads: 3,
  autoRetryFailed: true,
  retryAttempts: 3,
  defaultDownloadPath: '',
  organizeByDate: false,
  organizeByType: false,
  enableBatchOptimization: true,
  chunkSize: 1024,
  timeoutDuration: 30
};

interface DownloadSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: DownloadSettings) => void;
}

export function DownloadSettingsComponent({
  isOpen,
  onClose,
  onSave
}: DownloadSettingsProps) {
  const [settings, setSettings] = useState<DownloadSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'format' | 'behavior' | 'storage' | 'performance'>('format');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('downloadSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading download settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof DownloadSettings>(
    key: K,
    value: DownloadSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('downloadSettings', JSON.stringify(settings));
      onSave?.(settings);
      setHasChanges(false);
      toast.success('Configuración de descarga guardada');
    } catch (error) {
      console.error('Error saving download settings:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info('Configuración restablecida a valores predeterminados');
  };

  const selectDownloadPath = async () => {
    try {
      // Use the File System Access API if available
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        updateSetting('defaultDownloadPath', dirHandle.name);
        toast.success('Carpeta de descarga seleccionada');
      } else {
        toast.info('Selección de carpeta no disponible en este navegador');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error selecting download path:', error);
        toast.error('Error al seleccionar la carpeta');
      }
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'format' as const, label: 'Formato', icon: Download },
    { id: 'behavior' as const, label: 'Comportamiento', icon: Settings },
    { id: 'storage' as const, label: 'Almacenamiento', icon: FolderOpen },
    { id: 'performance' as const, label: 'Rendimiento', icon: Zap }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configuración de Descarga
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm rounded">
                Cambios sin guardar
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-8rem)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Format Tab */}
            {activeTab === 'format' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Formato predeterminado
                  </label>
                  <select
                    value={settings.defaultFormat}
                    onChange={(e) => updateSetting('defaultFormat', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="original">Original</option>
                    <option value="zip">ZIP</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auto-ZIP cuando hay más de {settings.autoZipThreshold} archivos
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={settings.autoZipThreshold}
                    onChange={(e) => updateSetting('autoZipThreshold', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2</span>
                    <span>{settings.autoZipThreshold}</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calidad predeterminada
                  </label>
                  <select
                    value={settings.defaultQuality}
                    onChange={(e) => updateSetting('defaultQuality', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="original">Original</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nivel de compresión: {settings.compressionLevel}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={settings.compressionLevel}
                    onChange={(e) => updateSetting('compressionLevel', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Rápido</span>
                    <span>Balanceado</span>
                    <span>Máximo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Behavior Tab */}
            {activeTab === 'behavior' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mostrar progreso de descarga
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Muestra una barra de progreso durante las descargas
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showProgress}
                    onChange={(e) => updateSetting('showProgress', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descargas concurrentes máximas: {settings.maxConcurrentDownloads}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.maxConcurrentDownloads}
                    onChange={(e) => updateSetting('maxConcurrentDownloads', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reintentar descargas fallidas automáticamente
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reintenta automáticamente las descargas que fallan
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoRetryFailed}
                    onChange={(e) => updateSetting('autoRetryFailed', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                {settings.autoRetryFailed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Intentos de reintento: {settings.retryAttempts}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.retryAttempts}
                      onChange={(e) => updateSetting('retryAttempts', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>{settings.retryAttempts}</span>
                      <span>10</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Carpeta de descarga predeterminada
                  </label>
                  <input
                    type="text"
                    value={settings.defaultDownloadPath}
                    onChange={(e) => updateSetting('defaultDownloadPath', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="/Downloads"
                  />
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamaño de chunk para descarga: {settings.chunkSize} KB
                  </label>
                  <input
                    type="range"
                    min="64"
                    max="1024"
                    step="64"
                    value={settings.chunkSize}
                    onChange={(e) => updateSetting('chunkSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>64 KB</span>
                    <span>{settings.chunkSize} KB</span>
                    <span>1024 KB</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Restablecer valores predeterminados
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};