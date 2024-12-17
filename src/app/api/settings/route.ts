import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { DEFAULT_SETTINGS } from '@/types/settings'

const settingsPath = path.join(process.cwd(), 'settings.json')

export async function GET() {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    // Si el archivo no existe, creamos uno nuevo con la configuración por defecto
    await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function POST(request: Request) {
  try {
    const settings = await request.json()
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar la configuración' },
      { status: 500 }
    )
  }
}