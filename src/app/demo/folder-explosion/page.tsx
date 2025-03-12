"use client";

import { FolderCard } from "@/components/features/entity-cards/folder/folder-card";

export default function FolderExplosionDemoPage() {
  const demoFolder = {
    id: "demo-folder-1",
    name: "Imágenes de Ejemplo",
    path: "/ruta/ejemplo",
    createdAt: new Date().toISOString(),
    lastIndexed: new Date().toISOString(),
    totalSize: "15728640", // 15MB en bytes
    _count: {
      images: 48
    },
    recentImages: [
      "https://images.unsplash.com/photo-1682687982501-1e58ab814714",
      "https://images.unsplash.com/photo-1682695796497-31a44224d6d6",
      "https://images.unsplash.com/photo-1669677911796-23cb93768b9f",
      "https://images.unsplash.com/photo-1673468199846-5a35de5f6dcd",
      "https://images.unsplash.com/photo-1428908799722-0a74e26ce500",
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564"
    ]
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Vista Explosionada en FolderCard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Esta página demuestra cómo el efecto de vista explosionada 3D se aplica al componente FolderCard,
          permitiendo visualizar todas sus capas de efectos visuales.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md">
            <FolderCard
              folder={demoFolder}
              enableExplode={true}
              showVisualConfig={true}
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Haz clic en el botón de <strong>Explotar</strong> (icono de capas) en la esquina superior derecha
              para activar la vista explosionada.
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow">
          <h2 className="text-2xl font-semibold mb-4">Carpetas con Efectos Visuales</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Vista explosionada en carpetas</h3>
              <p className="text-muted-foreground">
                La vista explosionada es especialmente útil para analizar cómo se componen visualmente
                las carpetas, que suelen tener contenido más complejo y variado que las tarjetas simples.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Capas visuales específicas</h3>
              <p className="text-muted-foreground">
                El componente FolderCard utiliza todas las capas visuales disponibles en BaseCard, pero
                adapta su estilo y contenido para representar carpetas de imágenes:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li><strong>Contenido:</strong> Incluye la cuadrícula de imágenes en miniatura</li>
                <li><strong>Indicador de importancia:</strong> Borde lateral codificado por colores</li>
                <li><strong>Interacciones:</strong> Cambio de icono de carpeta cerrada a abierta en hover</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Beneficios de la vista explosionada</h3>
              <p className="text-muted-foreground">
                Utilizar la vista explosionada en el contexto de carpetas permite:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Entender mejor la estructura visual de la representación de carpetas</li>
                <li>Analizar cómo interactúan los efectos visuales con el contenido</li>
                <li>Ajustar la configuración visual para optimizar la experiencia del usuario</li>
                <li>Comunicar de manera efectiva el diseño a otros miembros del equipo</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Combinación con configuración visual</h3>
              <p className="text-muted-foreground">
                Al combinar la vista explosionada con el panel de configuración visual, los
                diseñadores y desarrolladores pueden experimentar con diferentes combinaciones de
                efectos y ver inmediatamente cómo afectan a la apariencia y legibilidad de la carpeta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}