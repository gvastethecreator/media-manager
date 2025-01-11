import { NextResponse } from "next/server";
import { characterService } from "@/services/character.service";
import { logger } from "@/lib/logger";

const characterLogger = logger.withContext("CharactersAPI");

export async function GET() {
  try {
    characterLogger.info("📥 GET /api/characters");
    const characters = await characterService.getCharacters();
    return NextResponse.json(characters);
  } catch (error) {
    characterLogger.error("❌ Error en GET /api/characters:", error);
    return NextResponse.json(
      { error: "Error al obtener personajes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    characterLogger.info("📤 POST /api/characters", data);
    const character = await characterService.createCharacter(data);
    return NextResponse.json(character);
  } catch (error) {
    characterLogger.error("❌ Error en POST /api/characters:", error);
    return NextResponse.json(
      { error: "Error al crear personaje" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = request.url.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID de personaje no proporcionado" },
        { status: 400 }
      );
    }

    characterLogger.info("📝 Actualizando personaje:", { id, body });

    const character = await prisma.character.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const formattedCharacter = {
      ...character,
      count: character._count.images,
      _count: undefined,
    };

    characterLogger.info("✅ Personaje actualizado:", formattedCharacter);

    return NextResponse.json(formattedCharacter);
  } catch (error) {
    characterLogger.error("❌ Error al actualizar personaje:", error);
    return NextResponse.json(
      { error: "Error al actualizar personaje" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID de personaje no proporcionado" },
        { status: 400 }
      );
    }

    characterLogger.info("🗑️ Eliminando personaje:", id);

    await prisma.character.delete({
      where: { id },
    });

    characterLogger.info("✅ Personaje eliminado:", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    characterLogger.error("❌ Error al eliminar personaje:", error);
    return NextResponse.json(
      { error: "Error al eliminar personaje" },
      { status: 500 }
    );
  }
}