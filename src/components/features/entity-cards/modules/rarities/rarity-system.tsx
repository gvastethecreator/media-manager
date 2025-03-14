'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RocketIcon, ShieldCheckIcon, SparklesIcon, StarIcon } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';

// Definición de una rareza
export interface RarityDefinition {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  glowColor: string;
  backgroundColor?: string;
  icon?: React.ReactNode;
  borderWidth?: number;
  glowIntensity?: number;
  description?: string;
  chance?: number; // Probabilidad de aparición (0-100)
  level?: number; // Nivel jerárquico (1 = común, 5 = legendario, etc.)
  effects?: {
    enableGlitch?: boolean;
    enableChromatic?: boolean;
    enablePixelate?: boolean;
    enableDistortion?: boolean;
    [key: string]: boolean | number | string | undefined;
  };
}

// Lista de rarezas predefinidas
export const DEFAULT_RARITIES: RarityDefinition[] = [
  {
    id: 'common',
    name: 'Común',
    color: '#9ca3af', // Gris
    borderColor: '#9ca3af99',
    glowColor: '#9ca3af33',
    backgroundColor: '#f3f4f6',
    icon: <ShieldCheckIcon className="h-3 w-3" />,
    borderWidth: 1,
    glowIntensity: 0,
    description: 'Objetos básicos y fáciles de encontrar',
    chance: 70,
    level: 1,
    effects: {},
  },
  {
    id: 'uncommon',
    name: 'Poco común',
    color: '#22c55e', // Verde
    borderColor: '#22c55e99',
    glowColor: '#22c55e33',
    backgroundColor: '#ecfdf5',
    icon: <RocketIcon className="h-3 w-3" />,
    borderWidth: 1.5,
    glowIntensity: 2,
    description: 'Objetos menos frecuentes con atributos mejorados',
    chance: 20,
    level: 2,
    effects: {},
  },
  {
    id: 'rare',
    name: 'Raro',
    color: '#3b82f6', // Azul
    borderColor: '#3b82f699',
    glowColor: '#3b82f633',
    backgroundColor: '#eff6ff',
    icon: <StarIcon className="h-3 w-3" />,
    borderWidth: 2,
    glowIntensity: 5,
    description: 'Objetos raros con características especiales',
    chance: 7,
    level: 3,
    effects: {
      enableGlitch: false,
      enableChromatic: true,
    },
  },
  {
    id: 'epic',
    name: 'Épico',
    color: '#a855f7', // Púrpura
    borderColor: '#a855f799',
    glowColor: '#a855f755',
    backgroundColor: '#f5f3ff',
    icon: <SparklesIcon className="h-3 w-3" />,
    borderWidth: 2.5,
    glowIntensity: 10,
    description: 'Objetos muy raros con poderes excepcionales',
    chance: 2.5,
    level: 4,
    effects: {
      enableGlitch: false,
      enableChromatic: true,
      enableDistortion: true,
    },
  },
  {
    id: 'legendary',
    name: 'Legendario',
    color: '#eab308', // Dorado
    borderColor: '#eab308bb',
    glowColor: '#eab30866',
    backgroundColor: '#fefce8',
    icon: <SparklesIcon className="h-3 w-3" />,
    borderWidth: 3,
    glowIntensity: 15,
    description: 'Objetos extremadamente raros y poderosos',
    chance: 0.5,
    level: 5,
    effects: {
      enableGlitch: true,
      enableChromatic: true,
      enableDistortion: true,
      enablePixelate: true,
    },
  },
];

// Componente para mostrar un indicador de rareza
interface RarityBadgeProps {
  rarity: RarityDefinition;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  size = 'md',
  showName = true,
  showIcon = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] py-0.5 px-1.5',
    md: 'text-xs py-1 px-2',
    lg: 'text-sm py-1.5 px-3',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: rarity.backgroundColor || `${rarity.color}10`,
        color: rarity.color,
        border: `1px solid ${rarity.borderColor}`,
        boxShadow: rarity.glowIntensity ? `0 0 ${rarity.glowIntensity}px ${rarity.glowColor}` : 'none',
      }}
    >
      {showIcon && rarity.icon && <span className="mr-1">{rarity.icon}</span>}
      {showName && <span>{rarity.name}</span>}
    </div>
  );
};

// Componente para seleccionar una rareza
interface RaritySelectorProps {
  rarities?: RarityDefinition[];
  selectedRarityId?: string;
  onSelectRarity: (rarity: RarityDefinition) => void;
  showChance?: boolean;
  showLevel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  displayType?: 'grid' | 'list';
}

