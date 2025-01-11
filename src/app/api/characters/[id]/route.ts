import { NextResponse } from "next/server";
import { characterService } from "@/services/character.service";
import { logger } from "@/lib/logger";

const characterLogger = logger.withContext("CharactersAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    characterLogger.info("📥 GET /api/characters/[id]", params.id);
    const character = await characterService.getCharacter(params.id);
    if (!character) {
      return NextResponse.json(
        { error: "Personaje no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(character);
  } catch (error) {
    characterLogger.error("❌ Error en GET /api/characters/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener personaje" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    characterLogger.info("📤 PUT /api/characters/[id]", { id: params.id, data });
    const character = await characterService.updateCharacter(params.id, data);
    return NextResponse.json(character);
  } catch (error) {
    characterLogger.error("❌ Error en PUT /api/characters/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar personaje" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    characterLogger.info("🗑️ DELETE /api/characters/[id]", params.id);
    await characterService.deleteCharacter(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    characterLogger.error("❌ Error en DELETE /api/characters/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar personaje" },
      { status: 500 }
    );
  }
}