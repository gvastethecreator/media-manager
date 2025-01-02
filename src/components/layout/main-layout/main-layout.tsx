"use client";

import { LeftPanel } from '@/components/layout/left-panel/left-panel'
import { RightPanel } from '@/components/layout/right-panel/right-panel'
import { ViewContainer } from '@/components/views/view-container';

export function MainLayout() {


  return (
    <div className="flex h-full">
      {/* Panel Izquierdo - 20% */}
      <div className="w-[20%] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <LeftPanel />
      </div>

      {/* Contenido Principal - 60% */}
      <div className="w-[60%]">
        <ViewContainer />
      </div>

      {/* Panel Derecho - 20% */}
      <div className="w-[20%] border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <RightPanel/>
      </div>
    </div>
  )
}
// Compare this snippet from src/components/core/layout/main-layout/main-layout.tsx: