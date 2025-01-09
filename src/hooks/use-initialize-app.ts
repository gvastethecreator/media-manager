"use client"

import { useEffect } from 'react'
import { useLoadingStore } from '@/store/loading-store'

interface ServiceInitializer {
  name: string
  init: () => Promise<void>
  dependencies?: string[]
  weight?: number // Peso para el cálculo del progreso
}

const INITIALIZATION_DELAY = 300 // ms entre servicios para mejor UX
const COMPLETION_DELAY = 500 // ms antes de completar

export function useInitializeApp() {
  const { updateService, setProgress, setInitializing, setReady } = useLoadingStore()

  useEffect(() => {
    const services: ServiceInitializer[] = [
      {
        name: 'System',
        weight: 10,
        init: async () => {
          updateService('System', 'loading', 'Verificando estado del sistema...')
          try {
            const response = await fetch('/api/system/status')
            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Error al obtener estado del sistema')
            }
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            updateService('System', 'success', 'Sistema inicializado correctamente')
          } catch (error) {
            console.error('🔴 Error en System:', error)
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
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al verificar base de datos')
            const { database } = await response.json()
            if (!database?.status) throw new Error('Estado de base de datos no disponible')

            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            if (database.status !== 'connected') {
              throw new Error(database?.message || 'Base de datos no conectada')
            }
            updateService('Database', 'success', '✅ Base de datos conectada')
          } catch (error) {
            console.error('🔴 Error en Database:', error)
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
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al cargar configuraciones')
            const { settings } = await response.json()

            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            if (!settings?.status || settings.status !== 'active') {
              throw new Error(settings?.message || 'Error en configuraciones')
            }
            updateService('Settings', 'success', '✅ Configuraciones cargadas')
          } catch (error) {
            console.error('🔴 Error en Settings:', error)
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
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al verificar sistema de archivos')
            const { fileSystem } = await response.json()

            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            if (!fileSystem?.status || fileSystem.status !== 'active') {
              throw new Error(fileSystem?.message || 'Sistema de archivos no disponible')
            }
            updateService('File System', 'success', '✅ Sistema de archivos listo')
          } catch (error) {
            console.error('🔴 Error en File System:', error)
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
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al verificar miniaturas')
            const { thumbnails } = await response.json()

            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY))
            if (!thumbnails?.status || thumbnails.status !== 'active') {
              throw new Error(thumbnails?.message || 'Servicio de miniaturas no disponible')
            }
            updateService('Thumbnails', 'success', '✅ Servicio de miniaturas listo')
          } catch (error) {
            console.error('🔴 Error en Thumbnails:', error)
            throw new Error(`Error del servicio de miniaturas: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
          console.log(`✅ Servicio ${service.name} inicializado correctamente`)
        } catch (error) {
          console.error(`❌ Error inicializando ${service.name}:`, error)
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
            console.error('❌ Dependencias circulares detectadas')
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
        console.log('✅ Todos los servicios inicializados correctamente')
        await new Promise(resolve => setTimeout(resolve, COMPLETION_DELAY))
        setInitializing(false)
      } else {
        setReady(false)
        const failedServices = Array.from(failed)
        throw new Error(`❌ Falló la inicialización de: ${failedServices.join(', ')}`)
      }
    }

    initialize().catch(error => {
      console.error('❌ Error en la inicialización:', error)
      setReady(false)
      setInitializing(false)
    })

    return () => {
      setReady(false)
      setInitializing(false)
    }
  }, [updateService, setProgress, setInitializing, setReady])
}