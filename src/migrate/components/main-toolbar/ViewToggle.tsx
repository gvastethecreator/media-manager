import React from 'react'
import { Button } from "@/components/ui/button"
import { LayoutGrid, List, Table2 } from 'lucide-react'

interface ViewToggleProps {
  view: 'grid' | 'list' | 'details'
  setView: (view: 'grid' | 'list' | 'details') => void
}

export function ViewToggle({ view, setView }: ViewToggleProps) {
  return (
    <div className="hidden lg:flex items-center gap-1">
      <Button 
        variant={view === 'grid' ? 'secondary' : 'ghost'} 
        size="icon" 
        onClick={() => setView('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button 
        variant={view === 'list' ? 'secondary' : 'ghost'} 
        size="icon" 
        onClick={() => setView('list')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button 
        variant={view === 'details' ? 'secondary' : 'ghost'} 
        size="icon" 
        onClick={() => setView('details')}
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

