import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isFavorite } = await request.json();

    // Actualizar el estado de favorito en la base de datos
    const updatedImage = await prisma.image.update({
      where: { id },
      data: { isFavorite },
      select: {
        id: true,
        name: true,
        isFavorite: true,
      },
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error("Error updating favorite status:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de favorito" },
      { status: 500 }
    );
  }
}