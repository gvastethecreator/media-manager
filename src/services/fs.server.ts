import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

// Esta función debe ser llamada solo en el servidor
export const fsService = {
  async validatePath(folderPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Normalizar la ruta para Windows
      const normalizedPath = this.normalizePath(folderPath)

      // Verificar si la ruta existe
      const stats = await fs.stat(normalizedPath)

      if (!stats.isDirectory()) {
        return { valid: false, error: 'La ruta no es un directorio' }
      }

      // Verificar permisos de lectura
      try {
        await fs.access(normalizedPath, fs.constants.R_OK)
      } catch (error) {
        return { valid: false, error: 'No tienes permisos de lectura en esta carpeta' }
      }

      return { valid: true }
    } catch (error) {
      console.error('Error validando ruta:', error)
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { valid: false, error: 'La carpeta no existe' }
      }
      return { valid: false, error: 'La ruta no es accesible' }
    }
  },

  async listFiles(folderPath: string): Promise<{ name: string; path: string; size: number }[]> {
    try {
      const normalizedPath = this.normalizePath(folderPath)
      const files = await fs.readdir(normalizedPath)
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(normalizedPath, file)
          try {
            const stats = await fs.stat(filePath)
            if (stats.isFile()) {
              return {
                name: file,
                path: this.normalizePath(filePath),
                size: stats.size
              }
            }
            return null
          } catch (error) {
            console.error(`Error procesando archivo ${file}:`, error)
            return null
          }
        })
      )
      return fileDetails.filter((file): file is NonNullable<typeof file> => file !== null)
    } catch (error) {
      console.error('Error listando archivos:', error)
      throw new Error('No se pudo listar los archivos del directorio')
    }
  },

  async calculateFileHash(filePath: string): Promise<string> {
    try {
      const normalizedPath = this.normalizePath(filePath)
      const fileBuffer = await fs.readFile(normalizedPath)
      const hashSum = crypto.createHash('sha256')
      hashSum.update(fileBuffer)
      return hashSum.digest('hex')
    } catch (error) {
      console.error('Error calculando hash:', error)
      throw new Error('No se pudo calcular el hash del archivo')
    }
  },

  async getFileMetadata(filePath: string) {
    try {
      const normalizedPath = this.normalizePath(filePath)
      const stats = await fs.stat(normalizedPath)
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      }
    } catch (error) {
      console.error('Error obteniendo metadata:', error)
      throw new Error('No se pudo obtener la metadata del archivo')
    }
  },

  async isImage(filePath: string): Promise<boolean> {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']
    const ext = path.extname(filePath).toLowerCase()
    return imageExtensions.includes(ext)
  },

  normalizePath(folderPath: string): string {
    // Normalizar la ruta para Windows
    const normalized = path.normalize(folderPath)
    // Asegurarnos de que use backslashes
    return normalized.replace(/\//g, '\\')
  }
}

export async function initializeFileSystem() {
  try {
    // Verificar y crear directorios necesarios
    const requiredDirs = [
      'uploads',
      'thumbnails',
      'temp',
      'cache'
    ]

    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir)
      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
        console.log(`📁 [FileSystem] Directorio creado: ${dir}`)
      }
    }

    // Sincronizar carpetas en la base de datos
    const folders = await prisma.folder.findMany()
    for (const folder of folders) {
      try {
        await fs.access(folder.path)
      } catch {
        console.warn(`⚠️ [FileSystem] Carpeta no encontrada: ${folder.path}`)
        // Opcional: Marcar la carpeta como no disponible en la base de datos
      }
    }

    console.log('📂 [FileSystem] Sistema de archivos inicializado')
    return true
  } catch (error) {
    console.error('❌ [FileSystem] Error al inicializar:', error)
    throw error
  }
}
