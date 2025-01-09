"use client"

import { useEffect } from 'react'
import { useLoadingStore } from '@/store/loading-store'
import { systemService } from '@/services/system.service'
import { logger } from '@/lib/logger'
import { useFavoritesStore } from '@/store/favorites'
import { useCollectionsStore } from '@/store/collections'
import { useTagsStore } from '@/store/tags'

const initLogger = logger.withContext('Initialization')

interface ServiceInitializer {
  name: string
  init: () => Promise<void>
  dependencies?: string[]
  weight?: number
}

const INITIALIZATION_DELAY = 300
const COMPLETION_DELAY = 500

export function useInitializeApp() {
  const { updateService, setProgress, setInitializing, setReady } = useLoadingStore()
  const { loadFavorites } = useFavoritesStore()
  const { loadCollections } = useCollectionsStore()
  const { loadTags } = useTagsStore()

  useEffect(() => {
    const services: ServiceInitializer[] = [
      {
        name: 'System',
        weight: 10,
        init: async () => {
          updateService('System', 'loading', 'Verificando estado del sistema...')
          try {
            const status = await systemService.getStatus(true)
            if (status.status !== 'active') {
              throw new Error(status.message || 'Sistema no disponible')
            }
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('System', 'success', 'Sistema inicializado correctamente')
          } catch (error) {
            initLogger.error('🔴 Error en System:', error)
            throw new Error(`Error del sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      },
      {
        name: 'Database',
        weight: 25,
        dependencies: ['System'],
        init: async () => {
          updateService('Database', 'loading', 'Inicializando base de datos...')
          try {
            const status = await systemService.getStatus()
            if (!status.database?.status || status.database.status !== 'connected') {
              throw new Error(status.database?.message || 'Base de datos no conectada')
            }
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('Database', 'success', '✅ Base de datos conectada')
          } catch (error) {
            initLogger.error('🔴 Error en Database:', error)
            throw new Error(`Error de base de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      },
      {
        name: 'Settings',
        weight: 15,
        dependencies: ['Database'],
        init: async () => {
          updateService('Settings', 'loading', 'Cargando configuraciones...')
          try {
            const status = await systemService.getStatus()
            if (!status.settings?.status || status.settings.status !== 'active') {
              throw new Error(status.settings?.message || 'Error en configuraciones')
            }
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('Settings', 'success', '✅ Configuraciones cargadas')
          } catch (error) {
            initLogger.error('🔴 Error en Settings:', error)
            throw new Error(`Error de configuraciones: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      },
      {
        name: 'File System',
        weight: 25,
        dependencies: ['Settings'],
        init: async () => {
          updateService('File System', 'loading', 'Inicializando sistema de archivos...')
          try {
            const status = await systemService.getStatus()
            if (!status.fileSystem?.status || status.fileSystem.status !== 'active') {
              throw new Error(status.fileSystem?.message || 'Sistema de archivos no disponible')
            }
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('File System', 'success', '✅ Sistema de archivos listo')
          } catch (error) {
            initLogger.error('🔴 Error en File System:', error)
            throw new Error(`Error del sistema de archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      },
      {
        name: 'Thumbnails',
        weight: 25,
        dependencies: ['File System'],
        init: async () => {
          updateService('Thumbnails', 'loading', 'Inicializando servicio de miniaturas...')
          try {
            const status = await systemService.getStatus()
            if (!status.thumbnails?.status || status.thumbnails.status !== 'active') {
              throw new Error(status.thumbnails?.message || 'Servicio de miniaturas no disponible')
            }
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('Thumbnails', 'success', '✅ Servicio de miniaturas listo')
          } catch (error) {
            initLogger.error('🔴 Error en Thumbnails:', error)
            throw new Error(`Error del servicio de miniaturas: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      },
      {
        name: 'Content',
        weight: 25,
        dependencies: ['Database', 'Settings'],
        init: async () => {
          updateService('Content', 'loading', 'Cargando contenido...')
          try {
            // Cargar favoritos
            await loadFavorites()
            initLogger.info('✅ Favoritos cargados')

            // Cargar colecciones
            await loadCollections()
            initLogger.info('✅ Colecciones cargadas')

            // Cargar tags
            await loadTags()
            initLogger.info('✅ Tags cargados')

            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('Content', 'success', '✅ Contenido cargado')
          } catch (error) {
            initLogger.error('🔴 Error cargando contenido:', error)
            throw new Error(`Error cargando contenido: ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      }
    ]

    const initialize = async () => {
      const initialized = new Set<string>()
      const failed = new Set<string>()
      let totalProgress = 0

      const calculateProgress = (serviceName: string, status: 'start' | 'complete') => {
        const service = services.find(s => s.name === serviceName)
        if (!service) return

        const weight = service.weight || 100 / services.length
        if (status === 'complete') {
          totalProgress += weight
        }

        setProgress(Math.min(Math.round(totalProgress), 100))
      }

      const canInitialize = (service: ServiceInitializer): boolean => {
        if (!service.dependencies) return true
        return service.dependencies.every(dep => initialized.has(dep) && !failed.has(dep))
      }

      const initializeService = async (service: ServiceInitializer) => {
        calculateProgress(service.name, 'start')
        try {
          await service.init()
          initialized.add(service.name)
          calculateProgress(service.name, 'complete')
          initLogger.info(`✅ Servicio ${service.name} inicializado correctamente`)
        } catch (error) {
          initLogger.error(`❌ Error inicializando ${service.name}:`, error)
          failed.add(service.name)
          updateService(
            service.name,
            'error',
            error instanceof Error ? error.message : 'Error desconocido'
          )
          throw error
        }
      }

      let lastSize = -1
      while (initialized.size + failed.size < services.length) {
        const pending = services.filter(
          service => !initialized.has(service.name) && !failed.has(service.name)
        )

        const ready = pending.filter(canInitialize)
        if (ready.length === 0) {
          if (lastSize === initialized.size + failed.size) {
            initLogger.error('❌ Dependencias circulares detectadas')
            throw new Error('Error crítico: Dependencias circulares detectadas')
          }
        }

        lastSize = initialized.size + failed.size

        for (const service of ready) {
          await initializeService(service)
        }
      }

      if (initialized.size === services.length) {
        setProgress(100)
        setReady(true)
        initLogger.info('✅ Todos los servicios inicializados correctamente')
        await new Promise(resolve => setTimeout(resolve, COMPLETION_DELAY))
        setInitializing(false)
      } else {
        setReady(false)
        const failedServices = Array.from(failed)
        throw new Error(`❌ Falló la inicialización de: ${failedServices.join(', ')}`)
      }
    }

    initialize().catch(error => {
      initLogger.error('❌ Error en la inicialización:', error)
      setReady(false)
      setInitializing(false)
    })

    return () => {
      setReady(false)
      setInitializing(false)
    }
  }, [updateService, setProgress, setInitializing, setReady])
}