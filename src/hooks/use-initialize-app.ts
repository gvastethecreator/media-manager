"use client"

import { useEffect } from 'react'
import { useLoadingStore } from '@/store/loading-store'

interface ServiceInitializer {
  name: string
  init: () => Promise<void>
  dependencies?: string[]
}

export function useInitializeApp() {
  const { updateService, setProgress, setInitializing, setReady } = useLoadingStore()

  useEffect(() => {
    const services: ServiceInitializer[] = [
      {
        name: 'System',
        init: async () => {
          updateService('System', 'loading', 'Verificando estado del sistema...')
          try {
            const response = await fetch('/api/system/status')
            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Error al obtener estado del sistema')
            }
            const stats = await response.json()
            if (stats.status !== 'active') throw new Error('Sistema no activo')
            updateService('System', 'success', 'Sistema inicializado')
          } catch (error) {
            console.error('Error en System:', error)
            throw error
          }
        }
      },
      {
        name: 'Database',
        dependencies: ['System'],
        init: async () => {
          updateService('Database', 'loading', 'Conectando a la base de datos...')
          try {
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al verificar base de datos')
            const { database } = await response.json()
            if (!database || database.status !== 'connected') {
              throw new Error(database?.message || 'Base de datos no conectada')
            }
            updateService('Database', 'success', database.message)
          } catch (error) {
            console.error('Error en Database:', error)
            throw error
          }
        }
      },
      {
        name: 'File System',
        dependencies: ['System'],
        init: async () => {
          updateService('File System', 'loading', 'Verificando sistema de archivos...')
          try {
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al verificar sistema de archivos')
            const { fileSystem } = await response.json()
            if (!fileSystem || fileSystem.status !== 'active') {
              throw new Error(fileSystem?.message || 'Sistema de archivos no disponible')
            }
            updateService('File System', 'success', 'Sistema de archivos inicializado')
          } catch (error) {
            console.error('Error en File System:', error)
            throw error
          }
        }
      },
      {
        name: 'Settings',
        dependencies: ['Database'],
        init: async () => {
          updateService('Settings', 'loading', 'Cargando configuraciones...')
          try {
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al cargar configuraciones')
            const { settings } = await response.json()
            if (!settings || settings.status !== 'active') {
              throw new Error(settings?.message || 'Error en configuraciones')
            }
            updateService('Settings', 'success', settings.message)
          } catch (error) {
            console.error('Error en Settings:', error)
            throw error
          }
        }
      },
      {
        name: 'Thumbnails',
        dependencies: ['File System', 'Settings'],
        init: async () => {
          updateService('Thumbnails', 'loading', 'Verificando servicio de miniaturas...')
          try {
            const response = await fetch('/api/system/status')
            if (!response.ok) throw new Error('Error al verificar miniaturas')
            const { thumbnails } = await response.json()
            if (!thumbnails || thumbnails.status !== 'active') {
              throw new Error(thumbnails?.message || 'Servicio de miniaturas no disponible')
            }
            updateService('Thumbnails', 'success', thumbnails.message)
          } catch (error) {
            console.error('Error en Thumbnails:', error)
            throw error
          }
        }
      }
    ]

    const initialize = async () => {
      const initialized = new Set<string>()
      const failed = new Set<string>()

      const canInitialize = (service: ServiceInitializer): boolean => {
        if (!service.dependencies) return true
        return service.dependencies.every(dep => initialized.has(dep) && !failed.has(dep))
      }

      const initializeService = async (service: ServiceInitializer) => {
        try {
          await service.init()
          initialized.add(service.name)
          console.log(`✅ Servicio ${service.name} inicializado correctamente`)
        } catch (error) {
          console.error(`❌ Error inicializando ${service.name}:`, error)
          failed.add(service.name)
          updateService(
            service.name,
            'error',
            error instanceof Error ? error.message : 'Error desconocido'
          )
        }
      }

      // Inicializar servicios secuencialmente respetando dependencias
      let lastSize = -1
      while (initialized.size + failed.size < services.length) {
        const pending = services.filter(
          service => !initialized.has(service.name) && !failed.has(service.name)
        )

        const ready = pending.filter(canInitialize)
        if (ready.length === 0) {
          if (lastSize === initialized.size + failed.size) {
            console.error('❌ Dependencias circulares detectadas')
            break
          }
        }

        lastSize = initialized.size + failed.size

        // Inicializar servicios uno por uno para mejor control
        for (const service of ready) {
          await initializeService(service)
        }
      }

      // Si todos los servicios se inicializaron correctamente
      if (initialized.size === services.length) {
        setReady(true)
        console.log('✅ Todos los servicios inicializados correctamente')
        // Pequeño delay para asegurar una transición suave
        await new Promise(resolve => setTimeout(resolve, 300))
        setInitializing(false)
      } else {
        // Si algún servicio falló
        setReady(false)
        const failedServices = Array.from(failed)
        console.error('❌ Falló la inicialización de los servicios:', failedServices)
        throw new Error(`Falló la inicialización de: ${failedServices.join(', ')}`)
      }
    }

    initialize().catch(error => {
      console.error('❌ Error en la inicialización:', error)
      setReady(false)
      setInitializing(false)
    })

    // Cleanup
    return () => {
      setReady(false)
      setInitializing(false)
    }
  }, [updateService, setProgress, setInitializing, setReady])
}