export const RaritySelector: React.FC<RaritySelectorProps> = ({
  rarities = DEFAULT_RARITIES,
  selectedRarityId,
  onSelectRarity,
  showChance = false,
  showLevel = false,
  size = 'md',
  displayType = 'grid',
}) => {
  const handleSelectRarity = (rarity: RarityDefinition) => {
    onSelectRarity(rarity);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Seleccionar rareza</Label>
      <div className={cn(
        displayType === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col space-y-2'
      )}>
        {rarities.map((rarity) => (
          <Button
            key={rarity.id}
            type="button"
            variant={selectedRarityId === rarity.id ? 'default' : 'outline'}
            className={cn(
              'flex items-center justify-between w-full py-1',
              size === 'sm' ? 'text-xs p-2' : '',
              size === 'md' ? 'text-sm p-2.5' : '',
              size === 'lg' ? 'text-base p-3' : '',
              selectedRarityId === rarity.id
                ? `bg-${rarity.color} text-white`
                : 'bg-transparent hover:bg-secondary/20'
            )}
            onClick={() => handleSelectRarity(rarity)}
            style={{
              borderColor: selectedRarityId === rarity.id ? rarity.borderColor : undefined,
              boxShadow: selectedRarityId === rarity.id ? `0 0 ${rarity.glowIntensity || 5}px ${rarity.glowColor}` : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              {rarity.icon && <span>{rarity.icon}</span>}
              <span>{rarity.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {showChance && <span>{rarity.chance}%</span>}
              {showLevel && <span>Nv. {rarity.level}</span>}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

// Componente para el sistema de rareza automático
interface RaritySystemProps {
  entityType: string;
  entityId?: string;
  initialDistribution?: Record<string, number>; // id: chance (%)
  onChange?: (distribution: Record<string, number>) => void;
  rarities?: RarityDefinition[];
  enabled?: boolean;
}

export const RaritySystem: React.FC<RaritySystemProps> = ({
  entityType,
  entityId,
  initialDistribution,
  onChange,
  rarities = DEFAULT_RARITIES,
  enabled = true,
}) => {
  // Estado para la distribución de rareza
  const [distribution, setDistribution] = useState<Record<string, number>>(
    initialDistribution ||
    rarities.reduce((acc, rarity) => {
      acc[rarity.id] = rarity.chance || 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // Manejar cambios en la distribución
  const handleDistributionChange = (id: string, chance: number) => {
    const newDistribution = {
      ...distribution,
      [id]: chance,
    };
    setDistribution(newDistribution);
    onChange?.(newDistribution);
  };

  if (!enabled) {
    return null;
  }

  return (
    <Card className="p-3 space-y-3">
      <h3 className="text-sm font-medium">Sistema de rareza para {entityType}</h3>

      <div className="space-y-4">
        {rarities.map((rarity) => (
          <div key={rarity.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RarityBadge rarity={rarity} size="sm" />
                <span className="text-xs font-medium">{rarity.name}</span>
              </div>
              <span className="text-xs font-mono">{distribution[rarity.id] || 0}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={distribution[rarity.id] || 0}
              onChange={(e) => handleDistributionChange(rarity.id, Number.parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: rarity.color,
              }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

// Función para calcular aleatoriamente una rareza basada en la distribución
export function calculateRandomRarity(
  distribution: Record<string, number>,
  rarities: RarityDefinition[] = DEFAULT_RARITIES
): RarityDefinition {
  // Verificar que las probabilidades sumen 100%
  const totalChance = Object.values(distribution).reduce((sum, chance) => sum + chance, 0);
  const normalizedDistribution = totalChance !== 100
    ? Object.entries(distribution).reduce((acc, [id, chance]) => {
        acc[id] = (chance / totalChance) * 100;
        return acc;
      }, {} as Record<string, number>)
    : distribution;

  // Generar un número aleatorio entre 0 y 100
  const random = Math.random() * 100;

  // Determinar la rareza basada en la distribución acumulada
  let cumulativeChance = 0;
  for (const rarity of rarities) {
    const chance = normalizedDistribution[rarity.id] || 0;
    cumulativeChance += chance;
    if (random <= cumulativeChance) {
      return rarity;
    }
  }

  // Si algo sale mal, devolver la rareza más común
  return rarities.find(r => r.id === 'common') || rarities[0];
}