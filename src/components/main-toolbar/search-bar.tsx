import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
    <Input
      type="search"
      placeholder="Search..."
      className="h-9 md:w-[300px] lg:w-[400px]"
    />
  )
}