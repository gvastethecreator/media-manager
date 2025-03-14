'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLayerPlugin } from './layers/layer-plugin-system';
import { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';

interface SamplePreviewProps {
  type: 'patterns' | 'filters' | 'textures' | 'borders';
  onSelect?: (id: string) => void;
  selected?: string;
  className?: string;
}

interface Sample {
  id: string;
  name: string;
  imageSrc?: string;
  cssClass?: string;
  previewStyle?: React.CSSProperties;
}

export function SamplePreviews({
  type,
  onSelect,
  selected,
  className
}: SamplePreviewProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const { getLayers } = useLayerPlugin();

  // Cargar muestras según el tipo
  useEffect(() => {
    // Obtenemos las capas relacionadas con el tipo
    const layers = getLayers();
    let relevantLayer;

    switch (type) {
      case 'patterns':
        relevantLayer = layers.find(l => l.type === 'pattern');
        break;
      case 'filters':
        relevantLayer = layers.find(l => l.type === 'filter');
        break;
      case 'textures':
        relevantLayer = layers.find(l => l.type === 'texture');
        break;
      case 'borders':
        relevantLayer = layers.find(l => l.type === 'border');
        break;
      default:
        break;
    }

    if (!relevantLayer || !relevantLayer.getServerActions) {
      // Muestras de ejemplo si no hay capa relacionada
      const defaultSamples: Record<string, Sample[]> = {
        patterns: [
          { id: 'dot', name: 'Puntos', cssClass: 'bg-dot-pattern' },
          { id: 'grid', name: 'Cuadrícula', cssClass: 'bg-grid-pattern' },
          { id: 'lines', name: 'Líneas', cssClass: 'bg-lines-pattern' },
          { id: 'none', name: 'Ninguno', cssClass: 'bg-transparent' },
        ],
        filters: [
          { id: 'sepia', name: 'Sepia', previewStyle: { filter: 'sepia(0.8)' } },
          { id: 'grayscale', name: 'Escala de grises', previewStyle: { filter: 'grayscale(1)' } },
          { id: 'blur', name: 'Desenfoque', previewStyle: { filter: 'blur(1px)' } },
          { id: 'none', name: 'Ninguno', previewStyle: { filter: 'none' } },
        ],
        textures: [
          { id: 'noise', name: 'Ruido', cssClass: 'bg-noise-texture' },
          { id: 'paper', name: 'Papel', cssClass: 'bg-paper-texture' },
          { id: 'metal', name: 'Metal', cssClass: 'bg-metal-texture' },
          { id: 'none', name: 'Ninguno', cssClass: 'bg-transparent' },
        ],
        borders: [
          { id: 'solid', name: 'Sólido', previewStyle: { border: '2px solid black' } },
          { id: 'dashed', name: 'Discontinuo', previewStyle: { border: '2px dashed black' } },
          { id: 'glowing', name: 'Brillante', cssClass: 'border-glow-effect' },
          { id: 'none', name: 'Ninguno', previewStyle: { border: 'none' } },
        ],
      };

      setSamples(defaultSamples[type] || []);
      return;
    }

    // Si existe una función en la capa para obtener muestras, la usamos
    const fetchSamples = async () => {
      try {
        const serverActions = relevantLayer.getServerActions();
        // Asumiendo que hay un método para obtener muestras
        if (serverActions.getSamples) {
          const response = await serverActions.getSamples();
          if (response.success && response.data) {
            setSamples(response.data);
          }
        }
      } catch (error) {
        console.error(`Error al cargar muestras de ${type}:`, error);
      }
    };

    fetchSamples();
  }, [type, getLayers]);

  if (samples.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No hay muestras disponibles para {type}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Label className="text-xs font-medium mb-2 block">
        Seleccionar {type === 'patterns' ? 'patrón' :
                    type === 'filters' ? 'filtro' :
                    type === 'textures' ? 'textura' : 'borde'}
      </Label>
      <ScrollArea className="h-[120px]">
        <div className="grid grid-cols-3 gap-2">
          {samples.map((sample) => (
            <Card
              key={sample.id}
              className={cn(
                "relative overflow-hidden h-24 cursor-pointer transition-all",
                "hover:ring-2 hover:ring-primary/50",
                sample.id === selected && "ring-2 ring-primary",
                sample.cssClass
              )}
              style={sample.previewStyle}
              onClick={() => onSelect?.(sample.id)}
            >
              {sample.imageSrc && (
                <img
                  src={sample.imageSrc}
                  alt={sample.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium bg-background/80 px-2 py-1 rounded">
                  {sample.name}
                </span>
              </div>
              {sample.id === selected && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                  <CheckIcon className="h-3 w-3" />
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}