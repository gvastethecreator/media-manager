"use client";

import { DemoCard } from "@/components/features/entity-cards/base/demo-card";

export default function ExplosionDemoPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Demostración de Vista Explosionada</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Esta página demuestra la vista explosionada 3D de los componentes de tarjeta,
          permitiendo visualizar cada capa de efectos visuales por separado.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col items-center gap-6">
          <DemoCard showExplodeButton={true} />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Haz clic en el botón de <strong>Explotar</strong> (icono de capas) en la esquina superior derecha
              para activar la vista explosionada.
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow">
          <h2 className="text-2xl font-semibold mb-4">Vista Explosionada 3D</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">¿Qué es la vista explosionada?</h3>
              <p className="text-muted-foreground">
                La vista explosionada es una técnica de visualización que separa los componentes
                de un objeto para mostrar sus relaciones espaciales. En este caso, separamos las
                diferentes capas de efectos visuales que componen una tarjeta.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Capas visuales</h3>
              <p className="text-muted-foreground">
                Cada tarjeta está compuesta por varias capas de efectos superpuestos:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li><strong>Contenido:</strong> La capa principal con el contenido de la tarjeta</li>
                <li><strong>Borde:</strong> El marco decorativo que rodea la tarjeta</li>
                <li><strong>Textura de grano:</strong> Añade una sutil textura tipo ruido</li>
                <li><strong>Halo de luz:</strong> Efecto de reflejo que responde al cursor</li>
                <li><strong>Líneas de escaneo:</strong> Líneas horizontales tipo monitor CRT</li>
                <li><strong>Efecto holográfico:</strong> Gradientes que crean un efecto iridiscente</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Controles de la vista</h3>
              <p className="text-muted-foreground">
                En el panel lateral que aparece en modo explosión puedes:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                <li>Hacer hover sobre cada capa para resaltarla</li>
                <li>Ajustar la rotación en los ejes X e Y</li>
                <li>Modificar la separación entre capas</li>
                <li>Ajustar el desplazamiento en X e Y</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Inspiración</h3>
              <p className="text-muted-foreground">
                Esta técnica está inspirada en las ilustraciones técnicas de manuales
                y diagramas de ingeniería, donde se "explota" un objeto para mostrar
                su composición interna. Aplicada al diseño de interfaces, permite entender
                mejor cómo se construyen efectos visuales complejos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}