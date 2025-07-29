/**
 * Download Options Dialog Component
 * 
 * This component provides a dialog for users to configure download options
 * including format, quality, compression, and other advanced settings.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Settings, Archive, FileText, Image } from 'lucide-react';
import { toastService } from '@/lib/ui/toast';
import { enhancedDownloadService } from '@/services/download/download.service';
import type { FileItem } from '@/types/files';
import type { DownloadFormat, DownloadQuality, DownloadOptions } from '@/services/download/download.service';

interface DownloadOptionsDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function to close the dialog */
  onClose: () => void;
  /** Files to download */
  files: FileItem[];
  /** Callback when download starts */
  onDownloadStart?: () => void;
}

interface DownloadFormData {
  format: DownloadFormat;
  quality: DownloadQuality;
  compress: boolean;
  compressionLevel: number;
  batchOptimization: boolean;
  showProgress: boolean;
  maxConcurrent: number;
}

const formatOptions: Array<{ value: DownloadFormat; label: string; icon: React.ReactNode; description: string }> = [
  {
    value: 'original',
    label: 'Original',
    icon: <Image className="w-4 h-4" />,
    description: 'Descargar archivos en su formato original'
  },
  {
    value: 'zip',
    label: 'ZIP Archive',
    icon: <Archive className="w-4 h-4" />,
    description: 'Comprimir archivos en un archivo ZIP'
  },
  {
    value: 'pdf',
    label: 'PDF (solo imágenes)',
    icon: <FileText className="w-4 h-4" />,
    description: 'Convertir imágenes a formato PDF'
  }
];

const qualityOptions: Array<{ value: DownloadQuality; label: string; description: string }> = [
  { value: 'original', label: 'Original', description: 'Calidad original sin compresión' },
  { value: 'high', label: 'Alta', description: 'Alta calidad con compresión mínima' },
  { value: 'medium', label: 'Media', description: 'Calidad media, buen balance' },
  { value: 'low', label: 'Baja', description: 'Calidad baja, archivos más pequeños' }
];

export function DownloadOptionsDialog({
  isOpen,
  onClose,
  files,
  onDownloadStart
}: DownloadOptionsDialogProps) {
  const [formData, setFormData] = useState<DownloadFormData>({
    format: 'original',
    quality: 'original',
    compress: false,
    compressionLevel: 6,
    batchOptimization: files.length > 5,
    showProgress: true,
    maxConcurrent: 3
  });
  
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (files.length === 0) {
      toastService.error('No hay archivos para descargar');
      return;
    }

    setIsDownloading(true);
    onDownloadStart?.();

    try {
      const downloadOptions: DownloadOptions = {
        format: formData.format,
        quality: formData.quality,
        compress: formData.compress,
        compressionLevel: formData.compressionLevel,
        batchOptimization: formData.batchOptimization,
        showProgress: formData.showProgress,
        maxConcurrent: formData.maxConcurrent
      };

      if (files.length === 1) {
        // Single file download
        const file = files[0];
        const downloadItem = {
          id: file.id,
          name: file.name,
          path: 'path' in file ? (file as any).path : ''
        };
        
        await enhancedDownloadService.downloadFile(downloadItem, downloadOptions);
      } else {
        // Multiple files download
        const downloadItems = files.map(file => ({
          id: file.id,
          name: file.name,
          path: 'path' in file ? (file as any).path : ''
        }));
        
        await enhancedDownloadService.downloadMultipleFiles(downloadItems, downloadOptions);
      }

      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toastService.error(`Error al descargar: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const updateFormData = (updates: Partial<DownloadFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  };

  const hasImages = files.some(file => isImageFile(file.name));
  const availableFormats = formatOptions.filter(format => 
    format.value !== 'pdf' || hasImages
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Opciones de Descarga
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Formato de Descarga
                  </label>
                  <div className="space-y-2">
                    {availableFormats.map((format) => (
                      <label
                        key={format.value}
                        className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={formData.format === format.value}
                          onChange={(e) => updateFormData({ format: e.target.value as DownloadFormat })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {format.icon}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {format.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quality Selection (for images) */}
                {hasImages && formData.format === 'original' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Calidad de Imagen
                    </label>
                    <select
                      value={formData.quality}
                      onChange={(e) => updateFormData({ quality: e.target.value as DownloadQuality })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {qualityOptions.map((quality) => (
                        <option key={quality.value} value={quality.value}>
                          {quality.label} - {quality.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Advanced Options */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Opciones Avanzadas
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Batch Optimization */}
                    {files.length > 1 && (
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.batchOptimization}
                          onChange={(e) => updateFormData({ batchOptimization: e.target.checked })}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Optimización por lotes
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Crear archivo ZIP para múltiples archivos
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Show Progress */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.showProgress}
                        onChange={(e) => updateFormData({ showProgress: e.target.checked })}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Mostrar progreso
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Mostrar barra de progreso durante la descarga
                        </p>
                      </div>
                    </label>

                    {/* Max Concurrent Downloads */}
                    {files.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descargas simultáneas: {formData.maxConcurrent}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.maxConcurrent}
                          onChange={(e) => updateFormData({ maxConcurrent: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>1</span>
                          <span>5</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  disabled={isDownloading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Descargar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}