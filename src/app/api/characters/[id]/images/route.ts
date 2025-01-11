import { NextResponse } from "next/server";
import { characterService } from "@/services/character.service";
import { logger } from "@/lib/logger";

const characterLogger = logger.withContext("CharactersAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    characterLogger.info('📥 GET /api/characters/[id]/images', params.id);
    const images = await characterService.getCharacterImages(params.id);
    return NextResponse.json(images);
  } catch (error) {
    characterLogger.error('❌ Error en GET /api/characters/[id]/images:', error);
    return NextResponse.json(
      { error: 'Error al obtener imágenes del personaje' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { imageId } = await request.json();
    characterLogger.info('📤 POST /api/characters/[id]/images', { characterId: params.id, imageId });
    await characterService.addImageToCharacter(params.id, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    characterLogger.error('❌ Error en POST /api/characters/[id]/images:', error);
    return NextResponse.json(
      { error: 'Error al agregar imagen al personaje' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { imageId } = await request.json();
    characterLogger.info('🗑️ DELETE /api/characters/[id]/images', { characterId: params.id, imageId });
    await characterService.removeImageFromCharacter(params.id, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    characterLogger.error('❌ Error en DELETE /api/characters/[id]/images:', error);
    return NextResponse.json(
      { error: 'Error al eliminar imagen del personaje' },
      { status: 500 }
    );
  }
}