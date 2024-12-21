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
          const response = await fetch('/api/system/status')
          if (!response.ok) throw new Error('Error al obtener estado del sistema')
          const stats = await response.json()
          if (stats.status !== 'active') throw new Error('Sistema no activo')
          updateService('System', 'success', 'Sistema inicializado')
        }
      },
      {
        name: 'Database',
        dependencies: ['System'],
        init: async () => {
          updateService('Database', 'loading', 'Conectando a la base de datos...')
          const response = await fetch('/api/system/status')
          if (!response.ok) throw new Error('Error al verificar base de datos')
          const { database } = await response.json()
          if (database.status !== 'connected') {
            throw new Error('Base de datos no conectada')
          }
          updateService('Database', 'success', database.message)
        }
      },
      {
        name: 'File System',
        dependencies: ['System'],
        init: async () => {
          updateService('File System', 'loading', 'Verificando sistema de archivos...')
          const response = await fetch('/api/system/status')
          if (!response.ok) throw new Error('Error al verificar sistema de archivos')
          const { fileSystem } = await response.json()
          if (fileSystem.status !== 'active') {
            throw new Error('Sistema de archivos no disponible')
          }
          updateService('File System', 'success', 'Sistema de archivos inicializado')
        }
      },
      {
        name: 'Settings',
        dependencies: ['Database'],
        init: async () => {
          updateService('Settings', 'loading', 'Cargando configuraciones...')
          const response = await fetch('/api/system/status')
          if (!response.ok) throw new Error('Error al cargar configuraciones')
          const { settings } = await response.json()
          if (settings.status !== 'active') {
            throw new Error('Error en configuraciones')
          }
          updateService('Settings', 'success', settings.message)
        }
      },
      {
        name: 'Thumbnails',
        dependencies: ['File System', 'Settings'],
        init: async () => {
          updateService('Thumbnails', 'loading', 'Verificando servicio de miniaturas...')
          const response = await fetch('/api/system/status')
          if (!response.ok) throw new Error('Error al verificar miniaturas')
          const { thumbnails } = await response.json()
          if (thumbnails.status !== 'active') {
            throw new Error('Servicio de miniaturas no disponible')
          }
          updateService('Thumbnails', 'success', thumbnails.message)
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
        } catch (error) {
          console.error(`Error initializing ${service.name}:`, error)
          failed.add(service.name)
          updateService(
            service.name,
            'error',
            error instanceof Error ? error.message : 'Error desconocido'
          )
        }
      }

      // Inicializar servicios en paralelo respetando dependencias
      while (initialized.size + failed.size < services.length) {
        const pending = services.filter(
          service => !initialized.has(service.name) && !failed.has(service.name)
        )

        const ready = pending.filter(canInitialize)
        if (ready.length === 0) break // Evitar bucle infinito si hay dependencias circulares

        await Promise.all(ready.map(initializeService))
      }

      // Si todos los servicios se inicializaron correctamente
      if (initialized.size === services.length) {
        setReady(true)
        // Pequeño delay para asegurar una transición suave
        await new Promise(resolve => setTimeout(resolve, 300))
        setInitializing(false)
      } else {
        // Si algún servicio falló
        setReady(false)
        console.error('Initialization failed for services:', Array.from(failed))
      }
    }

    initialize()
  }, [updateService, setProgress, setInitializing, setReady])
}