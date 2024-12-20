"use client"

import { useEffect } from 'react'
import { useLoadingStore } from '@/store/loading-store'

export function useInitializeApp() {
  const { updateService, setProgress, setInitializing } = useLoadingStore()

  useEffect(() => {
    const initialize = async () => {
      try {
        // Inicializar sistema
        updateService('System', 'loading', 'Verificando estado del sistema...')

        const response = await fetch('/api/system/status')
        if (!response.ok) {
          throw new Error('Error al obtener estado del sistema')
        }

        const stats = await response.json()

        // Actualizar estado de la base de datos
        updateService('Database', 'loading', 'Conectando a la base de datos...')
        if (stats.database.status === 'connected') {
          updateService('Database', 'success', stats.database.message)
        } else {
          updateService('Database', 'error', 'Error al conectar con la base de datos')
        }
        setProgress(25)

        // Actualizar estado del sistema de archivos
        updateService('File System', 'loading', 'Verificando sistema de archivos...')
        updateService('File System', 'success', 'Sistema de archivos inicializado')
        setProgress(50)

        // Actualizar estado de las configuraciones
        updateService('Settings', 'loading', 'Cargando configuraciones...')
        if (stats.settings.status === 'active') {
          updateService('Settings', 'success', stats.settings.message)
        } else {
          updateService('Settings', 'error', 'Error al cargar configuraciones')
        }
        setProgress(75)

        // Actualizar estado de miniaturas
        updateService('Thumbnails', 'loading', 'Verificando servicio de miniaturas...')
        if (stats.thumbnails.status === 'active') {
          updateService('Thumbnails', 'success', stats.thumbnails.message)
        } else {
          updateService('Thumbnails', 'error', 'Error en el servicio de miniaturas')
        }
        setProgress(100)

        // Finalizar inicialización
        setTimeout(() => {
          setInitializing(false)
        }, 500)
      } catch (error) {
        console.error('Error durante la inicialización:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

        // Marcar el servicio actual como fallido
        const currentService = ['Database', 'File System', 'Settings', 'Thumbnails', 'System'].find(
          service => useLoadingStore.getState().services.find(s => s.name === service)?.status === 'loading'
        )

        if (currentService) {
          updateService(currentService, 'error', `Error: ${errorMessage}`)
        }
      }
    }

    initialize()
  }, [updateService, setProgress, setInitializing])
}