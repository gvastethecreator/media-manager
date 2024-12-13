"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  onSearch: (term: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = "Search files..." }: SearchBarProps) {
  return (
    <div className="relative w-full md:w-[300px] lg:w-[400px]">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-8"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  )
}