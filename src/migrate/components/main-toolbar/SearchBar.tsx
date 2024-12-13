import React from 'react'
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

export function SearchBar() {
  return (
    <div className="relative hidden lg:block">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Buscar..." className="w-64 pl-8" />
    </div>
  )
}

